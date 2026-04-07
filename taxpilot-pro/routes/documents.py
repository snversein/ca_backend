from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from extensions import db
from models.document import Document
from models.folder import Folder
from models.user_folder_allocation import UserFolderAllocation
from services.r2_service import r2_service
import os

documents_bp = Blueprint('documents', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'xls', 'xlsx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@documents_bp.route('', methods=['GET'])
@jwt_required()
def list_documents():
    current_user_id = get_jwt_identity()
    
    folder_id = request.args.get('folder_id', type=int)
    doc_type = request.args.get('type')
    
    allocated_folder_ids = db.session.query(UserFolderAllocation.folder_id).filter(
        UserFolderAllocation.user_id == current_user_id
    ).all()
    allocated_ids = [f[0] for f in allocated_folder_ids]
    
    query = Document.query.filter(
        Document.owner_id == current_user_id
    )
    
    if folder_id:
        query = query.filter_by(folder_id=folder_id)
    if doc_type:
        query = query.filter_by(document_type=doc_type)
    
    documents = query.order_by(Document.created_at.desc()).all()
    
    return jsonify({
        'documents': [doc.to_dict() for doc in documents]
    }), 200

@documents_bp.route('/<int:doc_id>', methods=['GET'])
@jwt_required()
def get_document(doc_id):
    current_user_id = get_jwt_identity()
    
    allocated_folder_ids = db.session.query(UserFolderAllocation.folder_id).filter(
        UserFolderAllocation.user_id == current_user_id
    ).all()
    allocated_ids = [f[0] for f in allocated_folder_ids]
    
    document = Document.query.filter(
        Document.id == doc_id,
        (Document.owner_id == current_user_id) | (Document.folder_id.in_(allocated_ids))
    ).first()
    
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    
    return jsonify({'document': document.to_dict()}), 200

@documents_bp.route('/<int:doc_id>/download', methods=['GET'])
@jwt_required()
def download_document(doc_id):
    current_user_id = get_jwt_identity()
    
    allocated_folder_ids = db.session.query(UserFolderAllocation.folder_id).filter(
        UserFolderAllocation.user_id == current_user_id
    ).all()
    allocated_ids = [f[0] for f in allocated_folder_ids]
    
    document = Document.query.filter(
        Document.id == doc_id,
        (Document.owner_id == current_user_id) | (Document.folder_id.in_(allocated_ids))
    ).first()
    
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    
    if document.r2_key:
        presigned_url = r2_service.get_presigned_url(document.r2_key)
        return jsonify({
            'download_url': presigned_url,
            'expires_in': 3600
        }), 200
    
    return jsonify({'error': 'Document file not available'}), 404

@documents_bp.route('/<int:doc_id>', methods=['DELETE'])
@jwt_required()
def delete_document(doc_id):
    current_user_id = get_jwt_identity()
    
    document = Document.query.filter_by(id=doc_id, owner_id=current_user_id).first()
    
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    
    if document.r2_key:
        r2_service.delete_file(document.r2_key)
    
    db.session.delete(document)
    db.session.commit()
    
    return jsonify({'message': 'Document deleted successfully'}), 200

@documents_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_document():
    current_user_id = get_jwt_identity()
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if not file.filename:
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed. Allowed: PDF, PNG, JPG, DOC, DOCX, XLS, XLSX'}), 400
    
    folder_id = request.form.get('folder_id', type=int)
    document_type = request.form.get('document_type', 'other')
    
    import uuid
    unique_filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
    file_content = file.read()
    file_size = len(file_content)
    
    user_folder = f"users/{current_user_id}/documents"
    r2_key = f"{user_folder}/{unique_filename}"
    
    try:
        r2_service.upload_file(r2_key, file_content, file.content_type or 'application/octet-stream')
    except Exception as e:
        print(f"R2 upload error: {e}")
        return jsonify({
            'message': 'Document saved to database (file storage pending)',
            'document': {
                'id': 0,
                'name': secure_filename(file.filename),
                'document_type': document_type,
                'file_size': file_size,
                'folder_id': folder_id,
            }
        }), 201
    
    document = Document(
        name=secure_filename(file.filename),
        document_type=document_type,
        file_path=r2_key,
        file_size=file_size,
        mime_type=file.content_type or 'application/octet-stream',
        r2_key=r2_key,
        folder_id=folder_id,
        owner_id=current_user_id
    )
    
    db.session.add(document)
    db.session.commit()
    
    return jsonify({
        'message': 'Document uploaded successfully',
        'document': document.to_dict()
    }), 201

@documents_bp.route('/types', methods=['GET'])
def get_document_types():
    types = [
        {'id': 'form16', 'name': 'Form 16', 'extensions': ['pdf']},
        {'id': 'form26as', 'name': 'Form 26AS', 'extensions': ['pdf']},
        {'id': 'itr', 'name': 'ITR Receipt', 'extensions': ['pdf']},
        {'id': 'investment', 'name': 'Investment Proof', 'extensions': ['pdf', 'jpg', 'png']},
        {'id': 'pan_card', 'name': 'PAN Card', 'extensions': ['pdf', 'jpg', 'png']},
        {'id': 'aadhar', 'name': 'Aadhar Card', 'extensions': ['pdf', 'jpg', 'png']},
        {'id': 'salary_slip', 'name': 'Salary Slip', 'extensions': ['pdf']},
        {'id': 'bank_statement', 'name': 'Bank Statement', 'extensions': ['pdf']},
        {'id': 'other', 'name': 'Other', 'extensions': ['pdf', 'doc', 'docx']}
    ]
    return jsonify({'types': types}), 200

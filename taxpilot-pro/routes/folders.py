from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.folder import Folder
from models.document import Document
from models.user import User
from models.user_folder_allocation import UserFolderAllocation

folders_bp = Blueprint('folders', __name__)

@folders_bp.route('', methods=['GET'])
@jwt_required()
def list_folders():
    current_user_id = get_jwt_identity()
    
    allocated_folder_ids = db.session.query(UserFolderAllocation.folder_id).filter(
        UserFolderAllocation.user_id == current_user_id
    ).all()
    allocated_ids = [f[0] for f in allocated_folder_ids]
    
    folders = Folder.query.filter(
        (Folder.owner_id == current_user_id) | (Folder.id.in_(allocated_ids))
    ).all()
    
    return jsonify({
        'folders': [folder.to_dict() for folder in folders]
    }), 200

@folders_bp.route('/<int:folder_id>', methods=['GET'])
@jwt_required()
def get_folder(folder_id):
    current_user_id = get_jwt_identity()
    
    allocated_folder_ids = db.session.query(UserFolderAllocation.folder_id).filter(
        UserFolderAllocation.user_id == current_user_id
    ).all()
    allocated_ids = [f[0] for f in allocated_folder_ids]
    
    folder = Folder.query.filter(
        Folder.id == folder_id,
        (Folder.owner_id == current_user_id) | (Folder.id.in_(allocated_ids))
    ).first()
    
    if not folder:
        return jsonify({'error': 'Folder not found or access denied'}), 404
    
    return jsonify({'folder': folder.to_dict()}), 200

@folders_bp.route('/<int:folder_id>/documents', methods=['GET'])
@jwt_required()
def get_folder_documents(folder_id):
    current_user_id = get_jwt_identity()
    
    allocated_folder_ids = db.session.query(UserFolderAllocation.folder_id).filter(
        UserFolderAllocation.user_id == current_user_id
    ).all()
    allocated_ids = [f[0] for f in allocated_folder_ids]
    
    folder = Folder.query.filter(
        Folder.id == folder_id,
        (Folder.owner_id == current_user_id) | (Folder.id.in_(allocated_ids))
    ).first()
    
    if not folder:
        return jsonify({'error': 'Folder not found or access denied'}), 404
    
    documents = Document.query.filter_by(folder_id=folder_id).order_by(Document.created_at.desc()).all()
    
    return jsonify({
        'folder': folder.to_dict(),
        'documents': [doc.to_dict() for doc in documents]
    }), 200

@folders_bp.route('', methods=['POST'])
@jwt_required()
def create_folder():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Folder name is required'}), 400
    
    folder = Folder(
        name=data['name'],
        description=data.get('description', ''),
        owner_id=current_user_id,
        is_shared=data.get('is_shared', False)
    )
    
    db.session.add(folder)
    db.session.commit()
    
    return jsonify({
        'message': 'Folder created successfully',
        'folder': folder.to_dict()
    }), 201

@folders_bp.route('/<int:folder_id>', methods=['PUT'])
@jwt_required()
def update_folder(folder_id):
    current_user_id = get_jwt_identity()
    
    folder = Folder.query.filter_by(id=folder_id, owner_id=current_user_id).first()
    
    if not folder:
        return jsonify({'error': 'Folder not found'}), 404
    
    data = request.get_json()
    
    if data.get('name'):
        folder.name = data['name']
    if data.get('description'):
        folder.description = data['description']
    if 'is_shared' in data:
        folder.is_shared = data['is_shared']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Folder updated successfully',
        'folder': folder.to_dict()
    }), 200

@folders_bp.route('/<int:folder_id>', methods=['DELETE'])
@jwt_required()
def delete_folder(folder_id):
    current_user_id = get_jwt_identity()
    
    folder = Folder.query.filter_by(id=folder_id, owner_id=current_user_id).first()
    
    if not folder:
        return jsonify({'error': 'Folder not found'}), 404
    
    allocations = UserFolderAllocation.query.filter_by(folder_id=folder_id).all()
    for alloc in allocations:
        db.session.delete(alloc)
    
    documents = Document.query.filter_by(folder_id=folder_id).all()
    for doc in documents:
        db.session.delete(doc)
    
    db.session.delete(folder)
    db.session.commit()
    
    return jsonify({'message': 'Folder deleted successfully'}), 200

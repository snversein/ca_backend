from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.user import User
from models.folder import Folder
from models.document import Document
from models.user_folder_allocation import UserFolderAllocation

admin_bp = Blueprint('admin', __name__)

def check_admin():
    current_user_id = get_jwt_identity()
    admin = db.session.get(User, int(current_user_id))
    if not admin or admin.role != 'admin':
        return False
    return True

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    if not check_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    users = User.query.filter_by(role='user').paginate(page=page, per_page=per_page)
    
    users_data = []
    for u in users.items:
        user_dict = u.to_dict()
        allocations = UserFolderAllocation.query.filter_by(user_id=u.id).all()
        user_dict['allocated_folders'] = [a.folder_id for a in allocations]
        users_data.append(user_dict)
    
    return jsonify({
        'users': users_data,
        'total': users.total,
        'pages': users.pages,
        'current_page': page
    }), 200

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    if not check_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    user = db.session.get(User, user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user_dict = user.to_dict()
    allocations = UserFolderAllocation.query.filter_by(user_id=user_id).all()
    user_dict['allocated_folders'] = [a.folder_id for a in allocations]
    user_dict['documents'] = [d.to_dict() for d in Document.query.filter_by(owner_id=user_id).all()]
    
    return jsonify({'user': user_dict}), 200

@admin_bp.route('/users/<int:user_id>/allocate-folders', methods=['POST'])
@jwt_required()
def allocate_folders_to_user(user_id):
    if not check_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    folder_ids = data.get('folder_ids', [])
    
    UserFolderAllocation.query.filter_by(user_id=user_id).delete()
    
    for folder_id in folder_ids:
        folder = db.session.get(Folder, folder_id)
        if folder:
            allocation = UserFolderAllocation(
                user_id=user_id,
                folder_id=folder_id
            )
            db.session.add(allocation)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Folders allocated successfully',
        'allocated_folders': folder_ids
    }), 200

@admin_bp.route('/folders', methods=['POST'])
@jwt_required()
def create_folder():
    if not check_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Folder name is required'}), 400
    
    folder = Folder(
        name=data['name'],
        description=data.get('description', ''),
        is_shared=data.get('is_shared', True)
    )
    
    db.session.add(folder)
    db.session.commit()
    
    return jsonify({
        'message': 'Folder created successfully',
        'folder': folder.to_dict()
    }), 201

@admin_bp.route('/folders', methods=['GET'])
@jwt_required()
def list_all_folders():
    folders = Folder.query.all()
    
    folders_data = []
    for f in folders:
        folder_dict = f.to_dict()
        allocations = UserFolderAllocation.query.filter_by(folder_id=f.id).all()
        folder_dict['allocated_users'] = [a.user_id for a in allocations]
        folders_data.append(folder_dict)
    
    return jsonify({
        'folders': folders_data
    }), 200

@admin_bp.route('/folders/<int:folder_id>', methods=['DELETE'])
@jwt_required()
def delete_folder(folder_id):
    if not check_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    folder = db.session.get(Folder, folder_id)
    if not folder:
        return jsonify({'error': 'Folder not found'}), 404
    
    UserFolderAllocation.query.filter_by(folder_id=folder_id).delete()
    Document.query.filter_by(folder_id=folder_id).delete()
    db.session.delete(folder)
    db.session.commit()
    
    return jsonify({'message': 'Folder deleted successfully'}), 200

@admin_bp.route('/documents', methods=['GET'])
@jwt_required()
def list_all_documents():
    if not check_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    user_id = request.args.get('user_id', type=int)
    
    query = Document.query
    
    if user_id:
        query = query.filter_by(owner_id=user_id)
    
    documents = query.paginate(page=page, per_page=per_page)
    
    docs_data = []
    for d in documents.items:
        doc_dict = d.to_dict()
        owner = db.session.get(User, d.owner_id)
        doc_dict['owner_name'] = owner.name if owner else 'Unknown'
        doc_dict['owner_email'] = owner.email if owner else ''
        doc_dict['owner_phone'] = owner.phone if owner else ''
        docs_data.append(doc_dict)
    
    return jsonify({
        'documents': docs_data,
        'total': documents.total,
        'pages': documents.pages,
        'current_page': page
    }), 200

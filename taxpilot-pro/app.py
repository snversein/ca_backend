from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()

from extensions import db, jwt

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, template_folder=os.path.join(BASE_DIR, 'admin_panel', 'templates'), static_folder=os.path.join(BASE_DIR, 'admin_panel', 'static'))

app.config['SECRET_KEY'] = os.getenv('JWT_SECRET', 'taxpilot-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///taxpilot.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET', 'taxpilot-jwt-secret')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)

CORS(app, resources={r"/api/*": {"origins": "*"}})

db.init_app(app)
jwt.init_app(app)

from routes.auth import auth_bp
from routes.profile import profile_bp
from routes.documents import documents_bp
from routes.folders import folders_bp
from routes.tax import tax_bp
from routes.form16 import form16_bp
from routes.chatbot import chatbot_bp
from routes.admin import admin_bp
from routes.contact import contact_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(profile_bp, url_prefix='/api/profile')
app.register_blueprint(documents_bp, url_prefix='/api/documents')
app.register_blueprint(folders_bp, url_prefix='/api/folders')
app.register_blueprint(tax_bp, url_prefix='/api/tax')
app.register_blueprint(form16_bp, url_prefix='/api/form16')
app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(contact_bp, url_prefix='/api/contact')

from models.user import User
from models.folder import Folder
from models.document import Document
from models.user_folder_allocation import UserFolderAllocation
from services.r2_service import r2_service

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin/login')
def admin_login_page():
    return render_template('login.html')

@app.route('/admin/index.html')
def admin_index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('index.html')

@app.route('/api/admin/web/login', methods=['POST'])
def web_admin_login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token
    }), 200

@app.route('/api/admin/web/stats', methods=['GET'])
@jwt_required()
def get_stats():
    from flask_jwt_extended import get_jwt_identity
    current_user_id = int(get_jwt_identity())
    admin = User.query.get(current_user_id)
    if not admin or admin.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
        
    total_users = User.query.filter_by(role='user').count()
    total_folders = Folder.query.count()
    total_documents = Document.query.count()
    
    return jsonify({
        'total_users': total_users,
        'total_folders': total_folders,
        'total_documents': total_documents
    }), 200

@app.route('/api/admin/web/users', methods=['GET'])
@jwt_required()
def get_users():
    from flask_jwt_extended import get_jwt_identity
    current_user_id = int(get_jwt_identity())
    admin = User.query.get(current_user_id)
    if not admin or admin.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
        
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    
    query = User.query.filter_by(role='user')
    
    if search:
        query = query.filter(
            (User.name.ilike(f'%{search}%')) |
            (User.email.ilike(f'%{search}%'))
        )
    
    users = query.paginate(page=page, per_page=per_page)
    
    return jsonify({
        'users': [u.to_dict() for u in users.items],
        'total': users.total,
        'pages': users.pages,
        'current_page': page
    }), 200

@app.route('/api/admin/web/users', methods=['POST'])
@jwt_required()
def create_user():
    from flask_jwt_extended import get_jwt_identity
    current_user_id = int(get_jwt_identity())
    admin = User.query.get(current_user_id)
    if not admin or admin.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
        
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'error': 'Email, password, and name are required'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    user = User(
        email=data['email'],
        name=data['name'],
        pan=data.get('pan'),
        phone=data.get('phone'),
        role='user'
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'User created successfully',
        'user': user.to_dict()
    }), 201

@app.route('/api/admin/web/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    from flask_jwt_extended import get_jwt_identity
    current_user_id = int(get_jwt_identity())
    admin = User.query.get(current_user_id)
    if not admin or admin.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
        
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    documents = Document.query.filter_by(owner_id=user_id).all()
    for doc in documents:
        if doc.r2_key:
            r2_service.delete_file(doc.r2_key)
        db.session.delete(doc)
    
    folders = Folder.query.filter_by(owner_id=user_id).all()
    for folder in folders:
        db.session.delete(folder)
    
    UserFolderAllocation.query.filter_by(user_id=user_id).delete()
    
    from models.tax_record import TaxRecord
    TaxRecord.query.filter_by(user_id=user_id).delete()
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'User deleted successfully'}), 200

@app.route('/api/admin/web/folders', methods=['GET'])
@jwt_required()
def get_folders():
    from flask_jwt_extended import get_jwt_identity
    current_user_id = int(get_jwt_identity())
    admin = User.query.get(current_user_id)
    if not admin or admin.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    folders = Folder.query.all()
    return jsonify({'folders': [f.to_dict() for f in folders]}), 200

@app.route('/api/admin/web/folders', methods=['POST'])
@jwt_required()
def create_folder():
    from flask_jwt_extended import get_jwt_identity
    current_user_id = int(get_jwt_identity())
    admin = User.query.get(current_user_id)
    if not admin or admin.role != 'admin':
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

@app.route('/api/admin/web/folders/<int:folder_id>', methods=['DELETE'])
@jwt_required()
def delete_folder(folder_id):
    from flask_jwt_extended import get_jwt_identity
    current_user_id = int(get_jwt_identity())
    admin = User.query.get(current_user_id)
    if not admin or admin.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
        
    folder = Folder.query.get(folder_id)
    
    if not folder:
        return jsonify({'error': 'Folder not found'}), 404
    
    documents = Document.query.filter_by(folder_id=folder_id).all()
    for doc in documents:
        if doc.r2_key:
            r2_service.delete_file(doc.r2_key)
        db.session.delete(doc)
    
    db.session.delete(folder)
    db.session.commit()
    
    return jsonify({'message': 'Folder deleted successfully'}), 200

@app.route('/api/admin/web/documents', methods=['GET'])
@jwt_required()
def get_documents():
    from flask_jwt_extended import get_jwt_identity
    current_user_id = int(get_jwt_identity())
    admin = User.query.get(current_user_id)
    if not admin or admin.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
        
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    documents = Document.query.paginate(page=page, per_page=per_page)
    
    documents_data = []
    for doc in documents.items:
        doc_dict = doc.to_dict()
        owner = User.query.get(doc.owner_id)
        doc_dict['owner_name'] = owner.name if owner else 'Unknown'
        documents_data.append(doc_dict)
    
    return jsonify({
        'documents': documents_data,
        'total': documents.total,
        'pages': documents.pages,
        'current_page': page
    }), 200

@app.route('/api/admin/web/documents/upload', methods=['POST'])
@jwt_required()
def upload_document():
    from flask_jwt_extended import get_jwt_identity
    current_user_id = int(get_jwt_identity())
    admin = User.query.get(current_user_id)
    if not admin or admin.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
        
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    folder_id = request.form.get('folder_id', type=int)
    owner_id = request.form.get('owner_id', type=int)
    document_type = request.form.get('document_type', 'general')
    
    if not owner_id:
        return jsonify({'error': 'Owner ID is required'}), 400
    
    if not file.filename:
        return jsonify({'error': 'No file selected'}), 400
    
    filename = secure_filename(file.filename)
    file_content = file.read()
    file_size = len(file_content)
    content_type = file.content_type or 'application/octet-stream'
    
    r2_key = f"admin/{owner_id}/documents/{filename}"
    r2_service.upload_file(r2_key, file_content, content_type)
    
    document = Document(
        name=filename,
        document_type=document_type,
        file_path=r2_key,
        file_size=file_size,
        mime_type=content_type,
        r2_key=r2_key,
        folder_id=folder_id,
        owner_id=owner_id
    )
    
    db.session.add(document)
    db.session.commit()
    
    return jsonify({
        'message': 'Document uploaded successfully',
        'document': document.to_dict()
    }), 201

@app.route('/api/admin/web/documents/<int:doc_id>', methods=['DELETE'])
@jwt_required()
def delete_document(doc_id):
    from flask_jwt_extended import get_jwt_identity
    current_user_id = int(get_jwt_identity())
    admin = User.query.get(current_user_id)
    if not admin or admin.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
        
    document = Document.query.get(doc_id)
    
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    
    if document.r2_key:
        r2_service.delete_file(document.r2_key)
    
    db.session.delete(document)
    db.session.commit()
    
    return jsonify({'message': 'Document deleted successfully'}), 200

with app.app_context():
    db.create_all()
    
    if not User.query.filter_by(email='admin@taxpilot.com').first():
        admin = User(
            email='admin@taxpilot.com',
            name='Admin',
            role='admin'
        )
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print("Default admin created: admin@taxpilot.com / admin123")

if __name__ == '__main__':
    print("\n========================================")
    print("My CA App Backend Server")
    print("========================================")
    print("API Server: http://localhost:5000")
    print("Admin Panel: http://localhost:5000/admin/login")
    print("Default Admin: admin@taxpilot.com / admin123")
    print("========================================\n")
    app.run(debug=False, host='0.0.0.0', port=5000, use_reloader=False)

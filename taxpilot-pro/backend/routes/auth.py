from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from extensions import db
from models.user import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data or not data.get('password') or not data.get('name'):
            return jsonify({'error': 'Password and name are required'}), 400
        
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip()
        
        if not email and not phone:
            return jsonify({'error': 'Either email or phone number is required'}), 400
        
        if email and User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        if phone and User.query.filter_by(phone=phone).first():
            return jsonify({'error': 'Phone number already registered'}), 400
        
        pan = data.get('pan')
        if pan and User.query.filter_by(pan=pan).first():
            return jsonify({'error': 'PAN number already registered'}), 400
        
        user = User(
            email=email if email else None,
            name=data['name'],
            pan=data.get('pan'),
            phone=phone if phone else None,
            role='user'
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Registration error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        error_msg = str(e).lower()
        if 'unique' in error_msg or 'duplicate' in error_msg:
            if 'pan' in error_msg:
                return jsonify({'error': 'PAN number already registered'}), 400
            if 'email' in error_msg:
                return jsonify({'error': 'Email already registered'}), 400
            if 'phone' in error_msg:
                return jsonify({'error': 'Phone number already registered'}), 400
        
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('password'):
        return jsonify({'error': 'Password is required'}), 400
    
    identifier = (data.get('email') or data.get('phone') or '').strip()
    
    if not identifier:
        return jsonify({'error': 'Email or phone number is required'}), 400
    
    user = None
    if '@' in identifier:
        user = User.query.filter_by(email=identifier).first()
    else:
        user = User.query.filter_by(phone=identifier).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    access_token = create_access_token(identity=current_user_id)
    
    return jsonify({
        'access_token': access_token
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, int(current_user_id))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200

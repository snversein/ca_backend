from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from extensions import db
from models.document import Document
from services.form16_extractor import Form16Extractor
from services.r2_service import r2_service
import os

form16_bp = Blueprint('form16', __name__)

@form16_bp.route('/extract', methods=['POST'])
@jwt_required()
def extract_form16():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if not file.filename:
        return jsonify({'error': 'No file selected'}), 400
    
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are supported'}), 400
    
    current_user_id = get_jwt_identity()
    
    filename = secure_filename(file.filename)
    temp_path = f"/tmp/{filename}"
    file.save(temp_path)
    
    try:
        extractor = Form16Extractor()
        extracted_data = extractor.extract(temp_path)
        
        with open(temp_path, 'rb') as f:
            file_content = f.read()
        
        r2_key = f"users/{current_user_id}/form16/{filename}"
        r2_service.upload_file(r2_key, file_content, 'application/pdf')
        
        document = Document(
            name=filename,
            document_type='form16',
            file_path=r2_key,
            file_size=os.path.getsize(temp_path),
            mime_type='application/pdf',
            r2_key=r2_key,
            folder_id=request.form.get('folder_id', type=int),
            owner_id=current_user_id,
            extracted_data=str(extracted_data)
        )
        
        db.session.add(document)
        db.session.commit()
        
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return jsonify({
            'message': 'Form 16 extracted successfully',
            'document_id': document.id,
            'extracted_data': extracted_data
        }), 200
        
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({'error': f'Extraction failed: {str(e)}'}), 500

@form16_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_form16():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if not file.filename:
        return jsonify({'error': 'No file selected'}), 400
    
    current_user_id = get_jwt_identity()
    folder_id = request.form.get('folder_id', type=int)
    
    filename = secure_filename(file.filename)
    file_content = file.read()
    file_size = len(file_content)
    
    r2_key = f"users/{current_user_id}/form16/{filename}"
    r2_service.upload_file(r2_key, file_content, 'application/pdf')
    
    document = Document(
        name=filename,
        document_type='form16',
        file_path=r2_key,
        file_size=file_size,
        mime_type='application/pdf',
        r2_key=r2_key,
        folder_id=folder_id,
        owner_id=current_user_id
    )
    
    db.session.add(document)
    db.session.commit()
    
    return jsonify({
        'message': 'Form 16 uploaded successfully',
        'document': document.to_dict()
    }), 201

@form16_bp.route('/template', methods=['GET'])
@jwt_required()
def get_form16_template():
    template = {
        'fields': [
            {'name': 'employer_name', 'label': 'Employer Name', 'type': 'text'},
            {'name': 'employer_pan', 'label': 'Employer PAN', 'type': 'text'},
            {'name': 'employer_tan', 'label': 'Employer TAN', 'type': 'text'},
            {'name': 'employee_name', 'label': 'Employee Name', 'type': 'text'},
            {'name': 'employee_pan', 'label': 'Employee PAN', 'type': 'text'},
            {'name': 'financial_year', 'label': 'Financial Year', 'type': 'text'},
            {'name': 'assessment_year', 'label': 'Assessment Year', 'type': 'text'},
            {'name': 'basic_salary', 'label': 'Basic Salary', 'type': 'number'},
            {'name': 'hra_received', 'label': 'HRA Received', 'type': 'number'},
            {'name': 'other_allowances', 'label': 'Other Allowances', 'type': 'number'},
            {'name': 'total_gross_salary', 'label': 'Total Gross Salary', 'type': 'number'},
            {'name': 'professional_tax', 'label': 'Professional Tax', 'type': 'number'},
            {'name': 'section_80c_deductions', 'label': 'Section 80C Deductions', 'type': 'number'},
            {'name': 'section_80d_deductions', 'label': 'Section 80D Deductions', 'type': 'number'},
            {'name': 'section_80g_donations', 'label': 'Section 80G Donations', 'type': 'number'},
            {'name': 'tax_deducted', 'label': 'Tax Deducted (TDS)', 'type': 'number'},
        ]
    }
    return jsonify(template), 200

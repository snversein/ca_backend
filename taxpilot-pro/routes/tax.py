from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.tax_record import TaxRecord
from services.tax_calculator import TaxCalculator

tax_bp = Blueprint('tax', __name__)

@tax_bp.route('/calculate', methods=['POST'])
@jwt_required()
def calculate_tax():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    calculator = TaxCalculator()
    result = calculator.calculate(
        income=data.get('total_income', 0),
        basic_salary=data.get('basic_salary', 0),
        house_rent=data.get('house_rent_allowance', 0),
        other_allowances=data.get('other_allowances', 0),
        professional_tax=data.get('professional_tax', 0),
        section_80c=data.get('section_80c', 0),
        section_80d=data.get('section_80d', 0),
        section_80g=data.get('section_80g', 0),
        section_80e=data.get('section_80e', 0),
        other_deductions=data.get('other_deductions', 0),
        regime=data.get('regime', 'new')
    )
    
    tax_record = TaxRecord(
        user_id=current_user_id,
        financial_year=data.get('financial_year', '2024-25'),
        total_income=data.get('total_income', 0),
        basic_salary=data.get('basic_salary', 0),
        house_rent_allowance=data.get('house_rent_allowance', 0),
        other_allowances=data.get('other_allowances', 0),
        professional_tax=data.get('professional_tax', 0),
        section_80c_amount=data.get('section_80c', 0),
        section_80d_amount=data.get('section_80d', 0),
        section_80g_amount=data.get('section_80g', 0),
        section_80e_amount=data.get('section_80e', 0),
        other_deductions=data.get('other_deductions', 0),
        total_deductions=result.get('total_deductions', 0),
        taxable_income=result.get('taxable_income', 0),
        estimated_tax=result.get('total_tax', 0),
        regime=data.get('regime', 'new'),
        calculation_details=str(result)
    )
    
    db.session.add(tax_record)
    db.session.commit()
    
    return jsonify({
        'calculation': result,
        'record_id': tax_record.id
    }), 200

@tax_bp.route('/estimate-itr', methods=['POST'])
@jwt_required()
def estimate_itr():
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    calculator = TaxCalculator()
    estimate = calculator.estimate_itr(
        income=data.get('total_income', 0),
        investments=data.get('investments', {}),
        regime=data.get('regime', 'new')
    )
    
    return jsonify({'estimate': estimate}), 200

@tax_bp.route('/suggestions', methods=['GET'])
@jwt_required()
def get_suggestions():
    calculator = TaxCalculator()
    suggestions = calculator.get_tax_saving_suggestions()
    
    return jsonify({'suggestions': suggestions}), 200

@tax_bp.route('/slabs', methods=['GET'])
@jwt_required()
def get_tax_slabs():
    calculator = TaxCalculator()
    slabs = calculator.get_tax_slabs()
    
    return jsonify({'slabs': slabs}), 200

@tax_bp.route('/records', methods=['GET'])
@jwt_required()
def get_tax_records():
    current_user_id = get_jwt_identity()
    
    financial_year = request.args.get('financial_year')
    
    query = TaxRecord.query.filter_by(user_id=current_user_id)
    
    if financial_year:
        query = query.filter_by(financial_year=financial_year)
    
    records = query.order_by(TaxRecord.created_at.desc()).all()
    
    return jsonify({
        'records': [record.to_dict() for record in records]
    }), 200

@tax_bp.route('/records/<int:record_id>', methods=['GET'])
@jwt_required()
def get_tax_record(record_id):
    current_user_id = get_jwt_identity()
    
    record = TaxRecord.query.filter_by(id=record_id, user_id=current_user_id).first()
    
    if not record:
        return jsonify({'error': 'Tax record not found'}), 404
    
    return jsonify({'record': record.to_dict()}), 200

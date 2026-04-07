from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from services.chatbot import chatbot_instance

chatbot_bp = Blueprint('chatbot', __name__)

@chatbot_bp.route('/query', methods=['POST'])
@jwt_required()
def query_chatbot():
    data = request.get_json()
    
    if not data or not data.get('message'):
        return jsonify({'error': 'Message is required'}), 400
    
    user_message = data['message']
    conversation_history = data.get('history', [])
    
    try:
        response = chatbot_instance.get_response(user_message, conversation_history)
        
        return jsonify({
            'response': response['message'],
            'suggestions': response.get('suggestions', []),
            'source': response.get('source', 'unknown')
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to process query',
            'message': str(e)
        }), 500

@chatbot_bp.route('/topics', methods=['GET'])
def get_topics():
    topics = chatbot_instance.get_available_topics()
    return jsonify({'topics': topics}), 200

@chatbot_bp.route('/quick-actions', methods=['GET'])
def get_quick_actions():
    actions = [
        {'id': 'calculate_tax', 'title': 'Calculate My Tax', 'description': 'Estimate your tax liability', 'icon': 'calculator'},
        {'id': 'itr_status', 'title': 'Check ITR Status', 'description': 'Track your ITR refund', 'icon': 'document'},
        {'id': 'tax_slabs', 'title': 'Tax Slabs Info', 'description': 'View current tax slabs', 'icon': 'info'},
        {'id': 'deductions', 'title': 'Tax Deductions', 'description': 'Maximize your savings', 'icon': 'savings'},
        {'id': 'form16_help', 'title': 'Form 16 Help', 'description': 'Understanding Form 16', 'icon': 'help'},
        {'id': 'filing_deadline', 'title': 'Filing Deadline', 'description': 'Important dates for filing', 'icon': 'calendar'}
    ]
    return jsonify({'actions': actions}), 200

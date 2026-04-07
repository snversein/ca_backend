import requests
import os
import re
from dotenv import load_dotenv

load_dotenv()


def strip_markdown(text):
    """Remove markdown formatting from text for clean display"""
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    text = re.sub(r'__([^_]+)__', r'\1', text)
    text = re.sub(r'_([^_]+)_', r'\1', text)
    text = re.sub(r'`([^`]+)`', r'\1', text)
    text = re.sub(r'^\s*[-*]\s+', '• ', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*(\d+)\.\s+', r'\1. ', text, flags=re.MULTILINE)
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    return text

class TaxChatbot:
    SYSTEM_PROMPT = """You are My CA App's AI assistant, specialized in Indian income tax. You help users with:
- Tax calculations and estimations
- Tax saving suggestions (Section 80C, 80D, 80G, HRA, NPS, etc.)
- ITR filing guidance
- Form 16 and Form 26AS queries
- PAN card information
- Tax slab explanations (New vs Old regime)
- Document requirements for tax filing

Always be helpful, accurate, and concise. If you're unsure about something, say so.

IMPORTANT: Always respond in plain text without using markdown formatting. Do NOT use asterisks (*), bold, italic, or any markdown symbols. Use simple bullet points with • symbol if needed.
Current Financial Year: FY 2024-25 (AY 2025-26)

Tax Slabs - New Regime (FY 2024-25):
- Up to ₹3 Lakh: 0%
- ₹3-6 Lakh: 5%
- ₹6-9 Lakh: 10%
- ₹9-12 Lakh: 15%
- ₹12-15 Lakh: 20%
- Above ₹15 Lakh: 30%
(4% cess applicable)

Tax Slabs - Old Regime:
- Up to ₹2.5 Lakh: 0%
- ₹2.5-5 Lakh: 5%
- ₹5-10 Lakh: 20%
- Above ₹10 Lakh: 30%
(4% cess applicable)

Key Deductions:
- Section 80C: Max ₹1.5 Lakh (PPF, ELSS, EPF, LIC, Home loan principal)
- Section 80D: Health insurance (Self: ₹25k, Parents: ₹25k-50k)
- Section 80G: Donations to charity
- Section 80E: Education loan interest (no limit)
- HRA: Rent allowance exemption
- NPS: Additional ₹50,000 deduction under 80CCD(1B)
- Rebate 87A: Up to ₹25,000 for income up to ₹5 Lakh (New regime)"""

    def __init__(self):
        self.groq_api_key = os.getenv('GROQ_API_KEY', '')
        self.groq_model = os.getenv('GROQ_MODEL', 'mixtral-8x7b-32768')
        self.use_groq = bool(self.groq_api_key)
        
        self.local_intents = {
            'greeting': {
                'patterns': ['hi', 'hello', 'hey', 'good morning', 'good evening'],
                'responses': [
                    'Hello! Welcome to My CA App. How can I help you with your taxes today?',
                    'Hi there! I\'m here to help you with tax-related queries. What would you like to know?',
                    'Hello! Ready to assist you with tax calculations, ITR filing, or document management?'
                ]
            },
            'tax_calculation': {
                'patterns': ['calculate tax', 'how much tax', 'tax liability', 'estimate tax'],
                'responses': [
                    'I can help you calculate your tax! Please provide your annual income and any investments/deductions you have.',
                    'To estimate your tax, I\'ll need your gross income and deductions. Would you like me to walk you through the process?'
                ]
            },
            'tax_slabs': {
                'patterns': ['tax slabs', 'tax rates', 'slab rates', 'income tax rates'],
                'responses': [
                    'Here are the current Indian tax slabs:\n\nNew Tax Regime:\n- Up to ₹3 Lakh: 0%\n- ₹3-6 Lakh: 5%\n- ₹6-9 Lakh: 10%\n- ₹9-12 Lakh: 15%\n- ₹12-15 Lakh: 20%\n- Above ₹15 Lakh: 30%\n\nCess of 4% applies on calculated tax.'
                ]
            },
            'section_80c': {
                'patterns': ['80c', 'section 80c', 'tax saving investments', 'deductions 80c'],
                'responses': [
                    'Section 80C allows deductions up to ₹1.5 Lakh. Popular options:\n• ELSS Mutual Funds\n• PPF\n• EPF\n• Life Insurance Premium\n• Children\'s Education Fee\n• Home Loan Principal\n• NSC'
                ]
            },
            'section_80d': {
                'patterns': ['80d', 'section 80d', 'health insurance', 'medical insurance'],
                'responses': [
                    'Section 80D provides deductions for health insurance:\n• Self & Family: Up to ₹25,000\n• Parents (below 60): Up to ₹25,000\n• Parents (60+): Up to ₹50,000\n• Preventive health checkup: Up to ₹5,000 included'
                ]
            },
            'form16': {
                'patterns': ['form 16', 'form16', 'tds certificate', 'salary certificate'],
                'responses': [
                    'Form 16 is a TDS certificate showing your salary details and tax deducted. It has two parts:\n• Part A: Employer details and TDS\n• Part B: Salary breakup and deductions\n\nYou can upload your Form 16 in the Documents section and I\'ll extract the data automatically.'
                ]
            },
            'itr_filing': {
                'patterns': ['itr', 'file itr', 'income tax return', 'filing return'],
                'responses': [
                    'ITR (Income Tax Return) filing deadlines for AY 2024-25:\n• Individuals/HUFs not requiring audit: July 31, 2024\n• Businesses requiring audit: October 31, 2024\n\nLate filing fee:\n• Up to ₹5 Lakh income: ₹1,000\n• Above ₹5 Lakh: ₹5,000'
                ]
            },
            'pan_card': {
                'patterns': ['pan', 'pan card', 'permanent account number'],
                'responses': [
                    'PAN (Permanent Account Number) is a 10-character alphanumeric identifier. It\'s mandatory for:\n• Filing ITR\n• Financial transactions above ₹50,000\n• Opening bank accounts\n• Property transactions above ₹10 Lakh\n\nYou can apply for PAN online at NSDL or UTIITSL websites.'
                ]
            },
            'goodbye': {
                'patterns': ['bye', 'goodbye', 'thanks', 'thank you', 'that\'s all'],
                'responses': [
                    'Thank you for using My CA App! Have a great day! Feel free to return if you have more questions.',
                    'Bye! Happy tax planning! Remember to file your ITR before the deadline.'
                ]
            }
        }
        
        self.fallback_responses = [
            'I\'m not sure I understand. Could you please rephrase your question?',
            'I can help with tax calculations, ITR filing, Form 16 extraction, and tax saving suggestions. What would you like to know?',
            'Let me help you find the answer. Could you be more specific about your tax query?'
        ]
    
    def _call_groq(self, message, history=None):
        """Call Groq API for AI response"""
        url = "https://api.groq.com/openai/v1/chat/completions"
        
        messages = [{"role": "system", "content": self.SYSTEM_PROMPT}]
        
        if history:
            for h in history[-10:]:
                role = "user" if h.get('role') == 'user' else "assistant"
                messages.append({"role": role, "content": h.get('content', '')})
        
        messages.append({"role": "user", "content": message})
        
        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.groq_model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1000
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            data = response.json()
            raw_response = data['choices'][0]['message']['content']
            return strip_markdown(raw_response)
        except requests.exceptions.RequestException as e:
            print(f"Groq API error: {e}")
            return None
    
    def _get_local_response(self, message):
        """Get response from local intent matching"""
        message_lower = message.lower().strip()
        
        for intent_name, intent_data in self.local_intents.items():
            for pattern in intent_data['patterns']:
                if pattern in message_lower:
                    import random
                    response_text = random.choice(intent_data['responses'])
                    return {
                        'message': response_text,
                        'intent': intent_name,
                        'suggestions': self._get_suggestions(intent_name),
                        'source': 'local'
                    }
        
        import random
        return {
            'message': random.choice(self.fallback_responses),
            'intent': 'fallback',
            'suggestions': ['Tax Calculator', 'Tax Slabs', 'Form 16 Help', 'ITR Filing'],
            'source': 'local'
        }
    
    def get_response(self, message, history=None):
        """Get chatbot response - uses Groq if available, falls back to local"""
        if self.use_groq:
            groq_response = self._call_groq(message, history)
            if groq_response:
                return {
                    'message': groq_response,
                    'intent': 'ai_response',
                    'suggestions': ['Calculate Tax', 'Tax Slabs', 'Form 16 Help', 'ITR Filing'],
                    'source': 'groq'
                }
        
        return self._get_local_response(message)
    
    def _get_suggestions(self, intent):
        suggestions_map = {
            'tax_calculation': ['Calculate Tax', 'View Tax Slabs', 'Tax Saving Tips'],
            'tax_slabs': ['Calculate My Tax', 'Compare Regimes', 'Tax Saving Suggestions'],
            'section_80c': ['Calculate Tax', '80D Deductions', 'Tax Saving Tips'],
            'section_80d': ['Calculate Tax', '80C Deductions', 'Health Insurance Info'],
            'form16': ['Upload Form 16', 'Extract Data', 'Sample Form 16'],
            'itr_filing': ['Estimate ITR', 'Required Documents', 'Check Refund Status'],
            'greeting': ['Calculate Tax', 'View Documents', 'Tax Slabs Info']
        }
        return suggestions_map.get(intent, ['Calculate Tax', 'View Tax Slabs', 'Tax Saving Tips'])
    
    def get_available_topics(self):
        return [
            {'id': 'tax_slabs', 'name': 'Tax Slabs', 'description': 'Current income tax rates'},
            {'id': 'deductions', 'name': 'Tax Deductions', 'description': 'Section 80C, 80D, 80G etc.'},
            {'id': 'form16', 'name': 'Form 16', 'description': 'Understanding Form 16'},
            {'id': 'itr', 'name': 'ITR Filing', 'description': 'Income tax return guide'},
            {'id': 'refund', 'name': 'Refund Status', 'description': 'Track your refund'},
            {'id': 'pan', 'name': 'PAN Card', 'description': 'PAN related queries'}
        ]


chatbot_instance = TaxChatbot()

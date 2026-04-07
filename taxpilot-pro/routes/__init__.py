from routes.auth import auth_bp
from routes.profile import profile_bp
from routes.documents import documents_bp
from routes.folders import folders_bp
from routes.tax import tax_bp
from routes.form16 import form16_bp
from routes.chatbot import chatbot_bp
from routes.admin import admin_bp

__all__ = [
    'auth_bp', 'profile_bp', 'documents_bp', 'folders_bp',
    'tax_bp', 'form16_bp', 'chatbot_bp', 'admin_bp'
]

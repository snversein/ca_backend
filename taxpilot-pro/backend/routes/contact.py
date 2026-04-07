from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

contact_bp = Blueprint('contact', __name__)

CA_EMAIL = os.getenv('CA_EMAIL', 'compliance.reraind@gmail.com')
SMTP_EMAIL = os.getenv('SMTP_EMAIL')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))


def send_email_to_ca(name, email, phone, subject, message):
    """Send email to CA with contact form data"""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"[My CA App] New Query from {name}: {subject}"
        msg['From'] = SMTP_EMAIL or CA_EMAIL
        msg['To'] = CA_EMAIL

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2c3e50;">New Query from My CA App</h2>
            <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background-color: #f8f9fa;">Name</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">{name}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background-color: #f8f9fa;">Email</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">{email or 'Not provided'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background-color: #f8f9fa;">Phone</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">{phone or 'Not provided'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background-color: #f8f9fa;">Subject</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">{subject}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; background-color: #f8f9fa;">Message</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">{message}</td>
                </tr>
            </table>
            <p style="color: #7f8c8d; margin-top: 20px;">This message was sent from My CA App</p>
        </body>
        </html>
        """

        text_content = f"""
        New Query from My CA App
        =========================
        
        Name: {name}
        Email: {email or 'Not provided'}
        Phone: {phone or 'Not provided'}
        Subject: {subject}
        
        Message:
        {message}
        
        ---
        This message was sent from My CA App
        """

        msg.attach(MIMEText(text_content, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))

        if SMTP_EMAIL and SMTP_PASSWORD:
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_EMAIL, SMTP_PASSWORD)
                server.send_message(msg)
            return True
        else:
            print(f"Email would be sent to {CA_EMAIL} (SMTP not configured)")
            print(f"Subject: {subject}")
            print(f"Message: {message}")
            return True

    except Exception as e:
        print(f"Email error: {e}")
        return False


@contact_bp.route('/submit', methods=['POST'])
def submit_contact():
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()
    subject = data.get('subject', '').strip()
    message = data.get('message', '').strip()

    if not name:
        return jsonify({'error': 'Name is required'}), 400

    if not email and not phone:
        return jsonify({'error': 'Either email or phone is required'}), 400

    if not subject:
        return jsonify({'error': 'Subject is required'}), 400

    if not message:
        return jsonify({'error': 'Message is required'}), 400

    success = send_email_to_ca(name, email, phone, subject, message)

    if success:
        return jsonify({
            'message': 'Your query has been submitted successfully. The CA will contact you soon.',
            'success': True
        }), 200
    else:
        return jsonify({
            'error': 'Failed to send your query. Please try again later.'
        }), 500

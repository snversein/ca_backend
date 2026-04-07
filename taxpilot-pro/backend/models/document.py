from extensions import db
from datetime import datetime

class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    document_type = db.Column(db.String(50))
    file_path = db.Column(db.String(500))
    file_size = db.Column(db.Integer)
    mime_type = db.Column(db.String(100))
    r2_key = db.Column(db.String(500))
    folder_id = db.Column(db.Integer, db.ForeignKey('folders.id'))
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    extracted_data = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'document_type': self.document_type,
            'file_path': self.file_path,
            'file_size': self.file_size,
            'mime_type': self.mime_type,
            'r2_key': self.r2_key,
            'folder_id': self.folder_id,
            'extracted_data': self.extracted_data,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

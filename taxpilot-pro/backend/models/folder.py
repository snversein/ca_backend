from extensions import db
from datetime import datetime

class Folder(db.Model):
    __tablename__ = 'folders'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    r2_key = db.Column(db.String(500))
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    is_shared = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        from models.document import Document
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'r2_key': self.r2_key,
            'is_shared': self.is_shared,
            'document_count': Document.query.filter_by(folder_id=self.id).count(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

from extensions import db
from datetime import datetime

class UserFolderAllocation(db.Model):
    __tablename__ = 'user_folder_allocations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    folder_id = db.Column(db.Integer, db.ForeignKey('folders.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'folder_id', name='unique_user_folder'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'folder_id': self.folder_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

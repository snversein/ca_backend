from extensions import db
from datetime import datetime

class TaxRecord(db.Model):
    __tablename__ = 'tax_records'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    financial_year = db.Column(db.String(10), nullable=False)
    total_income = db.Column(db.Float, default=0)
    basic_salary = db.Column(db.Float, default=0)
    house_rent_allowance = db.Column(db.Float, default=0)
    other_allowances = db.Column(db.Float, default=0)
    professional_tax = db.Column(db.Float, default=0)
    section_80c_amount = db.Column(db.Float, default=0)
    section_80d_amount = db.Column(db.Float, default=0)
    section_80g_amount = db.Column(db.Float, default=0)
    section_80e_amount = db.Column(db.Float, default=0)
    other_deductions = db.Column(db.Float, default=0)
    total_deductions = db.Column(db.Float, default=0)
    taxable_income = db.Column(db.Float, default=0)
    estimated_tax = db.Column(db.Float, default=0)
    regime = db.Column(db.String(20), default='new')
    calculation_details = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'financial_year': self.financial_year,
            'total_income': self.total_income,
            'basic_salary': self.basic_salary,
            'house_rent_allowance': self.house_rent_allowance,
            'other_allowances': self.other_allowances,
            'professional_tax': self.professional_tax,
            'deductions': {
                'section_80c': self.section_80c_amount,
                'section_80d': self.section_80d_amount,
                'section_80g': self.section_80g_amount,
                'section_80e': self.section_80e_amount,
                'other': self.other_deductions
            },
            'total_deductions': self.total_deductions,
            'taxable_income': self.taxable_income,
            'estimated_tax': self.estimated_tax,
            'regime': self.regime,
            'calculation_details': self.calculation_details,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

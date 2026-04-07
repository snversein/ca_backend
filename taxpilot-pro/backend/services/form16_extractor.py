import re

class Form16Extractor:
    def __init__(self):
        self.field_patterns = {
            'employer_name': [r'Employer[^\w]*Name[:\s]+([A-Za-z\s]+)'],
            'employer_pan': [r'Employer.*PAN[:\s]+([A-Z]{5}[0-9]{4}[A-Z])'],
            'employee_name': [r'Employee[^\w]*Name[:\s]+([A-Za-z\s]+)'],
            'employee_pan': [r'Employee.*PAN[:\s]+([A-Z]{5}[0-9]{4}[A-Z])'],
            'financial_year': [r'Financial\s*Year[:\s]+(\d{4}-\d{2})'],
            'assessment_year': [r'Assessment\s*Year[:\s]+(\d{4}-\d{2})'],
            'basic_salary': [r'Basic\s*Salary[:\s]*([\d,]+)'],
            'hra_received': [r'HRA[:\s]*([\d,]+)'],
            'total_gross_salary': [r'Gross\s*Salary[:\s]*([\d,]+)'],
            'professional_tax': [r'Professional\s*Tax[:\s]*([\d,]+)'],
            'section_80c_deductions': [r'80C[:\s]*([\d,]+)'],
            'section_80d_deductions': [r'80D[:\s]*([\d,]+)'],
            'tax_deducted': [r'TDS[:\s]*([\d,]+)']
        }
    
    def extract(self, file_path):
        return {
            'success': True,
            'message': 'Form 16 extraction is ready. Please upload a PDF to extract data.',
            'fields': {},
            'note': 'PDF text extraction will be performed when you upload the file.'
        }
    
    def validate_pan(self, pan):
        if not pan:
            return False
        return bool(re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]$', pan))
    
    def validate_tan(self, tan):
        if not tan:
            return False
        return bool(re.match(r'^[A-Z]{4}[0-9]{5}[A-Z]$', tan))

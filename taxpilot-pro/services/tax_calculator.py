class TaxCalculator:
    NEW_TAX_REGIME_SLABS = [
        {'min': 0, 'max': 300000, 'rate': 0, 'cess': 0},
        {'min': 300000, 'max': 600000, 'rate': 5, 'cess': 4},
        {'min': 600000, 'max': 900000, 'rate': 10, 'cess': 4},
        {'min': 900000, 'max': 1200000, 'rate': 15, 'cess': 4},
        {'min': 1200000, 'max': 1500000, 'rate': 20, 'cess': 4},
        {'min': 1500000, 'max': float('inf'), 'rate': 30, 'cess': 4}
    ]
    
    OLD_TAX_REGIME_SLABS = [
        {'min': 0, 'max': 250000, 'rate': 0, 'cess': 0},
        {'min': 250000, 'max': 500000, 'rate': 5, 'cess': 4},
        {'min': 500000, 'max': 1000000, 'rate': 20, 'cess': 4},
        {'min': 1000000, 'max': float('inf'), 'rate': 30, 'cess': 4}
    ]
    
    MAX_DEDUCTIONS = {
        'section_80c': 150000,
        'section_80d_self': 25000,
        'section_80d_parents': 25000,
        'section_80d_parents_senior': 50000,
        'section_80e': float('inf'),
        'section_80g': float('inf'),
        'section_80tta': 10000,
        'section_24': 200000,
        'hra': 0
    }
    
    def calculate(self, income, basic_salary=0, house_rent=0, other_allowances=0,
                  professional_tax=0, section_80c=0, section_80d=0, section_80g=0,
                  section_80e=0, other_deductions=0, regime='new'):
        
        slabs = self.NEW_TAX_REGIME_SLABS if regime == 'new' else self.OLD_TAX_REGIME_SLABS
        
        total_deductions = 0
        deduction_breakdown = {}
        
        if regime == 'old':
            section_80c = min(section_80c, self.MAX_DEDUCTIONS['section_80c'])
            deduction_breakdown['section_80c'] = section_80c
            total_deductions += section_80c
            
            section_80d = min(section_80d, self.MAX_DEDUCTIONS['section_80d_self'])
            deduction_breakdown['section_80d'] = section_80d
            total_deductions += section_80d
            
            if section_80g > 0:
                section_80g = min(section_80g, self.MAX_DEDUCTIONS['section_80g'])
                deduction_breakdown['section_80g'] = section_80g
                total_deductions += section_80g
            
            if section_80e > 0:
                deduction_breakdown['section_80e'] = section_80e
                total_deductions += section_80e
            
            if other_deductions > 0:
                deduction_breakdown['other'] = other_deductions
                total_deductions += other_deductions
        
        taxable_income = max(0, income - total_deductions - professional_tax)
        
        tax = 0
        tax_breakdown = []
        
        remaining_income = taxable_income
        
        if regime == 'new' and taxable_income <= 700000:
            tax = 0
            tax_breakdown.append({'bracket': 'Up to ₹7 Lakh', 'amount': 0})
        else:
            for slab in slabs:
                if remaining_income <= 0:
                    break
                
                slab_income = min(remaining_income, slab['max'] - slab['min'])
                
                if taxable_income > slab['min']:
                    slab_tax = (slab_income * slab['rate']) / 100
                    tax += slab_tax
                    tax_breakdown.append({
                        'bracket': f'₹{slab["min"]/100000:.1f}L - ₹{slab["max"]/100000:.1f}L',
                        'rate': f'{slab["rate"]}%',
                        'income': slab_income,
                        'tax': slab_tax
                    })
                
                remaining_income -= slab_income
        
        cess = (tax * 4) / 100
        total_tax = tax + cess
        
        rebate_87a = 0
        if regime == 'new' and taxable_income <= 500000:
            rebate_87a = min(tax, 25000)
            total_tax = max(0, total_tax - rebate_87a)
        
        return {
            'regime': regime,
            'gross_income': income,
            'total_deductions': total_deductions,
            'deduction_breakdown': deduction_breakdown,
            'taxable_income': taxable_income,
            'tax_before_cess': tax,
            'cess': cess,
            'rebate_87a': rebate_87a,
            'total_tax': total_tax,
            'effective_rate': round((total_tax / income) * 100, 2) if income > 0 else 0,
            'tax_breakdown': tax_breakdown,
            'professional_tax': professional_tax
        }
    
    def estimate_itr(self, income, investments, regime='new'):
        itr_types = []
        
        if income > 300000:
            itr_types.append({
                'type': 'ITR-1',
                'description': 'For individuals having salary/pension income from one house property',
                ' applicability': 'Basic ITR for salaried individuals'
            })
        
        if investments.get('business_income') or investments.get('capital_gains'):
            itr_types.append({
                'type': 'ITR-3',
                'description': 'For individuals having business or professional income',
                'applicability': 'Business/Self-employed'
            })
        
        if income > 5000000:
            itr_types.append({
                'type': 'ITR-2',
                'description': 'For individuals having capital gains',
                'applicability': 'High net worth individuals'
            })
        
        return {
            'estimated_itr_type': itr_types[0]['type'] if itr_types else 'ITR-1',
            'eligible_itr_types': itr_types,
            'suggested_documents': [
                'Form 16 from employer',
                'Form 26AS',
                'Investment proofs',
                'Bank statements',
                'Previous ITR acknowledgment'
            ],
            'filing_deadline': '31st July 2025 (for AY 2025-26)',
            'late_filing_fee': 5000 if regime == 'new' else 1000
        }
    
    def get_tax_saving_suggestions(self):
        return [
            {
                'section': 'Section 80C',
                'max_saving': 150000,
                'options': [
                    'ELSS Mutual Funds',
                    'PPF (Public Provident Fund)',
                    'EPF (Employee Provident Fund)',
                    'Life Insurance Premium',
                    'Children Education Fee',
                    'Home Loan Principal',
                    'NSC (National Savings Certificate)'
                ],
                'priority': 'high'
            },
            {
                'section': 'Section 80D',
                'max_saving': 50000,
                'options': [
                    'Health Insurance (Self)',
                    'Health Insurance (Parents)',
                    'Preventive Health Checkup'
                ],
                'priority': 'high'
            },
            {
                'section': 'Section 80E',
                'max_saving': 'No limit',
                'options': [
                    'Education Loan Interest'
                ],
                'priority': 'medium'
            },
            {
                'section': 'Section 80G',
                'max_saving': '50-100% of donation',
                'options': [
                    'PM Relief Fund',
                    'Registered Charitable Institutions',
                    'National Defence Fund'
                ],
                'priority': 'medium'
            },
            {
                'section': 'HRA',
                'max_saving': 'Actual HRA received',
                'options': [
                    'Rent Receipts',
                    'Rent Agreement',
                    'Landlord PAN (if rent > 1 lakh)'
                ],
                'priority': 'high'
            },
            {
                'section': 'NPS (National Pension System)',
                'max_saving': 50000,
                'options': [
                    'Tier 1 Account',
                    'Employer Contribution'
                ],
                'priority': 'medium'
            }
        ]
    
    def get_tax_slabs(self):
        return {
            'new_regime': self.NEW_TAX_REGIME_SLABS,
            'old_regime': self.OLD_TAX_REGIME_SLABS,
            'standard_deduction': 75000,
            'rebate_threshold': 700000,
            'rebate_87a_limit': 500000
        }

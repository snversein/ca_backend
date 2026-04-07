# TaxPilot Pro

A comprehensive full-stack tax management system combining ClearTax-like features with a CA document management system.

## Features

### Mobile App (React Native/Expo)
- User authentication (JWT)
- Profile management (name, PAN, email, phone)
- Document upload and viewing (Form-16, tax files)
- Form-16 data extraction (PDF/OCR)
- Tax calculator (Indian tax slabs - New & Old regime)
- ITR estimation tool
- Rule-based tax saving suggestions
- AI chatbot (powered by Groq API)
- Dashboard with income/tax overview

### Backend (Flask)
- RESTful API design
- JWT authentication
- Role-based access (admin/user)
- Document management
- Tax calculations
- Form-16 extraction
- AI Chatbot service

### Admin Panel (integrated in Backend)
- User management
- Folder-to-user mapping
- Document uploads
- Dashboard statistics

### Database (Neon PostgreSQL)
- User profiles
- Document metadata
- Folder mappings
- Tax records

### Storage (Cloudflare R2)
- Document storage
- CA-uploaded folders

## Project Structure

```
taxpilot-pro/
├── backend/
│   ├── app.py              # Main Flask app (with admin panel integrated)
│   ├── requirements.txt    # Python dependencies
│   ├── routes/             # API routes
│   ├── services/           # Business logic (chatbot, tax calculator, etc.)
│   ├── models/             # Database models
│   └── admin_panel/        # Admin panel HTML templates
│       ├── templates/
│       └── static/
├── frontend/
│   ├── app.json            # Expo configuration
│   ├── package.json        # Node dependencies
│   └── app/                # React Native app
│       ├── screens/        # App screens
│       ├── services/        # API services
│       └── context/        # React contexts
└── README.md
```

## Setup Instructions

### 1. Backend Setup

```bash
cd taxpilot-pro/backend

# Create virtual environment
python -m venv venv

# Activate (Windows: venv\Scripts\activate)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/taxpilot

# JWT Secret
JWT_SECRET=your-super-secret-key

# Cloudflare R2 Storage
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY=your-access-key
R2_SECRET_KEY=your-secret-key
R2_BUCKET_NAME=taxpilot-documents

# Groq API (for AI Chatbot - free tier at groq.com)
GROQ_API_KEY=gsk_your_groq_api_key

# Start server
python app.py
```

### 2. Mobile App Setup

```bash
cd taxpilot-pro/frontend
npm install
npx expo start
```

## Running the Project

### Start Backend (includes Admin Panel)
```bash
cd taxpilot-pro/backend
source venv/bin/activate
python app.py
```

**After starting backend:**
- **API Server**: http://localhost:5000
- **Admin Panel**: http://localhost:5000/admin/login
- **Default Admin**: admin@taxpilot.com / admin123

### Start Mobile App
```bash
cd taxpilot-pro/frontend
npx expo start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get profile

### Profile
- `GET/PUT /api/profile` - Profile management

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents/upload` - Upload document
- `DELETE /api/documents/<id>` - Delete document

### Folders
- `GET /api/folders` - List folders
- `GET /api/folders/<id>/documents` - Get folder documents

### Tax
- `POST /api/tax/calculate` - Calculate tax
- `GET /api/tax/suggestions` - Tax saving tips
- `GET /api/tax/slabs` - Tax slabs

### Form-16
- `POST /api/form16/extract` - Extract data from PDF
- `POST /api/form16/upload` - Upload Form-16

### Chatbot
- `POST /api/chatbot/query` - Query chatbot

### Admin (Web Panel)
- `POST /api/admin/web/login` - Admin login
- `GET /api/admin/web/users` - List users
- `POST /api/admin/web/folders` - Create folder
- `POST /api/admin/web/documents/upload` - Upload document

## Tech Stack

- **Frontend**: React Native, Expo, React Navigation
- **Backend**: Flask, Flask-JWT-Extended, Flask-CORS
- **Database**: PostgreSQL (Neon)
- **Storage**: Cloudflare R2 (S3-compatible)
- **AI Chatbot**: Groq API (Mixtral-8x7b model)
- **Authentication**: JWT
- **Charts**: react-native-chart-kit

## Tax Slabs (FY 2024-25)

### New Tax Regime
| Income Range | Tax Rate |
|-------------|----------|
| Up to ₹3 Lakh | 0% |
| ₹3-6 Lakh | 5% |
| ₹6-9 Lakh | 10% |
| ₹9-12 Lakh | 15% |
| ₹12-15 Lakh | 20% |
| Above ₹15 Lakh | 30% |

4% cess applicable on calculated tax.

## Getting Groq API Key

1. Go to [groq.com](https://groq.com)
2. Sign up for free account
3. Get your API key from dashboard
4. Add to `.env` as `GROQ_API_KEY=gsk_...`

**Free tier includes:**
- Mixtral-8x7b model
- 30 requests/minute
- 14,400 tokens/minute

## Security

- JWT-based authentication
- Role-based access control (admin/user)
- Secure password hashing (bcrypt)
- Secure document storage (R2 presigned URLs)

## License

MIT License

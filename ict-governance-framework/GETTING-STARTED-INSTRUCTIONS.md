# 🚀 Getting Started Instructions - ICT Governance Framework

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

### 1. **Install Dependencies**
```bash
cd ict-governance-framework
npm install
```

### 2. **Setup Environment**
```bash
cp .env.example .env
# Edit .env with your database and JWT secrets
```

**Required Environment Variables:**
```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/ict_governance_framework

# JWT Configuration (Generate strong secrets for production)
JWT_ACCESS_SECRET=your-super-secret-access-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# API Configuration
PORT=4000
NODE_ENV=development

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 3. **Setup Database**
```bash
# Create your PostgreSQL database
createdb ict_governance_framework

# Run the SQL schema file against your PostgreSQL database
psql -d ict_governance_framework -f db-schema.sql
```

### 4. **Start Backend**
```bash
node server.js
```
The backend API will be available at `http://localhost:4000`

### 5. **Start Frontend**
```bash
npm run dev
```
The frontend application will be available at `http://localhost:3000`

## 📋 Default Admin Account

After running the database schema, you can create a super admin account by registering through the UI or using the API directly. The first user should be assigned the `super_admin` role manually in the database.

### Option 1: Register through UI
1. Navigate to `http://localhost:3000/auth?mode=register`
2. Fill out the registration form
3. After registration, manually update the user's role in the database:

```sql
-- Find your user ID
SELECT user_id, username, email FROM users WHERE email = 'your-email@example.com';

-- Assign super_admin role
INSERT INTO user_roles (user_id, role_id, assigned_by, assignment_reason)
VALUES ('YOUR_USER_ID', 'ROLE_SUPER_ADMIN', 'YOUR_USER_ID', 'Initial super admin setup');
```

### Option 2: Create directly via API
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "AdminPass123!",
    "firstName": "System",
    "lastName": "Administrator",
    "department": "IT",
    "jobTitle": "System Administrator"
  }'
```

Then assign the super_admin role using the SQL command above.

## 🔐 Key Features

### **Secure Authentication**
- **JWT-based with refresh tokens**: Access tokens (15 min) + refresh tokens (7 days)
- **Token expiration and automatic refresh**: Seamless user experience
- **Secure password hashing with bcrypt**: Industry-standard password protection
- **Two-factor authentication support (TOTP)**: Enhanced security layer
- **Account lockout after failed attempts**: Protection against brute force attacks
- **Email verification for new accounts**: Account validation workflow

### **Role-Based Access Control (RBAC)**
- **Granular permission system**: Fine-grained access control
- **Hierarchical role structure**: Organized role inheritance
- **Default system roles**:
  - `super_admin` - Full system access
  - `admin` - Administrative access
  - `governance_manager` - Governance oversight
  - `compliance_officer` - Compliance monitoring
  - `it_manager` - IT operations management
  - `security_analyst` - Security monitoring
  - `auditor` - Audit and review access
  - `employee` - Standard user access
  - `guest` - Limited read-only access

### **User Management**
- **Complete CRUD operations for users and roles**: Full lifecycle management
- **User profile management**: Comprehensive user information
- **Department and organizational structure**: Hierarchical organization support
- **Manager-employee relationships**: Organizational reporting structure
- **Bulk user operations**: Efficient mass user management
- **User status management**: Active, Inactive, Suspended, Pending states

### **Activity Logging & Audit Trail**
- **Comprehensive user activity logging**: Complete audit trail
- **API request/response tracking**: Detailed interaction logs
- **Authentication events**: Login/logout tracking
- **Permission changes**: Role and permission audit trail
- **Failed access attempts**: Security monitoring
- **Exportable audit reports**: Compliance reporting support

### **Session Management**
- **Secure session handling with database storage**: Persistent session management
- **Multi-device session support**: Cross-device authentication
- **Session expiration and cleanup**: Automatic session lifecycle
- **Device and location tracking**: Enhanced security monitoring
- **Remote session termination**: Administrative session control

### **Password Security**
- **Strong password requirements**: Enforced complexity rules
- **Password history tracking (prevents reuse)**: Security policy enforcement
- **Secure password reset flow**: Safe password recovery
- **Password expiration policies**: Configurable password lifecycle
- **Breach detection integration ready**: Future security enhancements

### **Rate Limiting & Security**
- **API rate limiting to prevent abuse**: DDoS and abuse protection
- **Helmet.js security headers**: HTTP security headers
- **CORS protection**: Cross-origin request security
- **SQL injection prevention**: Parameterized query protection
- **XSS protection**: Cross-site scripting prevention
- **Input validation and sanitization**: Data integrity and security

### **Responsive UI**
- **Mobile-friendly interface**: Cross-device compatibility
- **Dark mode support**: User preference accommodation
- **Accessible design**: WCAG compliance ready
- **Real-time updates**: Dynamic user interface
- **Progressive web app features**: Enhanced user experience

## ✅ System Status

The user management system is now **fully integrated** into the ICT Governance Framework and ready for production use with proper security measures and scalable architecture.

### What's Ready:
- ✅ Complete authentication system
- ✅ Role-based access control
- ✅ User management interface
- ✅ Security middleware and protection
- ✅ Database schema with audit trails
- ✅ API endpoints for all operations
- ✅ Frontend authentication flows
- ✅ Comprehensive documentation

### Next Steps:
1. Install dependencies: `npm install`
2. Configure environment variables
3. Setup PostgreSQL database
4. Run database schema
5. Start backend and frontend services
6. Create your first admin account

---

**🎉 Your ICT Governance Framework with enterprise-grade user management is ready to deploy!**
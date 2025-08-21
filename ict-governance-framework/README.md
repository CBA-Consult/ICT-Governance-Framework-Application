

# ICT Governance & IT Management Framework

**[See: Repository Table of Contents](../Table-of-Contents.md)**

A comprehensive ICT Governance and IT Management Framework with advanced user management, role-based access control, and security features. This interactive dashboard provides a user-friendly interface for exploring governance, compliance, and management processes.

## Project Purpose

The framework and dashboard aim to:
- Provide a user-friendly interface for exploring the detailed governance, compliance, and management processes documented in the Markdown (.md) files.
- Serve as a central portal for stakeholders to access, understand, and implement the framework's policies, procedures, and best practices.
- Enable secure user management with role-based access control and comprehensive audit trails.
- Support workflow automation and compliance monitoring features aligned with the framework.

## Current Status

- **✅ User Management System Complete:** Full authentication, authorization, and user management with RBAC
- **✅ Security Features Implemented:** JWT authentication, session management, activity logging, and rate limiting
- **✅ Backend Refactor Complete:** Modular Express API endpoints for Defender for Cloud Apps and user management
- **✅ Database Schema Updated:** PostgreSQL tables for users, roles, permissions, sessions, and audit trails
- **✅ API Integration:** Comprehensive REST API with authentication and authorization middleware
- **✅ Frontend Authentication:** Login/register forms, protected routes, and user management interface
- **✅ Documentation Source:** All authoritative content is maintained in the Markdown files at the root of this repository and referenced in the [Table of Contents](../Table-of-Contents.md)

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

**Important Environment Variables:**
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
- JWT-based authentication with access and refresh tokens
- Token expiration and automatic refresh
- Secure password hashing with bcrypt
- Two-factor authentication support (TOTP)
- Account lockout after failed attempts
- Email verification for new accounts

### **Role-Based Access Control (RBAC)**
- Granular permission system
- Hierarchical role structure
- Default system roles:
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
- Complete CRUD operations for users and roles
- User profile management
- Department and organizational structure
- Manager-employee relationships
- Bulk user operations
- User status management (Active, Inactive, Suspended, Pending)

### **Document & Policy Management**
- Comprehensive document management with version control
- Approval workflows for governance documents
- Document categorization and metadata management
- Advanced search and filtering capabilities
- Document relationships and compliance tracking

### **Activity Logging & Audit Trail**
- Comprehensive user activity logging
- API request/response tracking
- Authentication events
- Permission changes
- Failed access attempts
- Exportable audit reports

### **Session Management**
- Secure session handling with database storage
- Multi-device session support
- Session expiration and cleanup
- Device and location tracking
- Remote session termination

### **Password Security**
- Strong password requirements
- Password history tracking (prevents reuse)
- Secure password reset flow
- Password expiration policies
- Breach detection integration ready

### **Rate Limiting & Security**
- API rate limiting to prevent abuse
- Helmet.js security headers
- CORS protection
- SQL injection prevention
- XSS protection
- Input validation and sanitization

### **Responsive UI**
- Mobile-friendly interface
- Dark mode support
- Accessible design
- Real-time updates
- Progressive web app features

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Current user info
- `POST /api/auth/verify-email` - Email verification

### User Management Endpoints
- `GET /api/users` - List users (with pagination and filtering)
- `GET /api/users/:userId` - Get user details
- `POST /api/users` - Create new user
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Deactivate user
- `POST /api/users/:userId/roles` - Assign roles to user
- `DELETE /api/users/:userId/roles/:roleId` - Remove role from user

### Document Management Endpoints
- `GET /api/documents` - List documents with filtering and pagination
- `GET /api/documents/categories` - Get document categories
- `GET /api/documents/:id` - Get specific document with versions
- `POST /api/documents` - Create new document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/:id/versions` - Create new version

### Workflow Management Endpoints
- `GET /api/document-workflows` - List workflows with filtering
- `GET /api/document-workflows/:id` - Get specific workflow with steps
- `POST /api/document-workflows` - Create new approval workflow
- `POST /api/document-workflows/:id/approve/:stepId` - Approve/reject workflow step
- `DELETE /api/document-workflows/:id` - Cancel workflow
- `GET /api/document-workflows/my-tasks` - Get tasks assigned to current user

### Role Management Endpoints
- `GET /api/roles` - List roles
- `GET /api/roles/:roleId` - Get role details
- `POST /api/roles` - Create new role
- `PUT /api/roles/:roleId` - Update role
- `DELETE /api/roles/:roleId` - Deactivate role
- `POST /api/roles/:roleId/permissions` - Assign permissions to role
- `GET /api/roles/permissions/all` - List all permissions

### Governance & Compliance Endpoints
- `GET /api/defender-entities/sync` - Sync Defender entities
- `GET /api/defender-alerts/sync` - Sync Defender alerts
- `GET /api/defender-files/sync` - Sync Defender files
- `POST /api/feedback` - Submit feedback
- `GET /api/escalations` - View escalations

## 🔧 Security & Configuration

### Environment Security
- Use strong, unique JWT secrets in production
- Enable HTTPS in production
- Use environment variables for all secrets
- Regular security updates

### Database Security
- Use connection pooling
- Enable SSL for database connections
- Regular backups and encryption at rest
- Principle of least privilege for database users

### Application Security
- Input validation on all endpoints
- SQL injection prevention with parameterized queries
- XSS protection with content security policy
- Regular dependency updates

## 📈 Monitoring & Maintenance

### Health Checks
- API health endpoint: `GET /api/health`
- Database connectivity monitoring
- Session cleanup automation
- Failed login attempt monitoring

### Logging
- Application logs with structured format
- Audit trail in database
- Error tracking and alerting
- Performance monitoring


## 🔧 Security & Configuration

### Environment Security
- Use strong, unique JWT secrets in production
- Enable HTTPS in production
- Use environment variables for all secrets
- Regular security updates

### Database Security
- Use connection pooling
- Enable SSL for database connections
- Regular backups and encryption at rest
- Principle of least privilege for database users

### Application Security
- Input validation on all endpoints
- SQL injection prevention with parameterized queries
- XSS protection with content security policy
- Regular dependency updates

## 📈 Monitoring & Maintenance

### Health Checks
- API health endpoint: `GET /api/health`
- Database connectivity monitoring
- Session cleanup automation
- Failed login attempt monitoring

### Logging
- Application logs with structured format
- Audit trail in database
- Error tracking and alerting
- Performance monitoring

## Next Steps / Roadmap

To continue enhancing the framework and dashboard:

1. **✅ User Management & Security (COMPLETED)**
	- ✅ Authentication, authorization, and audit logging implemented
	- ✅ Role-based access control with granular permissions
	- ✅ Session management and security features

2. **Content Integration:**
	- Parse and render Markdown documentation within the dashboard
	- Organize content by framework domains, processes, and compliance requirements
	- Add search, filtering, and cross-referencing capabilities

3. **Enhanced UI/UX:**
	- Design navigation and dashboards that reflect the structure of the framework
	- Implement advanced user management interfaces
	- Add real-time notifications and alerts

4. **Compliance & Reporting:**
	- Integrate compliance checklists, reporting tools, and benchmarking features
	- Automated compliance monitoring and alerting
	- Export capabilities for audit reports

5. **Automation & Workflows:**
	- Enable workflow automation for governance processes (e.g., registration, offboarding, audits)
	- Integration with external systems and APIs
	- Automated policy enforcement

6. **Advanced Features:**
	- Multi-tenant support for organizations
	- Advanced analytics and dashboards
	- Mobile application development

## Contributing

Contributions are welcome! Please see the main repository documentation for guidelines and priorities. Focus areas include:
- Upgrading page content to reflect the framework
- Improving UI/UX
- Integrating documentation and compliance tools

---

## 🚦 Development

### Running in Development Mode
```bash
# Backend with auto-reload (if nodemon is installed)
npm run dev:server

# Frontend with hot reload
npm run dev

# Both simultaneously (if concurrently is installed)
npm run dev:all
```

### Testing
```bash
# Run all tests (when test suite is implemented)
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm run test:auth
npm run test:users
npm run test:roles
```

### Database Migrations
```bash
# Run pending migrations (when migration system is implemented)
npm run migrate

# Rollback last migration
npm run migrate:rollback

# Reset database (development only)
npm run db:reset
```

**Note:** This framework and dashboard are under active development with production-ready user management. For authoritative framework content, refer to the Markdown files in the repository root or the [Table of Contents](../Table-of-Contents.md).


## 🤝 Contributing

Contributions are welcome! Please see the main repository documentation for guidelines and priorities. Focus areas include:
- Enhancing user management features
- Improving UI/UX design
- Integrating documentation and compliance tools
- Adding automated testing
- Performance optimization

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 🆘 Support

For support and questions:
- Check the comprehensive documentation above
- Review the API endpoints and authentication flow
- Check the audit logs for troubleshooting
- Refer to the [Repository Table of Contents](../Table-of-Contents.md)
- Contact the development team

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.


## 🤝 Contributing

Contributions are welcome! Please see the main repository documentation for guidelines and priorities. Focus areas include:
- Enhancing user management features
- Improving UI/UX design
- Integrating documentation and compliance tools
- Adding automated testing
- Performance optimization

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 🆘 Support

For support and questions:
- Check the comprehensive documentation above
- Review the API endpoints and authentication flow
- Check the audit logs for troubleshooting
- Refer to the [Repository Table of Contents](../Table-of-Contents.md)
- Contact the development team

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## Learn More

- [Repository Table of Contents](../Table-of-Contents.md) — All documents and directories
- [Next.js Documentation](https://nextjs.org/docs) — Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) — Interactive Next.js tutorial
- [Next.js GitHub repository](https://github.com/vercel/next.js/)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

---

**The user management system is now fully integrated into the ICT Governance Framework and ready for production use with proper security measures and scalable architecture.**

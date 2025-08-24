# Document and Policy Management System

## Overview

The Document and Policy Management System is a comprehensive solution for managing governance documents, policies, and procedures with advanced version control and approval workflows. This system integrates seamlessly with the existing ICT Governance Framework.

## Features

### 📄 Document Management
- **Document Types**: Support for Policies, Procedures, Standards, Guidelines, Templates, Forms, Manuals, and Reports
- **Categories**: Organized document categorization with color-coded icons
- **Metadata**: Rich metadata including tags, compliance frameworks, review schedules, and effective dates
- **Search & Filtering**: Advanced search and filtering capabilities
- **Document Relationships**: Link related documents with relationship types

### 🔄 Version Control
- **Semantic Versioning**: Automatic version numbering (Major.Minor.Patch)
- **Change Tracking**: Detailed change summaries and change types
- **Version Comparison**: Compare different versions of documents
- **File Support**: Support for multiple content types (Markdown, HTML, PDF, etc.)
- **File Upload**: Secure file upload with hash verification

### ⚡ Approval Workflows
- **Workflow Types**: Standard, Fast-Track, Emergency, and Collaborative workflows
- **Multi-Step Approval**: Configurable approval steps with different approvers
- **Role-Based Approval**: Approve based on user roles or specific users
- **Workflow Tracking**: Real-time workflow progress tracking
- **Notifications**: Automated notifications for pending approvals

### 🔐 Security & Permissions
- **Role-Based Access Control**: Granular permissions for different user roles
- **Document Permissions**: Fine-grained access control per document
- **Activity Logging**: Comprehensive audit trail for all document activities
- **Secure File Storage**: Encrypted file storage with access controls

## Database Schema

### Core Tables

#### `documents`
Main document registry with metadata and status tracking.

#### `document_versions`
Version control with content storage and change tracking.

#### `document_approval_workflows`
Workflow instances for document approvals.

#### `document_approval_steps`
Individual approval steps within workflows.

#### `document_permissions`
Access control for documents.

#### `document_activity_log`
Audit trail for all document activities.

#### `document_relationships`
Links between related documents.

#### `document_comments`
Comments and reviews on documents.

#### `document_categories`
Document categorization system.

## API Endpoints

### Document Management (`/api/documents`)

- `GET /api/documents` - List documents with filtering and pagination
- `GET /api/documents/categories` - Get document categories
- `GET /api/documents/:id` - Get specific document with versions
- `POST /api/documents` - Create new document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/:id/versions` - Create new version

### Workflow Management (`/api/document-workflows`)

- `GET /api/document-workflows` - List workflows with filtering
- `GET /api/document-workflows/:id` - Get specific workflow with steps
- `POST /api/document-workflows` - Create new approval workflow
- `POST /api/document-workflows/:id/approve/:stepId` - Approve/reject workflow step
- `DELETE /api/document-workflows/:id` - Cancel workflow
- `GET /api/document-workflows/my-tasks` - Get tasks assigned to current user

## User Interface

### Document List Page (`/documents`)
- Filterable and searchable document list
- Category-based filtering
- Status and type filtering
- Pagination support
- Quick actions for viewing and editing

### Document Detail Page (`/documents/:id`)
- Document metadata display
- Version history and comparison
- Related documents
- Workflow status
- Content viewing with syntax highlighting

### Document Creation (`/documents/new`)
- Rich form for document creation
- Category and type selection
- Tag and compliance framework management
- Review schedule configuration
- Approver assignment

### Workflow Management (`/workflows`)
- Personal task dashboard
- All workflows overview
- Workflow progress tracking
- Approval actions
- Status filtering

## Permissions System

### Document Permissions
- `document.read` - View and read documents
- `document.create` - Create new documents
- `document.edit` - Edit existing documents
- `document.delete` - Delete documents
- `document.approve` - Approve document versions
- `document.publish` - Publish approved documents
- `document.admin` - Full document management administration

### Version Control Permissions
- `version.create` - Create new document versions
- `version.compare` - Compare document versions

### Workflow Permissions
- `workflow.initiate` - Start approval workflows
- `workflow.approve` - Approve documents in workflows
- `workflow.admin` - Manage approval workflows

## Default Roles

### Admin
- Full access to all document management features
- Can manage all documents and workflows
- Administrative permissions for system configuration

### IT Manager
- Can create, edit, and approve documents
- Can initiate and participate in workflows
- Cannot delete documents or perform admin functions

### Employee
- Can read documents and create new ones
- Can compare versions
- Limited workflow participation

### Auditor
- Read-only access to documents
- Can compare versions for audit purposes
- No creation or modification permissions

## Installation and Setup

### 1. Database Setup
Run the updated database schema to create the document management tables:

```sql
-- The schema is automatically included in db-schema.sql
-- Run the full schema to create all tables and permissions
```

### 2. API Integration
The document management APIs are automatically included when starting the server:

```bash
npm start
```

### 3. File Storage
Ensure the uploads directory exists and has proper permissions:

```bash
mkdir -p ict-governance-framework/uploads/documents
chmod 755 ict-governance-framework/uploads/documents
```

### 4. Environment Variables
Add any additional configuration to your `.env` file:

```env
# Document storage settings
DOCUMENT_UPLOAD_PATH=./uploads/documents
MAX_FILE_SIZE=50MB
ALLOWED_FILE_TYPES=.pdf,.doc,.docx,.txt,.md,.html
```

## Usage Examples

### Creating a New Document

1. Navigate to `/documents`
2. Click "New Document"
3. Fill in the document details:
   - Title and description
   - Category and type
   - Tags and compliance frameworks
   - Review schedule
   - Approver (optional)
4. Click "Create Document"

### Creating a New Version

1. Open a document detail page
2. Click "New Version"
3. Upload content or enter text
4. Provide change summary
5. Select change type (Major/Minor/Patch/Emergency)
6. Submit the new version

### Starting an Approval Workflow

1. Open a document with a new version
2. Click "Start Workflow"
3. Select workflow type
4. Configure approval steps:
   - Add approvers (users or roles)
   - Set approval types (Required/Optional/Informational)
   - Set due dates
5. Submit the workflow

### Approving Documents

1. Navigate to `/workflows`
2. View "My Tasks" tab
3. Click "Review" on pending tasks
4. Review the document content
5. Approve, reject, or skip the step
6. Add comments if needed

## Best Practices

### Document Organization
- Use consistent naming conventions
- Apply appropriate categories and tags
- Set realistic review schedules
- Link related documents

### Version Control
- Write clear change summaries
- Use appropriate change types
- Test content before creating versions
- Maintain backward compatibility when possible

### Workflow Management
- Design workflows based on document criticality
- Include appropriate stakeholders
- Set reasonable due dates
- Provide clear approval criteria

### Security
- Regularly review document permissions
- Monitor activity logs
- Use strong authentication
- Backup document content regularly

## Troubleshooting

### Common Issues

#### File Upload Errors
- Check file size limits
- Verify allowed file types
- Ensure upload directory permissions

#### Permission Denied
- Verify user roles and permissions
- Check document ownership
- Review access control settings

#### Workflow Stuck
- Check approver availability
- Verify role assignments
- Review workflow configuration

### Support
For technical support or feature requests, please contact the system administrator or refer to the main ICT Governance Framework documentation.

## Future Enhancements

### Planned Features
- Document templates and forms
- Advanced search with full-text indexing
- Integration with external document systems
- Automated compliance checking
- Mobile application support
- Advanced analytics and reporting

### API Extensions
- Bulk operations
- Document import/export
- Webhook notifications
- Integration APIs for third-party systems

---

*This document is part of the ICT Governance Framework and is subject to the same governance and approval processes.*
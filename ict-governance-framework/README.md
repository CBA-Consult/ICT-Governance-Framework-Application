

# ICT Governance & IT Management Framework Dashboard

**[See: Repository Table of Contents](../Table-of-Contents.md)**

This project is an interactive dashboard designed to visualize, navigate, and operationalize the comprehensive ICT Governance and IT Management Framework developed in this repository.

## Project Purpose

The dashboard aims to:
- Provide a user-friendly interface for exploring the detailed governance, compliance, and management processes documented in the Markdown (.md) files.
- Serve as a central portal for stakeholders to access, understand, and implement the framework's policies, procedures, and best practices.
- Enable future integration of reporting, benchmarking, and workflow automation features aligned with the framework.


## Current Status

- **Backend Refactor Complete:** Modular Express API endpoints for Defender for Cloud Apps (entities, alerts, files) and future integrations.
- **Database Schema Updated:** PostgreSQL tables for defender_entities, defender_alerts, defender_files, and more. Table renames and migrations complete.
- **API Integration:** Endpoints for syncing Defender for Cloud Apps data are live and tested. See `/api/defender-entities/sync`, `/api/defender-alerts/sync`, `/api/defender-files/sync`.
- **Frontend Improvements:** Font color and UI readability improved. Dashboard pages scaffolded for future content integration.
- **Documentation Source:** All authoritative content is maintained in the Markdown files at the root of this repository and referenced in the [Table of Contents](../Table-of-Contents.md).


## Next Steps / Roadmap

To upgrade the dashboard and backend to production quality and align with the governance framework:

1. **Content Integration:**
	- Parse and render Markdown documentation within the dashboard.
	- Organize content by framework domains, processes, and compliance requirements.
2. **API & Backend Enhancements:**
	- Expand API endpoints for additional governance data sources and automation.
	- Add authentication, authorization, and audit logging to all endpoints.
3. **UI/UX Enhancements:**
	- Design navigation and dashboards that reflect the structure of the framework.
	- Add search, filtering, and cross-referencing capabilities.
4. **Compliance & Reporting:**
	- Integrate compliance checklists, reporting tools, and benchmarking features.
5. **Automation & Workflows:**
	- Enable workflow automation for governance processes (e.g., registration, offboarding, audits).
6. **Stakeholder Feedback:**
	- Gather input from users to refine features and prioritize enhancements.

## Contributing

Contributions are welcome! Please see the main repository documentation for guidelines and priorities. Focus areas include:
- Upgrading page content to reflect the framework
- Improving UI/UX
- Integrating documentation and compliance tools

---


**Note:** This dashboard and backend are under active development. For authoritative framework content, refer to the Markdown files in the repository root or the [Table of Contents](../Table-of-Contents.md).


## Getting Started

### Frontend (Next.js)
Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

### Backend (Express API)
Run the backend server:

```bash
cd ict-governance-framework
node server.js
```

API endpoints are available at `http://localhost:4000/api/` (see defender-entities, defender-alerts, defender-files, etc.).


## Learn More

- [Repository Table of Contents](../Table-of-Contents.md) — All documents and directories
- [Next.js Documentation](https://nextjs.org/docs) — Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) — Interactive Next.js tutorial
- [Next.js GitHub repository](https://github.com/vercel/next.js/)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

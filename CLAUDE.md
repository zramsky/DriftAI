# Contract Recreation Platform Development Guide

## Project Overview
This is a B2B SaaS platform for contract management and reconciliation. The platform helps organizations manage, track, and reconcile contracts efficiently.

## Tech Stack
- **Frontend**: React/Next.js with TypeScript
- **Backend**: Node.js/Express or Python/FastAPI
- **Database**: PostgreSQL or MongoDB
- **Deployment**: Firebase Hosting (contractrecplatform.web.app)

## Visual Development

### Design Principles
- Comprehensive design checklist in `/context/design-principles.md`
- Brand style guide in `/context/style-guide.md`
- When making visual (front-end, UI/UX) changes, always refer to these files for guidance

### Quick Visual Check
IMMEDIATELY after implementing any front-end change:
1. **Identify what changed** - Review the modified components/pages
2. **Navigate to affected pages** - Use `mcp__playwright__browser_navigate` to visit each changed view
3. **Verify design compliance** - Compare against `/context/design-principles.md` and `/context/style-guide.md`
4. **Validate feature implementation** - Ensure the change fulfills the user's specific request
5. **Check acceptance criteria** - Review any provided context files or requirements
6. **Capture evidence** - Take full page screenshot at desktop viewport (1440px) of each changed view
7. **Check for errors** - Run `mcp__playwright__browser_console_messages`

This verification ensures changes meet design standards and user requirements.

### Comprehensive Design Review
Invoke the `@agent-design-review` subagent for thorough design validation when:
- Completing significant UI/UX features
- Before finalizing PRs with visual changes
- Needing comprehensive accessibility and responsiveness testing

## Development Guidelines

### Code Quality
- Follow TypeScript best practices
- Maintain consistent code formatting
- Write comprehensive tests for critical functionality
- Document complex business logic

### Git Workflow
- Create feature branches for new work
- Write clear, descriptive commit messages
- Run tests before committing
- Request design review for UI changes

### Testing
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Visual regression tests for UI components

## Key Features

### Contract Management
- Upload and store contracts
- Categorize and tag contracts
- Search and filter functionality
- Version control for contract updates

### Reconciliation Engine
- Automated matching algorithms
- Discrepancy detection
- Manual review workflow
- Audit trail for all changes

### Reporting & Analytics
- Dashboard with key metrics
- Custom report generation
- Export functionality
- Real-time updates

## API Endpoints
Document main API endpoints and their purposes as they are developed.

## Environment Variables
List required environment variables and their purposes.

## Deployment
- Production: https://contractrecplatform.web.app/
- Development server: Run `npm run dev` or `./start-dev.sh`

## Support
For issues or questions, refer to the README.md or project documentation.
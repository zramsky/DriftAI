# Contract & Invoice Reconciliation Platform

A professional web application for nursing home operators to manage vendor contracts and automatically reconcile invoices, detecting discrepancies and tracking savings.

## Features

### Core Functionality
- **Contract Management**: Upload and parse vendor contracts with AI-powered extraction
- **Invoice Processing**: Automatic invoice parsing and data extraction
- **Intelligent Reconciliation**: AI-driven comparison of invoices against contract terms
- **Discrepancy Detection**: Automatic flagging of rate overages, unauthorized fees, and cap violations
- **Vendor Management**: Centralized vendor profiles with contract history and metrics
- **Analytics Dashboard**: Track total savings, discrepancies, and vendor performance

### Technical Highlights
- Full-stack TypeScript application
- Async processing with job queues
- AI integration with OpenAI GPT-4
- AWS cloud infrastructure
- Enterprise-grade security with Auth0
- Comprehensive audit logging

## Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **State Management**: React Query
- **Forms**: React Hook Form
- **Authentication**: Auth0

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with TypeORM
- **Queue**: Bull with Redis
- **File Storage**: AWS S3
- **AI**: OpenAI API (GPT-4o-mini)
- **PDF Processing**: pdf-parse, AWS Textract (fallback)

### Infrastructure
- **Cloud Provider**: AWS
- **Container**: Docker
- **Orchestration**: AWS ECS Fargate
- **Database**: AWS RDS (PostgreSQL)
- **Queue**: Redis on AWS ElastiCache
- **Storage**: AWS S3 with encryption
- **Secrets**: AWS Secrets Manager

## Project Structure

```
contract-reconciliation-platform/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   ├── lib/            # Utilities and helpers
│   │   └── styles/         # Global styles
│   └── public/             # Static assets
│
├── backend/                 # NestJS backend application
│   ├── src/
│   │   ├── entities/       # TypeORM entities
│   │   ├── modules/        # Feature modules
│   │   │   ├── ai/        # AI integration services
│   │   │   ├── vendors/   # Vendor management
│   │   │   ├── contracts/ # Contract processing
│   │   │   ├── invoices/  # Invoice processing
│   │   │   └── storage/   # File storage services
│   │   ├── config/        # Configuration files
│   │   └── common/        # Shared utilities
│   └── ops/
│       └── prompts/       # AI prompt templates
│
├── infrastructure/         # Terraform IaC (to be added)
├── .github/               # CI/CD workflows (to be added)
└── docker-compose.yml     # Local development setup
```

## 🚀 Quick Start

**The fastest way to get started:**

```bash
git clone <repository-url>
cd contract-reconciliation-platform
./start-dev.sh
```

This will start all services and create a default admin account:
- **Email**: admin@contractflow.com  
- **Password**: admin123

Access the application at: http://localhost:3000

---

## MVP Status: ✅ COMPLETE

This MVP includes all core functionality:
- ✅ Full-stack application with modern tech stack
- ✅ Contract upload and AI-powered extraction
- ✅ Invoice processing and reconciliation
- ✅ Vendor management with analytics dashboard
- ✅ Professional UI with responsive design
- ✅ Authentication and user management
- ✅ Docker containerization for easy deployment
- ✅ Comprehensive documentation

---

## Getting Started

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- AWS Account (for production)
- OpenAI API Key

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd contract-reconciliation-platform
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   
   # Frontend
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env with your configuration
   ```

3. **Start development environment**
   ```bash
   docker-compose up -d
   ```

4. **Access the applications**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

### Manual Setup (without Docker)

1. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Start PostgreSQL and Redis**
   ```bash
   # Using homebrew on macOS
   brew services start postgresql
   brew services start redis
   ```

3. **Run database migrations**
   ```bash
   cd backend
   npm run migration:run
   ```

4. **Start the applications**
   ```bash
   # Backend (in backend directory)
   npm run start:dev
   
   # Frontend (in frontend directory)
   npm run dev
   ```

## API Documentation

### Vendors
- `GET /vendors` - List all vendors
- `POST /vendors` - Create new vendor
- `GET /vendors/:id` - Get vendor details
- `PATCH /vendors/:id` - Update vendor
- `DELETE /vendors/:id` - Soft delete vendor
- `GET /vendors/:id/stats` - Get vendor statistics

### Contracts
- `POST /contracts/upload` - Upload and process contract
- `GET /contracts` - List contracts
- `GET /contracts/:id` - Get contract details
- `PATCH /contracts/:id/status` - Update contract status

### Invoices
- `POST /invoices/upload` - Upload and process invoice
- `GET /invoices` - List invoices
- `GET /invoices/:id` - Get invoice details
- `GET /invoices/:id/reconciliation` - Get reconciliation report
- `PATCH /invoices/:id/approve` - Approve invoice
- `PATCH /invoices/:id/reject` - Reject invoice

## Architecture

### Processing Pipeline

1. **Contract Processing**
   - PDF upload to S3
   - Text extraction (pdf-parse → AWS Textract fallback)
   - AI extraction with OpenAI
   - Date calculation and validation
   - Store structured data in PostgreSQL

2. **Invoice Processing**
   - PDF upload to S3
   - Text extraction
   - AI parsing with OpenAI
   - Vendor matching using embeddings
   - Contract reconciliation
   - Discrepancy detection
   - Report generation

### Security Measures
- File encryption at rest (S3 SSE)
- TLS for data in transit
- JWT authentication
- Comprehensive audit logging
- Sensitive data redaction before AI processing
- Soft delete for data retention

## Deployment

### AWS Infrastructure (coming soon)
- Terraform configuration for infrastructure as code
- ECS Fargate for containerized deployment
- RDS for managed PostgreSQL
- ElastiCache for Redis
- CloudWatch for monitoring
- Application Load Balancer

### CI/CD Pipeline (coming soon)
- GitHub Actions workflow
- Automated testing
- Docker image building
- Deployment to AWS ECS

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For support, contact the development team.

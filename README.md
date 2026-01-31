# InvoiceDue

A self-serve, policy-driven accounts receivable follow-up system. InvoiceDue helps businesses follow up on overdue invoices using outbound phone calls.

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- VAPI account with API key and phone number
- (Optional) Vercel account for deployment

## Project Structure

```
invoicedue.io/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Dashboard pages
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── layout/            # Layout components
│   │   ├── providers/         # Context providers
│   │   └── ui/                # UI components
│   ├── lib/
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── db.ts              # Prisma client
│   │   ├── usage.ts           # Usage tracking
│   │   ├── utils.ts           # Utility functions
│   │   └── vapi.ts            # VAPI integration
│   └── types/
│       └── index.ts           # TypeScript types
├── .env.example               # Environment variables template
├── package.json
├── tailwind.config.js
└── vercel.json                # Vercel configuration
```

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for NextAuth (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Application URL (http://localhost:3000 for local dev) |
| `VAPI_API_KEY` | Your VAPI API key |
| `VAPI_WEBHOOK_SECRET` | Webhook secret from VAPI dashboard |
| `VAPI_PHONE_NUMBER_ID` | Your VAPI phone number ID |

### 3. Set Up Database

Create the database tables:

```bash
npm run db:push
```

Or run migrations for production:

```bash
npm run db:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000

## Database Management

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Push schema changes to database (development)
npm run db:push

# Create and run migrations (production)
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

## VAPI Configuration

1. Create a VAPI account at https://vapi.ai
2. Create a phone number in the VAPI dashboard
3. Configure the webhook URL to point to your application:
   - URL: `https://your-domain.com/api/webhooks/vapi`
   - Events: `call.ended`
4. Copy your API key and phone number ID to your `.env` file

## Features

### Implemented (MVP)

- Email/password authentication
- CSV upload for invoice data
- Policy configuration (cadence, scripts, payment link)
- Outbound calling via VAPI
- Usage tracking with soft warnings and hard caps
- Call history and outcome logging
- Multi-tenant data isolation

### Not Implemented (Deferred)

- Stripe subscription billing
- Call recordings and playback
- Multi-user accounts
- Email notifications
- SSO authentication
- Accounting integrations

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices/upload` - Upload CSV
- `GET /api/invoices/:id` - Get invoice
- `PATCH /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

### Policy
- `GET /api/policy` - Get policy
- `POST /api/policy` - Save policy

### Calls
- `GET /api/calls` - List call history
- `GET /api/calls/export` - Export to CSV

### Usage
- `GET /api/usage` - Get usage status

### Settings
- `GET /api/settings` - Get settings
- `POST /api/settings` - Save settings

### Webhooks
- `POST /api/webhooks/vapi` - VAPI webhook handler

### Cron
- `GET /api/cron/process-calls` - Process call queue (Vercel Cron)

## Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

The `vercel.json` file configures a cron job to process calls every minute.

### Database

Use a managed PostgreSQL provider compatible with serverless:
- Neon (recommended)
- Supabase
- PlanetScale (MySQL alternative)

Ensure connection pooling is configured for serverless environments.

## Environment Modes

| Mode | Description |
|------|-------------|
| `development` | Local development, debug logging |
| `preview` | Vercel preview deployments, test VAPI |
| `production` | Live environment, real calls |

## Security Notes

- All data is isolated by tenant ID
- Passwords are hashed with bcrypt
- VAPI API keys are never exposed to the frontend
- Webhook signatures are verified in production
- Session cookies are HTTP-only and secure

## License

Proprietary - All rights reserved

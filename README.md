# Maintenance Tracker

A modern maintenance management system built with Next.js, Supabase, and shadcn/ui.

## Features

- 🔐 **Role-based Authentication** - Admin and Maintainer roles
- 📊 **Tabbed Admin Dashboard** - Instant navigation without page reloads
- 📦 **Asset Management** - Track equipment and maintenance items
- 📋 **Task Scheduling** - Frequency-based recurring maintenance tasks
- 👥 **User Management** - Manage users and permissions
- ⚡ **Real-time Updates** - Powered by Supabase

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL)
- **UI**: shadcn/ui + Tailwind CSS
- **Language**: TypeScript
- **Authentication**: Supabase Auth

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Schema

See `schema.sql` for the complete database structure.

**Tables:**
- `users` - User profiles with roles
- `assets` - Equipment and maintenance items
- `tasks` - Recurring maintenance tasks

For detailed documentation, see `DB_README.md`

## Project Structure

```
app/
├── admin/          # Admin dashboard with tabs
├── dashboard/      # User dashboard
├── auth/          # Authentication routes
└── assets/        # Asset management

components/
├── admin/         # Admin-specific components
└── ui/           # shadcn UI components

lib/
├── supabaseClient.ts
└── supabaseAuth.ts
```

## Admin Panel

Access at `/admin` (admin/supervisor roles only)

**Tabs:**
- 📊 Dashboard - Overview stats
- 👥 Users - User management
- 📋 Tasks - Task management
- 📦 Assets - Asset management

## Development

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Documentation

- `schema.sql` - Database schema with all tables
- `DB_README.md` - Quick schema reference
- `DATABASE_SCHEMA_FUTURE.md` - Future expansion ideas (not implemented)

## License

MIT

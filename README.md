# Maintenance Tracker

A modern maintenance management system built with Next.js, Supabase, and shadcn/ui.

## ✅ Status: Production Ready

Complete CRUD functionality for Users, Assets, and Tasks with role-based authentication and tabbed admin interface.

## Features

- 🔐 **Role-based Authentication** - Admin, Supervisor, and Maintainer roles
- 📊 **Tabbed Admin Dashboard** - Instant navigation without page reloads
- 👥 **User Management** - Edit and delete existing users
- 📦 **Asset Management** - Full CRUD for equipment tracking
- 📋 **Task Management** - Full CRUD for maintenance scheduling
- 📈 **Real-time Statistics** - Dashboard metrics for all entities
- 🎨 **Modern UI** - Clean, responsive design with shadcn/ui
- ⚡ **Optimized Performance** - Fast loading and updates

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL)
- **UI**: shadcn/ui + Tailwind CSS + Radix UI
- **Language**: TypeScript
- **Authentication**: Supabase Auth
- **Icons**: Lucide React

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
- 📊 **Dashboard** - Overview statistics and metrics
- 👥 **Users** - Edit user details, change roles, delete users
- 📋 **Tasks** - Create, edit, delete maintenance tasks with scheduling
- 📦 **Assets** - Create, edit, delete equipment and assets

**Features:**
- Color-coded status badges
- Confirmation dialogs for delete operations
- Auto-refresh after changes
- Comprehensive statistics cards
- Responsive table views
- Search and filter capabilities

## User Roles

- **Admin/Supervisor** → Redirected to `/admin` (full access)
- **Maintainer** → Redirected to `/dashboard` (view-only)

## Key Features

### User Management
- Edit user name and role
- Delete users with confirmation
- View user statistics (total, admins, maintainers)
- Color-coded role badges

### Asset Management
- Create new assets with type, description, purchase date
- Edit existing assets
- Delete with cascade warning (affects linked tasks)
- Asset statistics (total, types, recent additions)
- Color-coded type badges

### Task Management
- Create tasks with **required** asset assignment
- Schedule with last done date, next due date, frequency
- Edit task details and schedules
- Delete with confirmation
- Status tracking (overdue, due soon, good)
- Task statistics (total, overdue, due soon, completed)
- Auto-loads assets when creating tasks

## Documentation

- **`DB_README.md`** - Database schema reference
- **`USER_MANAGEMENT_FEATURES.md`** - User management documentation
- **`ASSETS_MANAGEMENT_FEATURES.md`** - Asset management documentation
- **`TASKS_MANAGEMENT_FEATURES.md`** - Task management documentation
- **`TASKS_COMPLETE.md`** - Implementation summary
- **`schema.sql`** - Complete database DDL

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

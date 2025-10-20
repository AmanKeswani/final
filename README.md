# Next.js Authentication App with Supabase

A modern Next.js application with authentication powered by Supabase, featuring login, signup, and dashboard functionality.

## Features

- 🔐 User authentication (login/signup/signout)
- 📱 Responsive design with Tailwind CSS
- 🗄️ SQLite database for development
- 🐳 Docker support
- 🚀 Supabase integration for production
- ⚡ Next.js 15 with App Router

## Quick Start

### Development (SQLite)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up the database:**
   ```bash
   npm run db:generate
   npm run db:push
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production with Supabase

1. **Start Supabase services:**
   ```bash
   docker-compose up -d supabase-db supabase-auth supabase-rest
   ```

2. **Build and run the app:**
   ```bash
   docker-compose up nextjs-app
   ```

### Full Docker Setup

1. **Run everything with Docker:**
   ```bash
   docker-compose up
   ```

## Project Structure

```
src/
├── app/
│   ├── login/          # Login page
│   ├── signup/         # Signup page
│   ├── dashboard/      # Protected dashboard
│   └── page.tsx        # Home page
├── components/         # Reusable components
└── lib/
    ├── supabase.ts     # Supabase client
    ├── prisma.ts       # Prisma client
    └── validations.ts  # Zod schemas
```

## Environment Variables

Create a `.env.local` file with:

```env
# Database
DATABASE_URL="file:./dev.db"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="http://localhost:3001"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Authentication Flow

1. **Home Page** (`/`) - Landing page with login/signup links
2. **Login** (`/login`) - User authentication
3. **Signup** (`/signup`) - User registration
4. **Dashboard** (`/dashboard`) - Protected page with user info and signout

## Technologies Used

- **Framework:** Next.js 15
- **Authentication:** Supabase Auth
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **ORM:** Prisma
- **Styling:** Tailwind CSS
- **Validation:** Zod
- **Containerization:** Docker

## Development Notes

- The app uses SQLite for development and testing
- Supabase is configured for production use
- All authentication pages are responsive
- Protected routes redirect to login if not authenticated
- Environment variables are loaded from `.env.local`

## Troubleshooting

### Common Issues

1. **Prisma Client not generated:**
   ```bash
   npm run db:generate
   ```

2. **Database not created:**
   ```bash
   npm run db:push
   ```

3. **Port conflicts:**
   - Next.js: 3000
   - Supabase REST: 3001
   - Supabase Auth: 9999
   - PostgreSQL: 5432

4. **Docker issues:**
   ```bash
   docker-compose down
   docker-compose up --build
   ```

## License

MIT License

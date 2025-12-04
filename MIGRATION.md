# Twitter Clone Migration Guide

## Database Migration Instructions

After setting up your PostgreSQL database, run the following commands:

### 1. Generate Prisma Client
```bash
npx prisma generate
```

### 2. Create Database Migration
```bash
npx prisma migrate dev --name initial_twitter_schema
```

### 3. If you have an existing database with data you want to preserve:

**WARNING**: The new schema is incompatible with the old CodeBreakers schema. You have two options:

#### Option A: Fresh Start (Recommended)
Drop the existing database and start fresh:
```bash
npx prisma migrate reset
```

#### Option B: Manual Data Preservation
If you want to keep user accounts:

1. Export existing users:
```sql
-- Export to CSV or backup
SELECT id, name, email, username, image, "emailVerified", role, "createdAt", "updatedAt"
FROM "user";
```

2. Drop old tables:
```bash
npx prisma migrate reset --skip-seed
```

3. Re-import users if needed

## Environment Variables Required

Make sure your `.env` file has these variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# AWS S3 (for image uploads)
AWS_S3_BUCKET_NAME="your-bucket-name"
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_REGION="us-east-1"

# Better Auth (Keep your existing auth configs)
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Optional: Social Auth Providers
AUTH_GITHUB_CLIENT_ID="your-github-client-id"
AUTH_GITHUB_CLIENT_SECRET="your-github-client-secret"
AUTH_GOOGLE_CLIENT_ID="your-google-client-id"
AUTH_GOOGLE_CLIENT_SECRET="your-google-client-secret"
AUTH_DISCORD_CLIENT_ID="your-discord-client-id"
AUTH_DISCORD_CLIENT_SECRET="your-discord-client-secret"
```

## Testing the Setup

1. Start the development server:
```bash
npm run dev
```

2. Open http://localhost:3000

3. Test authentication:
   - Click "Login" button
   - Register a new account
   - Try posting a tweet

4. Test tweet features:
   - Post a tweet (max 280 characters)
   - Like a tweet
   - Retweet functionality

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check if PostgreSQL is running
- Ensure database exists

### Migration Errors
If you see "Can't reach database server":
- Check your database credentials
- Verify the database is accessible
- Try pinging the database host

### Prisma Client Not Found
Run:
```bash
npm install
npx prisma generate
```

### Build Errors
Clear Next.js cache:
```bash
rm -rf .next
npm run build
```

## Old Routes That Were Removed

These API routes were removed as they're not needed for a Twitter clone:

- `/api/admin/*` (except basic auth helpers)
- `/api/announcements/*`
- `/api/test-email/*`
- `/api/test-payment-email/*`
- `/api/view-announcement-attachment/*`
- `/api/view-attachment/*`
- `/api/view-response-attachment/*`

The following were kept:
- `/api/auth/*` - Authentication
- `/api/s3/*` - File uploads
- `/api/tweets/*` - New tweet functionality
- `/api/follow` - New follow functionality

## Components Removed

Landing page components that were removed:
- `components/homepage/*` (Loader, Navbar, HeroSection, etc.)
- `components/admin_components/*` (Dashboard, Gallery, etc.)
- Event/Quiz related components

UI components from shadcn/ui are still available in `components/ui/`

# Twitter Clone

A modern Twitter clone built with Next.js 16, featuring authentication, tweets, likes, retweets, and user interactions.

## Features

### ✅ Implemented
- **Authentication**: User signup, login, and session management using Better Auth
- **Tweet Creation**: Post tweets up to 280 characters
- **Like System**: Like and unlike tweets
- **Retweet System**: Retweet functionality
- **Follow System**: Follow and unfollow users
- **Real-time Feed**: View tweets from all users
- **File Upload**: S3 integration for image uploads (ready to use)
- **User Profiles**: Basic user profile management

### Database Schema

The application uses PostgreSQL with Prisma ORM. Key models include:

- **User**: Authentication and profile information
- **Tweet**: Main tweet content with support for replies and retweets
- **Like**: Tweet likes/favorites
- **Retweet**: Tweet retweets
- **Comment**: Tweet replies (can also use Tweet model with replyToId)
- **Follow**: User follow relationships
- **Session/Account/Verification**: Authentication models

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- AWS S3 bucket (for image uploads)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables in `.env`:
```env
DATABASE_URL="your-postgresql-url"
AWS_S3_BUCKET_NAME="your-bucket-name"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="your-region"
# Add other auth provider credentials as needed
```

4. Run database migration:
```bash
npx prisma migrate deploy
```

5. Start the development server:
```bash
npm run dev
```

## API Routes

### Tweets
- `GET /api/tweets` - Fetch all tweets
- `POST /api/tweets` - Create a new tweet
- `DELETE /api/tweets?id={tweetId}` - Delete a tweet
- `POST /api/tweets/like` - Like/unlike a tweet
- `POST /api/tweets/retweet` - Retweet/unretweet

### User Interactions
- `POST /api/follow` - Follow/unfollow a user

### Authentication
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in` - User login
- `GET /api/auth/session` - Get current session

### File Upload
- `POST /api/s3/upload` - Upload images to S3

## What Was Removed

The following features from the original CodeBreakers app were removed:
- Event management
- Quiz system
- Attendance tracking
- Task submissions
- Support ticket system
- Announcements
- Admin dashboard (kept basic admin auth)
- Profile completion workflows
- Registration/payment flows

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: Better Auth
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **File Storage**: AWS S3
- **Animations**: Framer Motion

## Next Steps

To fully complete the Twitter clone, consider adding:
- [ ] User profile pages with tweet history
- [ ] Reply/comment functionality UI
- [ ] Image upload in tweet composer
- [ ] Notifications system
- [ ] Direct messages
- [ ] Tweet editing and deletion UI
- [ ] Search functionality
- [ ] Hashtag support
- [ ] User mentions (@username)
- [ ] Bookmarks
- [ ] Dark/light mode toggle (infrastructure exists)
- [ ] Mobile responsiveness improvements
- [ ] Infinite scroll for feed
- [ ] Tweet analytics

## License

This project is for educational purposes.


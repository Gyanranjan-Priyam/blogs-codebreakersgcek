# Homepage Components Structure

This directory contains all the components and logic for the blog homepage.

## Component Organization

### Main Components

- **`Header.tsx`** - Top navigation bar with logo, search, user profile/login
  - Displays logo and brand name
  - Search bar (desktop)
  - User dropdown menu or login button
  
- **`MobileSearch.tsx`** - Mobile-only search bar
  - Shown only on mobile devices

### Custom Hooks

Located in `hooks/` directory - ready for blog-specific functionality to be added.

### Types

- **`types.ts`** - TypeScript interfaces
  - `Blog` interface for blog posts
  - `User` interface for user information

## File Structure

```
_components/
├── hooks/
│   └── index.ts
├── Header.tsx
├── MobileSearch.tsx
├── types.ts
├── index.ts
└── README.md
```

## Features

### Authentication
- Login/logout functionality
- User profile dropdown with settings
- Profile access for logged-in users

### Search
- Search functionality for blogs
- Responsive search (desktop and mobile)

### Theme Support
- Dark/Light mode toggle
- System theme detection

## Usage

The main `Homepage.tsx` imports and uses these components:

```tsx
import { Header } from "./_components/Header";
import { MobileSearch } from "./_components/MobileSearch";
```

## Benefits of This Structure

1. **Modularity** - Each component has a single responsibility
2. **Reusability** - Components can be used in different contexts
3. **Maintainability** - Easier to find and fix bugs
4. **Testability** - Each component can be tested independently
5. **Readability** - Clear separation of concerns
6. **Scalability** - Easy to add new blog features

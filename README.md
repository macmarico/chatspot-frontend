# ChatSpot Frontend

This is the frontend application for ChatSpot, a real-time messaging platform.

## Environment Setup

The application uses environment variables to configure different environments. There are three environment configurations:

1. **Development** (`.env.development`): Used for local development
2. **Staging** (`.env.staging`): Used for testing in a staging environment
3. **Production** (`.env.production`): Used for production deployment

### Available Environment Variables

| Variable | Description | Example |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3000/` |
| `VITE_WS_URL` | WebSocket server URL | `ws://localhost:3000/` |
| `VITE_ENV` | Current environment | `development`, `staging`, or `production` |
| `VITE_DEBUG` | Enable debug logging | `true` or `false` |

### Running in Different Environments

The following npm scripts are available to run the application in different environments:

```bash
# Development environment (default)
npm run dev

# Staging environment
npm run dev:staging

# Production environment
npm run dev:prod
```

### Building for Different Environments

```bash
# Build for production (default)
npm run build

# Build for development
npm run build:dev

# Build for staging
npm run build:staging
```

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Install dependencies
npm install
```

### Starting the Development Server

```bash
# Start the development server
npm run dev
```

The application will be available at http://localhost:5173/

## Database

The application uses WatermelonDB for local data storage. The database schema is defined in `src/database/schema.ts`.

## State Management

Redux is used for state management with Redux Saga for handling side effects.

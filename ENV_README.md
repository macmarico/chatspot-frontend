# Environment Configuration

This project uses environment variables to configure the connection to the backend API and WebSocket server.

## Available Environment Files

- `.env`: Default environment variables for development
- `.env.production`: Environment variables for production builds

## Environment Variables

- `VITE_API_URL`: The URL of the backend API server (e.g., `http://localhost:3000` for development or `https://api.example.com` for production)
- `VITE_WS_URL`: The URL of the WebSocket server (e.g., `ws://localhost:3000` for development or `wss://api.example.com` for production)

## How to Use

### Development

For local development, the `.env` file is used by default. You can modify this file to point to your local backend server.

```bash
# Start the development server
npm run dev
```

### Production

For production builds, the `.env.production` file is used. Make sure to update this file with your actual deployed backend URL before building.

```bash
# Build for production
npm run build
```

### Custom Environment

You can also create custom environment files like `.env.staging` and use them by specifying the mode:

```bash
# Use staging environment
npm run dev -- --mode staging
```

## Important Notes

- All environment variables used in the frontend must be prefixed with `VITE_` to be exposed to the client-side code.
- Never store sensitive information (like API keys or secrets) in these files as they will be exposed to the client.

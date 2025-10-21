# Deployment Guide

This guide covers how to deploy the AI Interview Platform to various cloud platforms.

## Prerequisites

- MongoDB database (local or cloud)
- OpenAI API key
- Node.js environment

## Environment Variables

### Required Environment Variables

#### Server (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-interview-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
OPENAI_API_KEY=your-openai-api-key-here
NODE_ENV=production
```

#### Client (.env)
```env
REACT_APP_API_URL=https://your-api-domain.com/api
```

## Database Setup

### MongoDB Atlas (Recommended)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create a database user
4. Whitelist your IP addresses (or 0.0.0.0/0 for all)
5. Get connection string and update `MONGODB_URI`

### Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Use `mongodb://localhost:27017/ai-interview-app`

## Deployment Options

### 1. Railway (Recommended)

Railway offers easy deployment with built-in MongoDB and environment variable management.

#### Steps:
1. Fork this repository
2. Connect to [Railway](https://railway.app)
3. Create new project from GitHub repo
4. Add environment variables in Railway dashboard
5. Deploy automatically

#### Railway Configuration:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run server",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### 2. Render

#### Backend Deployment:
1. Create account at [Render](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Configure:
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Add environment variables

#### Frontend Deployment:
1. Create new Static Site
2. Configure:
   - Build Command: `cd client && npm run build`
   - Publish Directory: `client/build`
   - Add environment variables

### 3. Heroku

#### Backend:
```bash
# Install Heroku CLI
heroku create your-app-name-api

# Set environment variables
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret
heroku config:set OPENAI_API_KEY=your-openai-key
heroku config:set NODE_ENV=production

# Create Procfile
echo "web: cd server && npm start" > Procfile

# Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

#### Frontend (Netlify):
```bash
# Build the app
cd client && npm run build

# Deploy to Netlify
# Upload the build folder to Netlify
# Set environment variable: REACT_APP_API_URL=https://your-heroku-app.herokuapp.com/api
```

### 4. DigitalOcean App Platform

1. Create account at [DigitalOcean](https://www.digitalocean.com)
2. Create new App
3. Connect GitHub repository
4. Configure components:

#### API Component:
- Source: `/server`
- Build Command: `npm install`
- Run Command: `npm start`
- Environment Variables: Add all server variables

#### Web Component:
- Source: `/client`
- Build Command: `npm run build`
- Output Directory: `build`
- Environment Variables: Add `REACT_APP_API_URL`

### 5. Vercel + PlanetScale

#### Frontend (Vercel):
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd client
vercel

# Set environment variables in Vercel dashboard
```

#### Backend (Railway/Render):
Deploy backend separately using Railway or Render as described above.

## Docker Deployment

### Dockerfile (Server)
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --only=production

COPY server/ .

EXPOSE 5000

CMD ["npm", "start"]
```

### Dockerfile (Client)
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY client/package*.json ./
RUN npm ci

COPY client/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:5
    environment:
      MONGO_INITDB_DATABASE: ai-interview-app
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  server:
    build:
      context: .
      dockerfile: server/Dockerfile
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/ai-interview-app
      - JWT_SECRET=your-jwt-secret
      - OPENAI_API_KEY=your-openai-key
    ports:
      - "5000:5000"
    depends_on:
      - mongodb

  client:
    build:
      context: .
      dockerfile: client/Dockerfile
    environment:
      - REACT_APP_API_URL=http://localhost:5000/api
    ports:
      - "3000:80"
    depends_on:
      - server

volumes:
  mongodb_data:
```

## SSL/HTTPS Configuration

### Cloudflare (Recommended)
1. Add your domain to Cloudflare
2. Update DNS records
3. Enable SSL/TLS encryption
4. Use Full (strict) SSL mode

### Let's Encrypt (Self-managed)
```bash
# Install Certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Configure nginx/apache with SSL
```

## Performance Optimization

### Backend Optimizations
1. Enable compression middleware
2. Use Redis for session storage
3. Implement database indexing
4. Add caching layers
5. Use CDN for static assets

### Frontend Optimizations
1. Code splitting with React.lazy()
2. Image optimization
3. Bundle analysis and optimization
4. Service worker for caching
5. Lazy loading for components

## Monitoring and Logging

### Recommended Tools
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **New Relic** - Performance monitoring
- **MongoDB Atlas Monitoring** - Database metrics

### Basic Logging Setup
```javascript
// Add to server/index.js
const winston = require('winston');

const logger = winston.create({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Set secure environment variables
- [ ] Enable CORS properly
- [ ] Use helmet.js for security headers
- [ ] Implement rate limiting
- [ ] Validate all inputs
- [ ] Keep dependencies updated
- [ ] Use strong JWT secrets
- [ ] Implement proper error handling
- [ ] Set up monitoring and alerts

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS configuration in server
   - Verify API URL in client environment variables

2. **Database Connection**
   - Verify MongoDB URI
   - Check network connectivity
   - Ensure database user has proper permissions

3. **OpenAI API Issues**
   - Verify API key is correct
   - Check API usage limits
   - Ensure proper error handling for API failures

4. **Build Failures**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all environment variables are set

### Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test API endpoints manually
4. Check database connectivity
5. Review security group/firewall settings

---

**Need help?** Create an issue in the repository with your deployment platform and error details.
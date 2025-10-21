# AI Interview Platform

A comprehensive MERN (MongoDB, Express.js, React, Node.js) stack application that enables AI-powered interviews for technical and behavioral assessments.

## 🚀 Features

### Core Functionality
- **AI-Powered Interviews**: Conduct realistic interviews with OpenAI integration
- **Multiple Interview Types**: Technical, Behavioral, and Mixed interviews
- **Real-time Chat**: Interactive conversation with AI interviewer
- **Intelligent Scoring**: AI-generated performance analysis and recommendations
- **Interview Management**: Create, start, pause, and complete interviews
- **Detailed Analytics**: Comprehensive results with scores and feedback

### User Experience
- **Modern UI**: Clean, responsive design with Material-UI
- **User Authentication**: Secure signup/login with JWT tokens
- **Profile Management**: Customizable user profiles with skills and experience
- **Dashboard**: Overview of all interviews and statistics
- **Real-time Updates**: Socket.io integration for live interview updates

### Technical Features
- **Scalable Architecture**: Modular backend with proper error handling
- **Security**: Rate limiting, input validation, and secure authentication
- **Database**: MongoDB with Mongoose ODM
- **API Documentation**: RESTful API design
- **Responsive Design**: Mobile-friendly interface

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **OpenAI API** - AI interview capabilities
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **Material-UI** - Component library
- **React Router** - Navigation
- **React Query** - Data fetching
- **Socket.io Client** - Real-time updates
- **React Hook Form** - Form management
- **Axios** - HTTP client

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v14 or higher)
- **MongoDB** (local or cloud instance)
- **OpenAI API Key** (for AI functionality)
- **npm** or **yarn** package manager

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ai-interview-app
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
npm run install-server

# Install client dependencies
npm run install-client
```

### 3. Environment Configuration

#### Server Configuration
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-interview-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
OPENAI_API_KEY=your-openai-api-key-here
NODE_ENV=development
```

#### Client Configuration (Optional)
Create a `.env` file in the `client` directory if using custom API URL:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Database Setup

#### Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. The application will automatically create the database

#### MongoDB Atlas (Cloud)
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get the connection string
4. Update `MONGODB_URI` in server/.env

### 5. OpenAI API Setup
1. Sign up at [OpenAI](https://platform.openai.com/)
2. Generate an API key
3. Add the key to `OPENAI_API_KEY` in server/.env

## 🏃‍♂️ Running the Application

### Development Mode
```bash
# Run both server and client concurrently
npm run dev

# Or run separately:
npm run server  # Runs backend on port 5000
npm run client  # Runs frontend on port 3000
```

### Production Mode
```bash
# Build the client
npm run build

# Start the server
npm run server
```

## 📁 Project Structure

```
ai-interview-app/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── ...
│   └── package.json
├── server/                 # Express backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   └── package.json
├── package.json            # Root package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Interviews
- `GET /api/interviews` - Get user interviews
- `POST /api/interviews` - Create new interview
- `GET /api/interviews/:id` - Get specific interview
- `PUT /api/interviews/:id/start` - Start interview
- `PUT /api/interviews/:id/end` - End interview
- `POST /api/interviews/:id/messages` - Add message

### AI Integration
- `POST /api/ai/generate-question` - Generate AI question
- `POST /api/ai/evaluate-answer` - Evaluate user answer
- `POST /api/ai/generate-summary` - Generate interview summary

## 🎯 Usage Guide

### For Candidates

1. **Sign Up**: Create an account as a candidate
2. **Create Interview**: Set up a new interview session
   - Choose position and company
   - Select interview type (Technical/Behavioral/Mixed)
   - Set difficulty level and duration
3. **Start Interview**: Begin the AI-powered interview
4. **Interactive Session**: Answer questions from the AI interviewer
5. **View Results**: Get detailed analysis and recommendations

### For Interviewers

1. **Sign Up**: Create an account as an interviewer
2. **Review Interviews**: Access candidate interview results
3. **Analyze Performance**: Review AI-generated assessments

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured for secure cross-origin requests
- **Helmet**: Security headers for Express.js

## 🚀 Deployment

### Backend Deployment (Heroku/Railway/DigitalOcean)
1. Set environment variables
2. Deploy server code
3. Ensure MongoDB connection

### Frontend Deployment (Netlify/Vercel)
1. Build the React app
2. Deploy build folder
3. Configure API URL

### Full-Stack Deployment
- Use platforms like Railway, Render, or DigitalOcean App Platform
- Configure environment variables
- Set up MongoDB connection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for providing the AI capabilities
- Material-UI for the component library
- MongoDB for the database solution
- Socket.io for real-time functionality

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

---

**Happy Interviewing! 🎉**
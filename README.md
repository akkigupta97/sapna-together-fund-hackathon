# 🌙 Sapna - Your AI-Powered Sleep Companion

<div align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white" alt="AWS" />
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI" />
</div>

<p align="center">
  <strong>Transform your sleep with AI-generated personalized soundscapes and intelligent sleep coaching</strong>
</p>

[![Watch the video](/shared/final.png)](/shared/vid.mp4)

<p align="center">
  Sapna is a sophisticated sleep wellness application that combines cutting-edge AI technology with sleep science to create personalized audio experiences that help you fall asleep faster, sleep deeper, and wake up refreshed.
</p>

---

## ✨ Features

### 🎵 **AI-Powered Personalized Soundscapes**
- **Smart Audio Generation**: Leverages AI to create unique soundscapes tailored to your sleep profile
- **Adaptive Sound Selection**: Automatically adjusts based on your recent sleep quality, stress levels, and time of day
- **Multiple Audio Categories**: Nature sounds, white noise, ASMR, ambient music, and more
- **Environmental Optimization**: Masks city noise or enhances quiet environments based on your location

### 🎮 **Interactive 3D Sound Generator**
- **Immersive Visual Experience**: Beautiful 3D sphere visualization using Three.js
- **Real-time Audio Creation**: Generate custom sounds with interactive controls
- **Particle Effects**: Stunning visual feedback with Perlin noise animations
- **Mix & Match**: Combine different sound attributes to create your perfect sleep soundtrack

### 📊 **Comprehensive Sleep Tracking**
- **Detailed Sleep Analytics**: Track duration, quality, and sleep phases (deep, light, REM)
- **Sleep Quality Scoring**: Intelligent algorithm that evaluates your sleep patterns
- **Visual Sleep Charts**: Beautiful graphs showing your sleep trends over time
- **Progress Monitoring**: Track improvements in your sleep quality

### 🤖 **Luna - Your AI Sleep Assistant**
- **24/7 Sleep Coaching**: Get personalized advice from an AI trained on sleep science
- **Contextual Conversations**: Luna remembers your sleep history and preferences
- **Evidence-Based Recommendations**: Receive scientifically-backed sleep tips
- **Emotional Support**: Warm, understanding responses to help reduce sleep anxiety

### 👤 **Personalized Sleep Profiles**
- **Chronotype Assessment**: Discover if you're an early bird or night owl
- **Custom Sleep Goals**: Set and track your ideal bedtime and wake time
- **Preference Learning**: The app learns from your feedback and usage patterns
- **Daily Check-ins**: Track mood and stress levels for better personalization

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or use Neon serverless PostgreSQL)
- API Keys:
  - ElevenLabs API key for audio generation
  - OpenAI API key for the AI assistant
  - Optional: AWS credentials for serverless deployment

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sapna-sleep-companion.git
   cd sapna-sleep-companion
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@host:5432/sapna_db
   
   # API Keys
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   OPENAI_API_KEY=your_openai_api_key
   
   # Optional: AWS Configuration
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:8080`

## 📁 Project Structure

```
sapna-sleep-companion/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── pages/         # Application pages
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/          # Core libraries and utilities
│   │   └── components/ui/ # shadcn/ui component library
│   └── public/           # Static assets
├── server/                # Express.js backend
│   ├── services/         # External API integrations
│   ├── routes.ts        # API endpoint definitions
│   └── index.ts         # Server entry point
├── serverless/           # AWS Lambda functions
│   ├── src/             # Lambda function handlers
│   └── serverless.yml   # Serverless configuration
├── shared/              # Shared types and schema
│   └── schema.ts       # Database schema definitions
└── package.json        # Project dependencies and scripts
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run dev:frontend     # Start only frontend dev server
npm run dev:backend      # Start only backend dev server

# Building
npm run build           # Build both frontend and backend
npm run build:frontend  # Build frontend only
npm run build:backend   # Build backend only

# Database
npm run db:push         # Push schema changes to database
npm run db:studio       # Open Drizzle Studio for database management

# Deployment
npm run deploy:frontend    # Deploy frontend to AWS S3/CloudFront
npm run deploy:serverless  # Deploy Lambda functions to AWS

# Code Quality
npm run lint            # Run ESLint
npm run typecheck       # Run TypeScript type checking
npm run format          # Format code with Prettier
```

### API Endpoints

- `GET /api/user` - Get current user data
- `POST /api/onboarding` - Complete user onboarding
- `GET /api/sleep-profile` - Get user's sleep profile
- `POST /api/sleep-sessions` - Create/update sleep sessions
- `POST /api/generate-audio` - Generate personalized audio
- `POST /api/chat` - Chat with Luna AI assistant
- `GET /api/sleep-insights` - Get AI-powered sleep insights

## 🎨 Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for lightning-fast builds and HMR
- **Tailwind CSS** for responsive, beautiful UI
- **shadcn/ui** for accessible, customizable components
- **Three.js** for immersive 3D visualizations
- **Framer Motion** for smooth animations
- **TanStack Query** for efficient data fetching

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **ElevenLabs API** for AI voice generation
- **OpenAI GPT-4** for intelligent chat
- **Zod** for runtime type validation

### Infrastructure
- **AWS Lambda** for serverless functions
- **DynamoDB** for serverless data storage
- **S3** for audio file storage
- **CloudFront** for global CDN

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ for the Together Fund Hackathon
- Powered by ElevenLabs for amazing AI voice generation
- Special thanks to OpenAI for GPT-4 integration
- UI components from the amazing shadcn/ui library

## 📧 Contact

For questions, feedback, or support:
- Open an issue on GitHub
- Email: akshat.ag1097@gmail.com

---

<p align="center">
  <strong>Sweet dreams start with Sapna 🌙</strong>
</p>

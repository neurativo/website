# AI-Powered Learning Platform

A modern, interactive learning platform built with React, TypeScript, and Supabase that uses AI to generate personalized quizzes and learning experiences.

## 🚀 Features

### Core Learning Features

- **AI-Generated Quizzes**: Create custom quizzes from any content using multiple AI providers (OpenAI, Claude, Gemini, AIMLAPI)
- **Multiple Question Types**: Multiple choice, true/false, and short answer questions
- **Real-time Progress Tracking**: Track your learning progress with detailed analytics
- **Interactive Dashboard**: Beautiful dashboard showing your stats, streaks, and achievements
- **Learning Paths**: AI-generated personalized learning paths based on your goals

### User Experience

- **Authentication System**: Complete signup/login with profile management
- **Subscription Plans**: Free tier with limitations, paid plans for advanced features
- **Mobile Responsive**: Fully responsive design that works on all devices
- **PWA Ready**: Progressive Web App capabilities for offline use
- **Typing Animations**: Engaging hero section with animated text

### Advanced Features

- **Battle System**: Competitive learning with other users
- **Daily Challenges**: Daily quizzes to maintain learning streaks
- **Knowledge Graph**: Visual representation of learning connections
- **Voice Input**: Speech-to-text for hands-free interaction
- **AR Learning**: Augmented reality learning experiences (framework ready)

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **AI Services**: OpenAI, Claude, Gemini, AIMLAPI
- **Deployment**: Vercel/Netlify ready

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/neurativo/ai-learning-platform.git
   cd ai-learning-platform
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_key
   VITE_CLAUDE_API_KEY=your_claude_key
   VITE_GEMINI_API_KEY=your_gemini_key
   VITE_AIMLAPI_API_KEY=your_aimlapi_key
   VITE_ACTIVE_AI_PROVIDER=aimlapi
   ```

4. **Set up Supabase Database**

   - Create a new Supabase project
   - Run the SQL scripts in the `supabase/migrations/` folder
   - Or use the provided `database_setup_final.sql` for complete setup

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🗄️ Database Setup

### Quick Setup

Run the complete database setup script:

```sql
-- Run this in your Supabase SQL editor
\i database_setup_final.sql
```

### Manual Setup

1. Create tables using the migration files in `supabase/migrations/`
2. Set up Row Level Security (RLS) policies
3. Configure authentication settings
4. Set up Edge Functions for AI integration

## 🎯 Usage

### For Learners

1. **Sign up** for a free account
2. **Create quizzes** from any content using AI
3. **Take quizzes** and track your progress
4. **View analytics** on your dashboard
5. **Upgrade** to premium for unlimited features

### For Educators

1. **Upload content** or paste text
2. **Generate quizzes** automatically with AI
3. **Customize questions** and difficulty levels
4. **Share quizzes** with students
5. **Track student progress**

## 🔧 Configuration

### AI Provider Setup

The platform supports multiple AI providers. Configure them in your environment variables:

```env
# Primary AI Provider (recommended: aimlapi for cost-effectiveness)
VITE_ACTIVE_AI_PROVIDER=aimlapi

# API Keys for different providers
VITE_OPENAI_API_KEY=sk-...
VITE_CLAUDE_API_KEY=sk-ant-...
VITE_GEMINI_API_KEY=AIza...
VITE_AIMLAPI_API_KEY=sk-...
```

### Supabase Configuration

1. Create a new Supabase project
2. Get your project URL and anon key
3. Add them to your environment variables
4. Run the database setup scripts

## 📱 Features in Detail

### Quiz System

- **AI Generation**: Automatically create quizzes from any text content
- **Multiple Formats**: Multiple choice, true/false, short answer
- **Difficulty Levels**: Easy, medium, hard with appropriate question complexity
- **Time Limits**: Configurable time limits per question
- **Explanations**: Detailed explanations for each answer
- **Progress Tracking**: Real-time progress and score calculation

### User Management

- **Authentication**: Secure signup/login with Supabase Auth
- **Profiles**: User profiles with customizable information
- **Subscription Plans**: Free, Pro, and Enterprise tiers
- **Usage Tracking**: Monitor AI usage and quiz creation limits

### Dashboard & Analytics

- **Learning Stats**: XP, level, streak, total quizzes
- **Progress Charts**: Visual representation of learning progress
- **Achievement System**: Unlock achievements for consistent learning
- **Subscription Info**: Current plan and usage limits

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify Deployment

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables

### Manual Deployment

```bash
npm run build
# Upload the dist folder to your hosting provider
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Backend powered by [Supabase](https://supabase.com/)
- AI services from OpenAI, Anthropic, Google, and AIMLAPI

## 📞 Support

For support, email support@neurativo.com or create an issue in this repository.

---

**Built with ❤️ by [Neurativo](https://github.com/neurativo)**

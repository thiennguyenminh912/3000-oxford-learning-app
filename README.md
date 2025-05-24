# 📚 Oxford 5000+ Vocabulary Builder

A modern, interactive web application for learning the Oxford 5000+ word list with smart learning algorithms, multiple practice modes, and progress tracking.

## 🌟 Features

### 🎯 Learning Modes
- **Flashcards**: Traditional flashcard-style learning with definitions
- **Quiz Games**: Multiple-choice questions with instant feedback
- **Spelling Challenge**: Type the correct spelling of words
- **Pronunciation Practice**: Audio-based pronunciation training with text-to-speech

### 🧠 Smart Learning Algorithm
- **Adaptive Word Selection**: Prioritizes words based on learning progress
- **Spaced Repetition**: Uses encounter tracking to optimize retention
- **Review Queue**: Automatically queues words that need reinforcement
- **Progress Analytics**: Tracks completion rates and learning statistics

### 📊 Progress Tracking
- **Completion Statistics**: Visual progress bars and percentages
- **Word Status Management**: Tracks new, learning, and known words
- **Level-based Filtering**: Filter by Oxford levels (A1, A2, B1, B2, C1, C2)
- **Session Customization**: Adjustable session lengths for flexible learning

### 🔍 Word Management
- **Browse 5000+ Words**: Complete Oxford word list with definitions
- **Search Functionality**: Find specific words quickly
- **Filter by Level**: Focus on specific difficulty levels
- **Filter by Status**: View words by learning progress

## 🚀 Tech Stack

- **Frontend**: React 19 with TypeScript
- **State Management**: Zustand with persistence
- **Styling**: Tailwind CSS with custom components
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Heroicons
- **Routing**: React Router DOM
- **Build Tool**: Vite
- **Package Manager**: Yarn

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- Yarn package manager

### Setup
1. Clone the repository:
```bash
git clone https://github.com/thiennguyenminh912/3000-oxford-learning-app.git
cd 3000-oxford-learning-app
```

2. Install dependencies:
```bash
yarn install
```

3. Start the development server:
```bash
yarn start
```

The application will be available at `http://localhost:5173`

## 🛠️ Available Scripts

- `yarn start` - Start development server
- `yarn build` - Build for production
- `yarn preview` - Preview production build
- `yarn lint` - Run ESLint

## 🎮 Usage

### Getting Started
1. **Home Page**: View your learning progress and quick access to features
2. **Start Learning**: Begin a customized learning session
3. **Browse Words**: Explore the complete word list with filters
4. **Track Progress**: Monitor your learning statistics and completion rates

### Learning Session
1. Choose your preferred learning mode
2. Set session length (default: 20 words)
3. Practice with interactive exercises
4. Mark words as known, learning, or skip
5. Complete sessions to build your vocabulary

### Smart Learning Features
- The app automatically selects words based on your learning progress
- Words you're struggling with appear more frequently
- Review queue ensures you revisit challenging vocabulary
- Progress tracking helps identify areas for improvement

## 🌐 Deployment

The app is configured for GitHub Pages deployment with automatic builds.

### Manual Deployment
```bash
yarn build
```

The built files will be in the `dist` directory, ready for deployment to any static hosting service.

### GitHub Pages
The app automatically deploys to GitHub Pages on push to the main branch.

**Live Demo**: [https://thiennguyenminh912.github.io/3000-oxford-learning-app](https://thiennguyenminh912.github.io/3000-oxford-learning-app)

## 📱 Progressive Web App (PWA)

The application includes PWA features:
- Offline capability
- Install on mobile devices
- App-like experience
- Service worker for caching

## 🗂️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Flashcard.tsx   # Flashcard learning component
│   ├── QuizGame.tsx    # Quiz game component
│   ├── SpellingChallenge.tsx
│   ├── PronunciationPractice.tsx
│   └── Layout.tsx      # Main layout wrapper
├── pages/              # Page components
│   ├── HomePage.tsx    # Dashboard and overview
│   ├── LearnPage.tsx   # Main learning interface
│   ├── WordsListPage.tsx # Browse all words
│   └── ProgressPage.tsx # Progress analytics
├── store/              # State management
│   └── wordStore.ts    # Zustand store for words
├── services/           # API and external services
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── assets/            # Static assets
```

## 🎯 Learning Methodology

The app implements evidence-based learning techniques:

1. **Spaced Repetition**: Words are reviewed at increasing intervals
2. **Active Recall**: Multiple interactive testing methods
3. **Adaptive Learning**: Difficulty adjusts based on performance
4. **Progress Feedback**: Visual indicators of learning progress
5. **Variety in Practice**: Multiple learning modes prevent monotony

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Oxford University Press for the Oxford 5000 word list
- The React and TypeScript communities
- All contributors and testers

## 📞 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check the documentation
- Review existing issues for solutions

---

**Happy Learning! 🎓**

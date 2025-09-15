# Language Learning App

## Overview

This is a multilingual language learning application focused on pronunciation practice and vocabulary acquisition. The app supports multiple languages including English, Japanese, Korean, French, and Chinese, with a primary focus on helping Japanese speakers learn other languages. It features vocabulary cards, pronunciation recording with speech recognition feedback, progress tracking, and gamification elements like achievements.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with custom theme variables and mobile-first responsive design
- **State Management**: TanStack Query for server state management and data fetching
- **Routing**: Wouter for lightweight client-side routing
- **Mobile Design**: Tab-based navigation with mobile-optimized UI components

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Development**: Hot module replacement with Vite middleware integration
- **Error Handling**: Centralized error middleware with structured error responses

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Multilingual vocabulary table with user progress tracking, pronunciation sessions, achievements, and user settings
- **Database Provider**: Neon serverless PostgreSQL
- **Migrations**: Drizzle Kit for schema management and migrations

### Key Features Architecture
- **Speech Recognition**: Browser Web Speech API integration with language-specific recognition
- **Text-to-Speech**: Browser Speech Synthesis API for pronunciation playback
- **Pronunciation Analysis**: Custom algorithm using Levenshtein distance for accuracy scoring
- **Progress Tracking**: User learning statistics with difficulty marking and review scheduling
- **Gamification**: Achievement system with unlockable rewards

### Component Structure
- **Pages**: Dashboard, vocabulary learning, pronunciation practice, progress tracking, and settings
- **Shared Components**: Vocabulary cards with flip animations, pronunciation recorder with real-time feedback, and tab navigation
- **UI Components**: Comprehensive design system with cards, buttons, forms, and mobile-optimized layouts

## External Dependencies

### Core Libraries
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm** and **drizzle-zod**: Database ORM and schema validation
- **@neondatabase/serverless**: Neon PostgreSQL driver for serverless environments

### UI and Styling
- **@radix-ui/react-\***: Accessible UI component primitives (dialog, dropdown, toast, etc.)
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Tools
- **vite**: Build tool and development server
- **typescript**: Type safety and development experience
- **@replit/vite-plugin-\***: Replit-specific development enhancements

### Validation and Forms
- **zod**: Runtime type validation and schema definition
- **react-hook-form** and **@hookform/resolvers**: Form state management with validation

### Additional Features
- **date-fns**: Date manipulation and formatting
- **embla-carousel-react**: Touch-friendly carousel component for mobile
- **wouter**: Lightweight routing for single-page application navigation
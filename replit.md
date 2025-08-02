# Overview

This is a comprehensive sleep wellness application built with React (frontend) and Express.js (backend), designed to help users improve their sleep quality through personalized audio generation, sleep tracking, and AI-powered chat assistance. The app uses ElevenLabs for text-to-speech audio generation and OpenAI for intelligent sleep coaching conversations.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with pages for home, sleep tracking, chat, profile, and onboarding
- **UI Library**: Radix UI primitives with shadcn/ui components for consistent design
- **Styling**: Tailwind CSS with custom sleep-themed color variables (deep purple, soft indigo, mint green)
- **State Management**: TanStack Query for server state management with React Context for audio playback
- **Audio Context**: Custom audio provider for managing audio playback across the application
- **Mobile-First Design**: Responsive layout with bottom navigation for mobile and desktop variants

## Backend Architecture
- **Framework**: Express.js with TypeScript using ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Storage Layer**: Interface-based storage abstraction with in-memory implementation for development
- **API Design**: RESTful API structure with routes for users, sleep profiles, sleep sessions, generated audios, and chat
- **Error Handling**: Centralized error handling middleware with structured error responses
- **Development Setup**: Vite middleware integration for hot reloading in development

## Database Schema Design
- **Users**: Core user entity with onboarding status tracking
- **Sleep Profiles**: User preferences including bedtime, wake time, sound preferences, environment, and sleep issues
- **Sleep Sessions**: Individual sleep tracking records with quality metrics and duration breakdown
- **Generated Audios**: AI-generated audio content with metadata, play counts, and favorite status
- **Chat Messages**: Conversation history between users and the AI sleep assistant

## Audio Generation System
- **Smart Algorithm**: Sleep algorithm that analyzes user preferences and recent sleep quality to generate optimal audio parameters
- **Category Selection**: Dynamic selection based on user preferences (nature, white noise, ASMR, ambient)
- **Intensity Adjustment**: Adaptive intensity based on stress levels and sleep performance
- **Time-Aware Generation**: Different audio characteristics for evening, night, and morning use

# External Dependencies

## Third-Party APIs
- **ElevenLabs**: Text-to-speech API for generating personalized sleep audio content with voice selection and quality settings
- **OpenAI GPT-4o**: Chat completion API for the Luna sleep assistant with conversation history and sleep data analysis

## Database
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL with connection pooling
- **Drizzle Kit**: Database migration and schema management tools

## UI/UX Libraries
- **Radix UI**: Comprehensive primitive component library for accessible UI components
- **shadcn/ui**: Pre-built component library built on Radix UI primitives
- **Lucide React**: Icon library for consistent iconography
- **TanStack Query**: Data fetching and caching library for server state management
- **Embla Carousel**: Carousel component for audio browsing
- **React Hook Form**: Form handling with validation using Zod schemas

## Development Tools
- **Vite**: Build tool and development server with HMR support
- **TypeScript**: Static typing for both frontend and backend
- **ESBuild**: Fast bundling for production builds
- **Replit Integration**: Development environment integration with error overlays and cartographer plugin
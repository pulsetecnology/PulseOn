# PulseOn - Personal Workout Platform

## Overview

PulseOn is a modern web platform for creating and tracking personalized workouts using artificial intelligence to generate exercises adapted to user profiles. The system provides comprehensive workout management with AI-powered recommendations through N8N integration.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Vite** as the build tool and development server
- **Tailwind CSS** for utility-first styling with **Radix UI** components
- **TanStack Query** for server state management and caching
- **Wouter** for lightweight client-side routing
- **React Hook Form** with Zod validation for form management
- **Framer Motion** for animations

### Backend Architecture
- **Express.js** server with TypeScript
- **JWT-based authentication** with bcryptjs for password hashing
- **RESTful API** design with Express middleware
- **Multer** for file upload handling (profile avatars)
- **Drizzle ORM** with PostgreSQL as the primary database

### Database Design
The system uses **PostgreSQL** with the following main entities:
- **users**: Complete user profiles with fitness data and lifestyle information
- **sessions**: JWT session management
- **scheduledWorkouts**: AI-generated workout plans
- **workoutSessions**: Completed workout tracking with detailed exercise data

## Key Components

### Authentication System
- JWT-based authentication with 7-day token expiration
- Secure password hashing using bcryptjs with 12 salt rounds
- Protected routes with middleware authentication
- Session management with automatic cleanup

### User Profile Management
- Comprehensive onboarding process (7-step wizard)
- Personal information (age, weight, height, gender)
- Fitness goals and experience levels
- Equipment availability and physical restrictions
- Lifestyle factors (sleep, stress, diet, smoking, alcohol)

### AI Workout Generation
- Integration with **N8N webhook** for AI-powered workout creation
- User profile data synchronization with external AI service
- Structured workout plans with detailed exercise specifications
- Automatic workout scheduling and management

### Workout Tracking
- Real-time workout execution with timer functionality
- Exercise progression tracking (sets, reps, weight, effort level)
- Comprehensive workout history and statistics
- Performance analytics and progress visualization

## Data Flow

1. **User Registration/Login**: JWT token generation and storage
2. **Onboarding**: Multi-step profile creation with validation
3. **AI Sync**: User data sent to N8N webhook for workout generation
4. **Workout Execution**: Real-time tracking with local state management
5. **Data Persistence**: Completed workouts stored with detailed metrics
6. **Analytics**: Historical data aggregation for progress tracking

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **@radix-ui/***: Accessible UI component library
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Type-safe database operations
- **zod**: Runtime type validation

### AI Integration
- **N8N Webhook**: External AI service for workout generation
- Custom N8N service layer for request/response handling
- Structured data exchange with validation

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Production build optimization
- **better-sqlite3**: Development database option

## Deployment Strategy

### Production Build
- Vite builds optimized React application to `dist/public`
- esbuild bundles Express server to `dist/index.js`
- Single-command deployment with `npm run build && npm start`

### Database Migration
- Drizzle Kit handles schema migrations
- PostgreSQL as production database
- `npm run db:push` for schema deployment

### Environment Configuration
- `DATABASE_URL` for PostgreSQL connection
- `JWT_SECRET` for authentication security
- `N8N_WEBHOOK_URL` for AI integration

## Changelog

```
Changelog:
- July 5, 2025. Added "Não Consigo Continuar" button to mark exercises as incomplete during execution
- July 5, 2025. Exercises can now have three statuses: completed, incomplete, not-started
- July 5, 2025. History displays exercise status badges at bottom left of cards
- July 5, 2025. Incomplete exercises show notes about completed series and don't count calories
- July 4, 2025. Updated weight component styling to match effort level component
- July 4, 2025. Enhanced active exercise card with blue background for better visibility
- June 27, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```
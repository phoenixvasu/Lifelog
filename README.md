# Lifelog

**Lifelog** is a modern, privacy-focused journaling and mood-tracking web application. It enables users to capture daily reflections in a single sentence, track their emotional patterns, visualize memories, and receive gentle reminders—all while keeping their data secure and under their control.

---

## Table of Contents

- [Introduction](#introduction)
- [Architecture](#architecture)
- [Features](#features)
- [Screenshots](#screenshots)
- [Project Structure](#project-structure)
- [Folder-by-Folder Breakdown](#folder-by-folder-breakdown)
- [Core Functionalities](#core-functionalities)
- [Tech Stack](#tech-stack)
- [Firebase Integration](#firebase-integration)
- [Security](#security)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Roadmap](#roadmap)
- [License](#license)

---

## Introduction

Lifelog is designed for anyone who wants to:

- Build a daily journaling habit with minimal effort
- Track their moods and emotional patterns over time
- Visualize their most meaningful words and memories
- Keep their data private, secure, and always accessible

**Use Cases:**

- Personal reflection and self-improvement
- Mental health and mood tracking
- Memory keeping and gratitude journaling
- Data-driven insights into your emotional journey

---

## Architecture

```mermaid
flowchart TD
    A[User Interface (Next.js/React)] -->|Auth, Journal, Mood| B(Firebase Auth & Firestore)
    B --> C[Zustand State Management]
    B --> D[Firestore Database]
    A --> E[Tailwind CSS Styling]
    A --> F[Data Visualization (Recharts, D3-cloud)]
    B --> G[Firebase Admin SDK (API routes)]
    G --> D
    subgraph Hosting
      H[Vercel]
    end
    A --> H
```

---

## Features

- **Sentence-a-Day Journaling:**
  - Add a single, meaningful sentence each day
  - Entries are timestamped and associated with your account
  - Easy, low-friction journaling for busy lives
- **Mood Tracking & Graphs:**
  - Select your mood for each entry (e.g., Happy, Sad, Neutral, etc.)
  - Visualize mood trends over time with interactive graphs
  - Filter mood history by time period and mood type
- **Word Cloud Memory Maps:**
  - See your most-used and meaningful words as a word cloud
  - Gain insights into recurring themes in your journal
- **Private & Secure:**
  - All data is encrypted and only accessible to you
  - Strict Firestore security rules
- **Downloadable Data:**
  - Export your entire journal as a JSON backup
  - Import data from a backup file
- **Theme Support:**
  - Light and dark mode for comfortable journaling at any time
  - Theme preference saved per user
- **Data Import/Export:**
  - Backup and restore your data with ease
  - Local storage backup for extra safety

---

## Screenshots

> _Add your own screenshots here!_

| Dashboard                               | Mood Graph                                | Word Cloud                                |
| --------------------------------------- | ----------------------------------------- | ----------------------------------------- |
| ![Dashboard](screenshots/dashboard.png) | ![Mood Graph](screenshots/mood-graph.png) | ![Word Cloud](screenshots/word-cloud.png) |

---

## Project Structure

```
.
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Global layout and metadata
│   │   ├── globals.css          # Global styles
│   │   ├── page.tsx             # Home/landing page
│   │   ├── api/                 # Next.js API routes
│   │   ├── dashboard/           # User dashboard (main journaling UI)
│   │   ├── auth/                # Authentication pages
│   │   └── settings/            # User settings (export, import, preferences)
│   ├── components/
│   │   ├── theme-provider.tsx   # Theme context provider
│   │   ├── WordCloud.tsx        # Word cloud visualization
│   │   ├── MoodGraph.tsx        # Mood graph visualization
│   │   ├── ui/                  # Reusable UI components (Card, Button, Toast, etc.)
│   │   ├── settings/            # Settings-related components
│   │   ├── auth/                # Auth UI components
│   │   ├── shared/              # Shared UI components
│   │   ├── mood/                # Mood-related components
│   │   ├── journal/             # Journal-related components
│   │   └── dashboard/           # Dashboard widgets
│   ├── lib/
│   │   ├── firebase/            # Firebase client and admin setup
│   │   ├── hooks/               # Custom React hooks
│   │   ├── utils/               # Utility functions (data management, etc.)
│   ├── store/
│   │   ├── authStore.ts         # Zustand store for authentication
│   │   └── journalStore.ts      # Zustand store for journal entries
│   ├── types/                   # TypeScript type definitions
│   ├── context/                 # React context providers
│   └── styles/                  # Additional styles
├── public/                      # Static assets (icons, manifest, etc.)
├── functions/                   # Firebase Cloud Functions (backend logic)
├── firestore.rules              # Firestore security rules
├── package.json                 # Project dependencies and scripts
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── vercel.json                  # Vercel deployment configuration
└── README.md                    # (You are here!)
```

---

## Folder-by-Folder Breakdown

- **src/app/**: Next.js app directory, including routing, pages, and API endpoints
- **src/components/**: All React components, organized by feature and UI type
- **src/lib/firebase/**: Firebase client and admin SDK setup
- **src/lib/hooks/**: Custom React hooks for state and logic reuse
- **src/lib/utils/**: Utility functions for data management, formatting, etc.
- **src/store/**: Zustand state management stores for authentication and journaling
- **src/types/**: TypeScript type definitions for strong typing
- **src/context/**: React context providers for global state
- **src/styles/**: Additional global and component styles
- **public/**: Static assets, icons, manifest, etc.
- **functions/**: Firebase Cloud Functions (backend logic)

---

## Core Functionalities

### 1. **Authentication**

- Email/password sign-up and login via Firebase Auth
- Secure user session management
- Password reset and error handling

### 2. **Journaling**

- Add a daily journal entry (one sentence per day)
- Entries are timestamped and associated with the user
- Entries stored securely in Firestore

### 3. **Mood Tracking**

- Select a mood for each day (e.g., Happy, Sad, Neutral, etc.)
- Mood data visualized in graphs and statistics
- Mood history filterable by time and mood type

### 4. **Word Cloud Visualization**

- Journal content is analyzed to generate a word cloud
- Highlights most-used and meaningful words

### 5. **Dashboard**

- Personalized dashboard with greeting, stats, and quick actions
- Recent entries and mood trends displayed
- Data filtering by time period and mood

### 6. **Settings**

- Export all user data as a JSON backup
- Import data from a backup file
- Clear local storage backup
- Manage theme preferences

### 7. **Security & Privacy**

- All data is private to the user
- Firestore security rules enforce user-based access
- No public data exposure

---

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS, custom themes, dark/light mode
- **State Management:** Zustand
- **Backend:** Firebase (Auth, Firestore, Cloud Functions)
- **Data Visualization:** Recharts, D3-cloud
- **UI Components:** Radix UI, custom components
- **Deployment:** Vercel

---

## Firebase Integration

- **Client SDK:** Used for authentication and Firestore in the browser
- **Admin SDK:** Used in API routes and server-side logic for secure operations
- **Cloud Functions:** (Optional) for backend automation
- **Security Rules:** Strict Firestore rules to ensure data privacy and integrity

---

## Security

- **Firestore Rules:** Only authenticated users can read/write their own data
- **Environment Variables:** Sensitive keys are never exposed to the client
- **Data Encryption:** All data in transit and at rest is encrypted by Firebase
- **Session Management:** Secure session handling via Firebase Auth

---

## Setup & Installation

### 1. **Clone the Repository**

```bash
git clone https://github.com/yourusername/lifelog.git
cd lifelog
```

### 2. **Install Dependencies**

```bash
npm install
```

### 3. **Configure Environment Variables**

Create a `.env.local` file in the root with the following (replace with your Firebase project values):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_service_account_private_key
```

### 4. **Run the Development Server**

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the app.

### 5. **(Optional) Deploy to Vercel**

- Connect your repo to Vercel and set environment variables in the dashboard.

---

## Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the app for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run predev` - Generate service worker config before dev

---

## Environment Variables

See the [Setup & Installation](#setup--installation) section for required variables.

---

## Contributing

We welcome contributions! To get started:

1. Fork this repository
2. Create a new branch for your feature or bugfix
3. Make your changes and commit them with clear messages
4. Push your branch to your fork
5. Open a pull request describing your changes

**Development tips:**

- Keep pull requests focused and small
- Write clear commit messages
- Add tests or documentation if relevant

---

## Troubleshooting

- **App won't start?**
  - Double-check your environment variables
  - Run `npm install` to ensure all dependencies are installed
- **Firebase errors?**
  - Make sure your Firebase project credentials are correct
  - Check Firestore rules for access issues
- **Build errors?**
  - Run `npm run lint` to check for code issues
  - Ensure your Node.js version matches the project requirements

---

## FAQ

**Q: Is my data private?**
A: Yes! All your data is private, encrypted, and only accessible to you.

**Q: Can I export my data?**
A: Yes, you can export your entire journal as a JSON backup from the settings page.

**Q: Can I use this app on mobile?**
A: Yes, Lifelog is fully responsive and works on all modern devices.

**Q: How do I reset my password?**
A: Use the "Forgot Password" link on the login page to reset your password via email.

---

## Roadmap

- [ ] Add multi-language support
- [ ] Add reminders/notifications (if needed in the future)
- [ ] Add more data visualization options
- [ ] Add social sharing/export to PDF
- [ ] Improve accessibility and keyboard navigation
- [ ] Add more journaling prompts and templates

---

**Lifelog** — _One sentence a day. A lifetime of emotions._

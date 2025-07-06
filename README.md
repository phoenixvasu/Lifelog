# Lifelog

**Lifelog** is a modern, privacy-focused journaling and mood-tracking web application. It enables users to capture daily reflections in a single sentence, track their emotional patterns, visualize memories, and receive gentle reminders—all while keeping their data secure and under their control.

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Core Functionalities](#core-functionalities)
- [Tech Stack](#tech-stack)
- [Firebase Integration](#firebase-integration)
- [Security](#security)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Sentence-a-Day Journaling:** Capture your thoughts in just one meaningful sentence each day.
- **Mood Tracking & Graphs:** Visualize your emotional patterns and growth over time.
- **Word Cloud Memory Maps:** See your most meaningful words transform into beautiful clouds.
- **Private & Secure:** All data is encrypted and only accessible to you.
- **Downloadable Data:** Export your entire journal as JSON—your data, your control.

- **Theme Support:** Light and dark mode for comfortable journaling at any time.
- **Data Import/Export:** Backup and restore your data with ease.

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

## Core Functionalities

### 1. **Authentication**

- Email/password sign-up and login via Firebase Auth.
- Secure user session management.
- Password reset and error handling.

### 2. **Journaling**

- Add a daily journal entry (one sentence per day).
- Entries are timestamped and associated with the user.
- Entries stored securely in Firestore.

### 3. **Mood Tracking**

- Select a mood for each day (e.g., Happy, Sad, Neutral, etc.).
- Mood data visualized in graphs and statistics.
- Mood history filterable by time and mood type.

### 4. **Word Cloud Visualization**

- Journal content is analyzed to generate a word cloud.
- Highlights most-used and meaningful words.

### 5. **Dashboard**

- Personalized dashboard with greeting, stats, and quick actions.
- Recent entries and mood trends displayed.
- Data filtering by time period and mood.

### 6. **Settings**

- Export all user data as a JSON backup.
- Import data from a backup file.
- Clear local storage backup.
- Manage theme preferences.

### 7. **Security & Privacy**

- All data is private to the user.
- Firestore security rules enforce user-based access.
- No public data exposure.

---

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS, custom themes, dark/light mode
- **State Management:** Zustand
- **Backend:** Firebase (Auth, Firestore, Cloud Functions, FCM)
- **Data Visualization:** Recharts, D3-cloud
- **UI Components:** Radix UI, custom components

- **Deployment:** Vercel

---

## Firebase Integration

- **Client SDK:** Used for authentication, Firestore, and messaging in the browser.
- **Admin SDK:** Used in API routes and server-side logic for secure operations.
- **Cloud Functions:** (Optional) for backend automation.
- **Security Rules:** Strict Firestore rules to ensure data privacy and integrity.

---

## Security

- **Firestore Rules:** Only authenticated users can read/write their own data.
- **Environment Variables:** Sensitive keys are never exposed to the client.
- **Data Encryption:** All data in transit and at rest is encrypted by Firebase.
- **Session Management:** Secure session handling via Firebase Auth.

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

Contributions are welcome! Please open issues and pull requests for new features, bug fixes, or improvements.

---

## License

This project is licensed under the MIT License.

---

**Lifelog** — _One sentence a day. A lifetime of emotions._

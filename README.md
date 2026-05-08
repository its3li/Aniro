<div align="center">

<img src="./assets/icon.png" width="120" height="120" alt="Aniro Logo">

# 🌙 Aniro V6

**Your Digital Companion for Islamic Worship**  
*رفيقك الرقمي للعبادات اليومية*

[![Next.js](https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[📱 Download APK](#-download) • [🚀 Features](#-features) • [🛠️ Tech Stack](#%EF%B8%8F-tech-stack) • [📸 Screenshots](#-screenshots) • [🤝 Contribute](#-contribute)

</div>

---

## 📱 Download

| Platform | Status | Link |
|----------|--------|------|
| Android | ✅ Available | [Download APK](https://github.com/its3li/Aniro-V3/releases) |
| iOS | 🚧 Coming Soon | — |
| Web | 🚧 Coming Soon | — |

---

## 🚀 Features

### 🏠 Smart Home Dashboard
<p align="center">
  <img src="./assets/night-mode.png" width="300" alt="Home Screen">
</p>

- **Hijri Date Display** — Beautiful Arabic typography showing today's Islamic date
- **Next Prayer Card** — Live countdown to the next prayer with animated timer
- **Daily Prayer Strip** — Quick view of all today's prayer times
- **Daily Wisdom** — Rotating hadith and Islamic quotes to start your day

### 🕌 Accurate Prayer Times & Qibla
- **GPS-Based Location** — Auto-detects your city/country for precise calculations
- **Multiple Calculation Methods** — Choose from: Muslim World League, Egyptian General Authority, and more
- **Background Notifications** — Adhan plays even when app is closed
- **Manual Time Adjustment** — Fine-tune by minutes if needed
- **🧭 Qibla Compass** — Accurate direction to the Kaaba with smooth animation

### 📖 Complete Quran Experience
- **Full Mushaf** — Complete Quran with all 114 surahs
- **Two Reading Modes**:
  - **List Mode** — Verses in continuous scroll
  - **Page Mode** — Like the physical Mushaf
- **Tajweed Color-Coding** — Visual rules for proper recitation
- **Tafsir Integration** — Long-press any verse for instant explanation
- **Audio Recitation** — Famous reciters: Al-Husary, Al-Minshawi, Al-Afasy, and more

### 📿 Azkar & Digital Tasbih
- **Organized Collections** — Morning, Evening, Sleep, Prayer azkar
- **Digital Tasbih** — Electronic counter with haptic feedback
- **Progress Tracking** — See your daily azkar completion

### ⚙️ Personalization
- **Dark/Light Mode** — Aurora gradient backgrounds with glassmorphism design
- **Font Scaling** — Adjustable text size for accessibility
- **Bilingual Support** — Full Arabic & English interface
- **Offline-First** — Core features work without internet

---

## 🛠️ Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        Aniro V3 Architecture                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Next.js   │  │   React     │  │    TypeScript       │  │
│  │     15      │  │     19      │  │       5.x           │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         └─────────────────┴────────────────────┘             │
│                           │                                  │
│  ┌────────────────────────┼────────────────────────┐        │
│  │                    UI Layer                       │        │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐   │        │
│  │  │  Radix UI  │ │ Tailwind   │ │ shadcn/ui  │   │        │
│  │  │ Components │ │   CSS 3.4  │ │ Components │   │        │
│  │  └────────────┘ └────────────┘ └────────────┘   │        │
│  └────────────────────────┬────────────────────────┘        │
│                           │                                  │
│  ┌────────────────────────┼────────────────────────┐        │
│  │                 Native Layer                    │        │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐   │        │
│  │  │ Capacitor  │ │Geolocation │ │Local Notif.│   │        │
│  │  │    8.x     │ │   Plugin   │ │   Plugin   │   │        │
│  │  └────────────┘ └────────────┘ └────────────┘   │        │
│  └────────────────────────┬────────────────────────┘        │
│                           │                                  │
│  ┌────────────────────────┼────────────────────────┐        │
│  │                    Data Layer                  │        │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐   │        │
│  │  │  Adhan.js  │ │   IDB      │ │  Minisearch│   │        │
│  │  │Prayer Calc │ │  (IndexedDB)│ │  Search    │   │        │
│  │  └────────────┘ └────────────┘ └────────────┘   │        │
│  └──────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Core Technologies
| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | Next.js 15 + React 19 | App architecture |
| **Language** | TypeScript 5 | Type safety |
| **Styling** | Tailwind CSS 3.4 + shadcn/ui | Modern UI |
| **Mobile** | Capacitor 8 | Native Android app |
| **Icons** | Lucide React | Consistent iconography |
| **State** | React Hook Form + Zod | Form management |
| **Search** | Minisearch | Offline search in Quran |

### Native Capabilities (Capacitor Plugins)
- `@capacitor/geolocation` — GPS for prayer time calculations
- `@capacitor/local-notifications` — Adhan reminders
- `@capacitor/preferences` — Local settings storage

### Storage
- **IndexedDB (IDB-Keyval)** — Offline-first data storage
- **Capacitor Preferences** — Settings & cache

---

## 📸 Screenshots

<div align="center">

| Home Screen | Prayer Times | Quran Reader |
|-------------|--------------|--------------|
| <img src="./assets/night-mode.png" width="250"> | <img src="./assets/praying.png" width="250"> | <img src="./assets/quran.png" width="250"> |
| *Hijri date, next prayer, daily wisdom* | *Accurate timings, multiple methods* | *Tajweed colors, tafsir, audio* |

</div>

---

## 🏗️ Project Structure

```
Aniro-V3/
├── 📁 android/                 # Native Android project (Capacitor)
├── 📁 assets/                   # App icons & images
├── 📁 src/
│   ├── 📁 app/                  # Next.js app router
│   │   ├── 📁 api/              # API routes
│   │   ├── 📁 quran/            # Quran feature pages
│   │   ├── 📁 prayer/           # Prayer times pages
│   │   └── 📁 azkar/            # Azkar pages
│   ├── 📁 components/
│   │   ├── 📁 ui/               # shadcn/ui components
│   │   └── 📁 quran/            # Custom Quran components
│   ├── 📁 hooks/                # Custom React hooks
│   ├── 📁 lib/                  # Utilities & helpers
│   └── 📁 types/                # TypeScript definitions
├── 📁 public/                   # Static assets
├── 📄 capacitor.config.ts         # Capacitor configuration
├── 📄 next.config.ts            # Next.js configuration
└── 📄 tailwind.config.ts         # Tailwind customization
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js 20+
- Android Studio (for Android builds)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/its3li/Aniro-V3.git
cd Aniro-V3

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Sync with Android
npx cap sync android

# Open Android Studio
npx cap open android
```

---

## 🤝 Contribute

We welcome contributions! Here's how:

```bash
# Fork & clone
git clone https://github.com/YOUR_USERNAME/Aniro-V3.git

# Create branch
git checkout -b feature/amazing-feature

# Make changes & commit
git commit -m "feat: add amazing feature"

# Push & PR
git push origin feature/amazing-feature
```

### Contribution Areas
- 🐛 Bug fixes
- ✨ New features
- 🌍 Translations (i18n)
- 📱 iOS support
- 🎨 UI/UX improvements
- 📚 Documentation

---

## 📊 Stats

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/its3li/Aniro-V3?style=social)
![GitHub forks](https://img.shields.io/github/forks/its3li/Aniro-V3?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/its3li/Aniro-V3?style=social)

</div>

---

## 🙏 Acknowledgments

- **Adhan Library** — Accurate prayer time calculations
- **Quran.com API** — Quranic data and translations
- **Capacitor Team** — Making web apps native
- **shadcn/ui** — Beautiful accessible components

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ by [Ali](https://github.com/its3li)**

*"And whoever does an atom's weight of good will see it"* — Quran 99:7

[⬆ Back to Top](#-aniro-v3)

</div>

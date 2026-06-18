# Contributing to Aniro

First off, thank you for considering contributing to Aniro! It's people like you that make this project a great tool for the Muslim community.

## 🎯 Areas We Need Help With

### High Priority
- 🐛 **Bug fixes** — Especially on Android native features
- 📱 **iOS Support** — Capacitor iOS build and testing
- 🌍 **Internationalization** — Adding more languages
- ♿ **Accessibility** — Improving screen reader support

### Medium Priority
- ✨ **New Features** — Azkar reminders, Qibla compass, Islamic calendar
- 🎨 **UI/UX** — Design improvements, animations, themes
- 📚 **Documentation** — Better guides, API docs, tutorials

## 🚀 Quick Start

```bash
# 1. Fork the repo
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/Aniro.git
cd Aniro

# 3. Install dependencies
npm install

# 4. Create a branch
git checkout -b feature/your-feature-name

# 5. Make your changes
# 6. Test locally
npm run dev

# 7. Commit with clear message
git commit -m "feat: add new feature description"

# 8. Push and open PR
git push origin feature/your-feature-name
```

## 📋 Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `style:` — Formatting (no code change)
- `refactor:` — Code restructuring
- `perf:` — Performance improvement
- `test:` — Adding tests
- `chore:` — Build/tooling changes

**Examples:**
```
feat(quran): add audio player controls
fix(prayer): correct timezone calculation for Egypt
docs(readme): add iOS build instructions
```

## 🧪 Testing

- Test your changes on **both** web and Android
- Ensure TypeScript compiles: `npm run typecheck`
- Check linting: `npm run lint`

## 📱 Android Testing

If your changes affect native features:

```bash
# Sync Capacitor
npx cap sync android

# Open Android Studio
npx cap open android

# Build APK and test on device/emulator
```

## 🎨 Design Guidelines

- Use **Tailwind CSS** for styling
- Follow **shadcn/ui** component patterns
- Maintain **dark mode** compatibility
- Use **Lucide icons** consistently
- Ensure **RTL (Arabic)** support

## 🌍 Code Style

- **TypeScript** — Strict mode enabled
- **Functional components** — React hooks
- **Named exports** — Prefer over default exports
- **Comments** — In English for international contributors

## 🤝 Community

- Be respectful and constructive
- Ask questions in issues before big changes
- Help review others' PRs

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for helping make Aniro better!** 🌙

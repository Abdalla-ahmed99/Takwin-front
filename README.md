# Takwin-front

An Expo React Native application with React Navigation, Redux Toolkit, and localization. The app includes onboarding, authentication, profile, class management, exams, payments, and settings screens.

## Features
- React Navigation stack with deep link prefixes (myapp://)
- Global state via Redux Toolkit and AsyncStorage for auth token
- Multi-language support (i18n)
- API helper with configurable base URL
- Web support via react-native-web

## Prerequisites
- Node.js 18+ and npm
- Expo CLI (optional): `npm i -g expo-cli`
- Android Studio (for emulator) or Expo Go app (for physical device)

## Setup
- Install dependencies:
  - `npm install`
- Start the development server:
  - `npx expo start`
  - Press `a` for Android emulator, `w` for Web, or scan the QR code with Expo Go.
- Clear Metro cache if needed:
  - `npx expo start -c`

## Scripts
- Build (web/static export):
  - `npm run build` (runs `expo export`)
  - For native builds, consider `npx expo prebuild` and EAS Build or Android Studio.

## Project Structure
- Entry: [index.js](file:///d:/Abdalla/New%20folder/New%20folder/Takwin-front/index.js)
- App: [App.js](file:///d:/Abdalla/New%20folder/New%20folder/Takwin-front/App.js)
- Screens: [src/screens](file:///d:/Abdalla/New%20folder/New%20folder/Takwin-front/src/screens)
- Store: [src/store](file:///d:/Abdalla/New%20folder/New%20folder/Takwin-front/src/store)
- Hooks: [src/hooks](file:///d:/Abdalla/New%20folder/New%20folder/Takwin-front/src/hooks)
- Utils: [src/utils](file:///d:/Abdalla/New%20folder/New%20folder/Takwin-front/src/utils)
- Assets: [assets](file:///d:/Abdalla/New%20folder/New%20folder/Takwin-front/assets)

## Configuration
- API Base URL:
  - Edit [api.js](file:///d:/Abdalla/New%20folder/New%20folder/Takwin-front/src/utils/api.js#L5-L14) and update `getApiBaseUrl()` to your backend URL.
  - Current default: `https://lastversion-nine.vercel.app`
- Auth Token:
  - Stored in AsyncStorage under key `token` and added to `Authorization` header when present. See [apiCall](file:///d:/Abdalla/New%20folder/New%20folder/Takwin-front/src/utils/api.js#L16-L48).

## Navigation
- Stack navigator configured in [App.js](file:///d:/Abdalla/New%20folder/New%20folder/Takwin-front/App.js#L26-L63) with screens:
  - Onboarding, Login, Register, Home, AddClass, ClassDetails, Exam, Profile, Settings, Payment, Language
- Deep linking prefix: `myapp://`

## State Management
- Redux Toolkit store: [store.js](file:///d:/Abdalla/New%20folder/New%20folder/Takwin-front/src/store/store.js)
- Slices: [languageSlice.js](file:///d:/Abdalla/New%20folder/New%20folder/Takwin-front/src/store/languageSlice.js), [userSlice.js](file:///d:/Abdalla/New%20folder/New%20folder/Takwin-front/src/store/userSlice.js)

## Localization
- Translations: [translations.js](file:///d:/Abdalla/New%20folder/New%20folder/Takwin-front/src/i18n/translations.js)
- Initialization hooks: [useLanguageInit.js](file:///d:/Abdalla/New%20folder/New%20folder/Takwin-front/src/hooks/useLanguageInit.js), [useLanguage.js](file:///d:/Abdalla/New%20folder/New%20folder/Takwin-front/src/hooks/useLanguage.js)

## Web
- Run web dev server:
  - `npx expo start --web`
- The project uses `react-native-web`. Some native-only modules may not work on web.

## Troubleshooting
- Emulator not connecting:
  - Ensure Android SDK and platform-tools are installed and emulator is running.
- Port conflicts / stale cache:
  - Use `npx expo start -c` to reset Metro cache and reload.

## License
- Unspecified. Add your preferred license text here.


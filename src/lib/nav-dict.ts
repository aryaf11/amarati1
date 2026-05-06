import type { AppLocale } from "./locale";

const nav = {
  ar: {
    brand: "عَمارتي",
    chatbot: "مساعد ذكي",
    login: "تسجيل الدخول",
    register: "تسجيل",
    logout: "خروج",
    profile: "الملف الشخصي",
    theme: "المظهر",
    themeLight: "فاتح",
    themeDark: "داكن",
    themeSystem: "النظام",
    language: "اللغة",
    notifications: "إشعارات المتصفح",
    backHome: "الرئيسية",
  },
  en: {
    brand: "Amarati",
    chatbot: "AI assistant",
    login: "Log in",
    register: "Sign up",
    logout: "Log out",
    profile: "Profile",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    language: "Language",
    notifications: "Browser notifications",
    backHome: "Home",
  },
} as const;

export function navT(locale: AppLocale) {
  return nav[locale];
}

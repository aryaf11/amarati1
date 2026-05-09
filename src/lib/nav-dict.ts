import type { AppLocale } from "./locale";

const nav = {
  ar: {
    brand: "عَمارتي",
    chatbot: "المساعد",
    login: "تسجيل الدخول",
    register: "تسجيل",
    logout: "خروج",
    profile: "حساب",
    theme: "المظهر",
    themeLight: "فاتح",
    themeDark: "داكن",
    themeSystem: "النظام",
    language: "اللغة",
    notifications: "الإشعارات",
    backHome: "الرئيسية",
    home: "الرئيسية",
    maintenance: "الصيانة",
    payments: "المدفوعات",
    votes: "التصويتات",
    bottomNav: "شريط التنقل السفلي",
  },
  en: {
    brand: "Amarati",
    chatbot: "Assistant",
    login: "Log in",
    register: "Sign up",
    logout: "Log out",
    profile: "Profile",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    language: "Language",
    notifications: "Alerts",
    backHome: "Home",
    home: "Home",
    maintenance: "Maintenance",
    payments: "Payments",
    votes: "Votes",
    bottomNav: "Bottom navigation",
  },
} as const;

export function navT(locale: AppLocale) {
  return nav[locale];
}

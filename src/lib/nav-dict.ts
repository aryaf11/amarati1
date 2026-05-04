import type { AppLocale } from "./locale";



const nav = {

  ar: {

    brand: "عَمارتي",

    chatbot: "مساعد ذكي",

    login: "دخول",

    register: "تسجيل",

    logout: "خروج",

    theme: "المظهر",

    themeLight: "فاتح",

    themeDark: "داكن",

    themeSystem: "النظام",

    language: "اللغة",

    notifications: "إشعارات المتصفح",

  },

  en: {

    brand: "Amarati",

    chatbot: "AI assistant",

    login: "Log in",

    register: "Sign up",

    logout: "Log out",

    theme: "Theme",

    themeLight: "Light",

    themeDark: "Dark",

    themeSystem: "System",

    language: "Language",

    notifications: "Browser notifications",

  },

} as const;



export function navT(locale: AppLocale) {

  return nav[locale];

}


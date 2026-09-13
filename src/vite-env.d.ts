/// <reference types="vite/client" />

// public/ga.js 載入成功後才會掛上 gtag；被擋掉或本機開發時是 undefined，
// 所以呼叫端一律用 optional call。
declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params?: Record<string, unknown>) => void
  }
}

export {}

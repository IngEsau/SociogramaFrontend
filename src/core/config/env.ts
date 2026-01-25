/**
 * Configuración de variables de entorno
 */

export const env = {
  // Backend API URL (Railway)
  API_URL: import.meta.env.VITE_API_URL || 'https://sociogramabackend-production.up.railway.app/api',

  // WebSocket URL para tiempo real
  WS_URL: import.meta.env.VITE_WS_URL || 'wss://sociogramabackend-production.up.railway.app',

  // reCAPTCHA Google
  RECAPTCHA_SITE_KEY: import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6Lc4Kv0qAAAAABXjYcI59V4hgRCGeos-m9q-dwq1',

  // Ambiente actual
  NODE_ENV: import.meta.env.MODE,

  // Modo desarrollo
  isDev: import.meta.env.DEV,

  // Modo producción
  isProd: import.meta.env.PROD,
} as const;

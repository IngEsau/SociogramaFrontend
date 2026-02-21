/**
 * Configuración de variables de entorno
 * IMPORTANTE: Asegúrate de configurar el archivo .env antes de ejecutar
 */

// Validar variables requeridas
const requiredEnvVars = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_RECAPTCHA_SITE_KEY: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
} as const;

// Verificar en desarrollo que las variables estén configuradas
if (import.meta.env.DEV) {
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error(
      'Variables de entorno faltantes:\n' +
      missingVars.map(v => `   - ${v}`).join('\n') +
      '\n\n💡 Copia .env.example a .env y configura las variables.'
    );
  }
}

export const env = {
  // Backend API URL
  API_URL: import.meta.env.VITE_API_URL || '',

  // WebSocket URL
  WS_URL: import.meta.env.VITE_WS_URL || '',

  // reCAPTCHA Site Key
  RECAPTCHA_SITE_KEY: import.meta.env.VITE_RECAPTCHA_SITE_KEY || '',

  // Ambiente actual
  NODE_ENV: import.meta.env.MODE,

  // Modo desarrollo
  isDev: import.meta.env.DEV,

  // Modo producción
  isProd: import.meta.env.PROD,
} as const;

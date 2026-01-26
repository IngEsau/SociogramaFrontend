/**
 * Hook personalizado para manejar reCAPTCHA con fallback
 * Si el reCAPTCHA falla permite saltar la autenticación
 */

import { useState, useEffect } from 'react';

// Declaración global para recaptcha
declare global {
  interface Window {
    grecaptcha: {
      render: (container: string | HTMLElement, params: { sitekey: string; theme?: string }) => number;
      getResponse: (widgetId?: number) => string;
      reset: (widgetId?: number) => void;
    };
  }
}

interface UseRecaptchaOptions {
  onRecaptchaError?: (error: string) => void;
}

export const useRecaptcha = (options?: UseRecaptchaOptions) => {
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [recaptchaFailed, setRecaptchaFailed] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);
  const [allowSkip, setAllowSkip] = useState(false);

  useEffect(() => {
    const renderRecaptcha = () => {
      if (window.grecaptcha && typeof window.grecaptcha.render === 'function' && !recaptchaLoaded && !recaptchaFailed) {
        try {
          const containers = document.querySelectorAll('.g-recaptcha');
          containers.forEach((container) => {
            if (container.children.length === 0) {
              window.grecaptcha.render(container as HTMLElement, {
                sitekey: import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6Lc4Kv0qAAAAABXjYcI59V4hgRCGeos-m9q-dwq1',
                theme: 'light',
              });
            }
          });
          setRecaptchaLoaded(true);
          console.log('✓ reCAPTCHA cargado exitosamente');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          console.error('Error renderizando reCAPTCHA:', errorMessage);
          setRecaptchaFailed(true);
          setRecaptchaError('El reCAPTCHA no está disponible. Puedes continuar sin validación.');
          setAllowSkip(true);
          options?.onRecaptchaError?.(errorMessage);
        }
      }
    };

    if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
      renderRecaptcha();
    }

    const interval = setInterval(() => {
      if (window.grecaptcha && typeof window.grecaptcha.render === 'function' && !recaptchaLoaded && !recaptchaFailed) {
        renderRecaptcha();
      }
    }, 100);

    // Solo marcar como fallido después de 15 segundos de que no se cargue
    const timeout = setTimeout(() => {
      if (!recaptchaLoaded && !recaptchaFailed) {
        console.warn('reCAPTCHA no se cargó después de 15 segundos - permitiendo continuar sin validación');
        setRecaptchaFailed(true);
        setRecaptchaError('El reCAPTCHA no se pudo cargar. Puedes continuar sin validación.');
        setAllowSkip(true);
      }
    }, 15000); // 15 segundos

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [recaptchaLoaded, recaptchaFailed, options]);

  /**
   * Obtiene la respuesta de reCAPTCHA
   * Solo si ha sido cargado exitosamente
   */
  const getRecaptchaResponse = (): string => {
    // Si falló realmente y se permite saltar
    if (allowSkip && recaptchaFailed) {
      console.log('✓ Saltando validación de reCAPTCHA (falló)');
      return 'recaptcha-skipped-' + Date.now();
    }

    // Si se cargó correctamente, obtener respuesta real
    if (recaptchaLoaded && !recaptchaFailed) {
      return window.grecaptcha?.getResponse() || '';
    }

    // En cualquier otro caso, retornar vacío
    return '';
  };

  /**
   * Verifica si se puede proceder sin reCAPTCHA válido
   * Solo si realmente falló y se permite omitir
   */
  const canProceedWithoutRecaptcha = (): boolean => {
    return recaptchaFailed && allowSkip;
  };

  /**
   * Permite saltar manualmente el reCAPTCHA
   * Solo cuando ha fallado realmente
   */
  const skipRecaptcha = () => {
    if (recaptchaFailed) {
      setAllowSkip(true);
      setRecaptchaError('Validación de reCAPTCHA omitida.');
    }
  };

  /**
   * Resetea el reCAPTCHA
   */
  const resetRecaptcha = () => {
    try {
      window.grecaptcha?.reset();
    } catch (error) {
      console.log('No se pudo resetear reCAPTCHA:', error);
    }
  };

  return {
    recaptchaLoaded,
    recaptchaFailed,
    recaptchaError,
    allowSkip,
    getRecaptchaResponse,
    canProceedWithoutRecaptcha,
    skipRecaptcha,
    resetRecaptcha,
  };
};

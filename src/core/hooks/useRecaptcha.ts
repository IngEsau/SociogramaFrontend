/**
 * Hook personalizado para manejar reCAPTCHA con fallback
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Declaración global para recaptcha
declare global {
  interface Window {
    grecaptcha: {
      render: (container: string | HTMLElement, params: { sitekey: string; theme?: string }) => number;
      getResponse: (widgetId?: number) => string;
      reset: (widgetId?: number) => void;
    };
    recaptchaWidgetId?: number;
    recaptchaRendered?: boolean;
  }
}

interface UseRecaptchaOptions {
  onRecaptchaError?: (error: string) => void;
}

export const useRecaptcha = (options?: UseRecaptchaOptions) => {
  // Estado local para cada instancia del hook (no depender de flags globales)
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [recaptchaFailed, setRecaptchaFailed] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);
  const [allowSkip, setAllowSkip] = useState(false);
  const renderAttempted = useRef(false);
  const widgetIdRef = useRef<number | undefined>(undefined);

  const renderRecaptcha = useCallback(() => {
    // Solo renderizar si aún no lo hemos intentado en esta instancia
    if (renderAttempted.current) {
      return;
    }

    if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
      try {
        renderAttempted.current = true;
        
        // Buscar todos los contenedores de reCAPTCHA y elegir el visible
        const containers = document.querySelectorAll('.recaptcha-container');
        let container: Element | null = null;
        
        for (const el of containers) {
          // Verificar si el elemento es visible (offsetParent !== null para elementos visibles)
          if ((el as HTMLElement).offsetParent !== null) {
            container = el;
            break;
          }
        }
        
        // Si no hay contenedor visible, usar el primero disponible
        if (!container && containers.length > 0) {
          container = containers[0];
        }
        
        if (container) {
          // Limpiar cualquier contenido previo del contenedor
          container.innerHTML = '';
          
          const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6Lc4Kv0qAAAAABXjYcI59V4hgRCGeos-m9q-dwq1';
          
          const widgetId = window.grecaptcha.render(container as HTMLElement, {
            sitekey: siteKey,
            theme: 'light',
          });
          widgetIdRef.current = widgetId;
          setRecaptchaLoaded(true);
          console.log('✓ reCAPTCHA cargado');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.warn('⚠️ Error renderizando reCAPTCHA:', errorMessage);
        setRecaptchaFailed(true);
        setRecaptchaError('El reCAPTCHA no está disponible. Puedes continuar sin validación.');
        setAllowSkip(true);
        options?.onRecaptchaError?.(errorMessage);
      }
    }
  }, [options]);

  // Renderizar reCAPTCHA cuando el componente se monta
  useEffect(() => {
    const initRecaptcha = () => {
      renderRecaptcha();
    };
    
    // Usar setTimeout para evitar setState sincrónico dentro del efecto
    const timer = setTimeout(initRecaptcha, 0);
    
    return () => clearTimeout(timer);
  }, [renderRecaptcha]);

  // Timeout para fallback si reCAPTCHA no se carga en 15 segundos
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!recaptchaLoaded && !recaptchaFailed) {
        console.warn('⚠️ reCAPTCHA no se cargó después de 15 segundos - permitiendo continuar sin validación');
        setRecaptchaFailed(true);
        setRecaptchaError('El reCAPTCHA no está disponible. Puedes continuar sin validación.');
        setAllowSkip(true);
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [recaptchaLoaded, recaptchaFailed]);

  // Cleanup al desmontar: resetear TODO para que se renderice nuevamente en la próxima ruta
  useEffect(() => {
    return () => {
      // Resetear estado completo para permitir re-renderizado en la siguiente ruta
      renderAttempted.current = false;
      
      // Limpiar el widget de reCAPTCHA si existe
      if (widgetIdRef.current !== undefined && window.grecaptcha?.reset) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
        } catch {
          // No hacer nada si hay error
        }
      }
      
      // Limpiar contenedores de reCAPTCHA
      const containers = document.querySelectorAll('.recaptcha-container');
      containers.forEach(container => {
        if (container) {
          container.innerHTML = '';
        }
      });
      
      widgetIdRef.current = undefined;
    };
  }, []);

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
    if (recaptchaLoaded && window.grecaptcha) {
      try {
        return window.grecaptcha.getResponse(widgetIdRef.current) || '';
      } catch {
        return '';
      }
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
      if (window.grecaptcha && widgetIdRef.current !== undefined) {
        window.grecaptcha.reset(widgetIdRef.current);
      }
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

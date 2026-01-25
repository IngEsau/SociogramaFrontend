/**
 * Proveedor de reCAPTCHA para la aplicación
 * Con reCAPTCHA v2, el componente se integra directamente en el formulario
 * Este provider se mantiene para compatibilidad pero ya no envuelve con GoogleReCaptchaProvider
 */

interface RecaptchaProviderProps {
  children: React.ReactNode;
}

export const RecaptchaProvider = ({ children }: RecaptchaProviderProps) => {
  // reCAPTCHA v2 se integra directamente en los componentes usando el script de Google
  // y el renderizado manual con grecaptcha.render()
  return <>{children}</>;
};

export default RecaptchaProvider;

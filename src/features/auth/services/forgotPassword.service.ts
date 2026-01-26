/**
 * Servicio de recuperación de contraseña
 * TODO: Conectar con el backend cuando esté disponible
 */

// import { api } from '../../../core/api/axios';

interface ForgotPasswordRequest {
  email: string;
  recaptcha_token: string;
}

interface ForgotPasswordResponse {
  message: string;
  success: boolean;
}

/**
 * Solicita el envío de un enlace de recuperación de contraseña
 * @param data - Email del usuario y token de reCAPTCHA
 * @returns Promesa con el resultado de la operación
 */
export const forgotPasswordService = async (
  data: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> => {
  // TODO: Descomentar cuando el backend esté listo
  // const response = await api.post<ForgotPasswordResponse>('/auth/forgot-password', data);
  // return response.data;

  // Simulación temporal (solo para propósitos de desarrollo)
  console.log('📧 Solicitud de recuperación para:', data.email);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        message: 'Si existe una cuenta con el correo proporcionado, recibirás un enlace de recuperación.',
        success: true,
      });
    }, 1500);
  });
};

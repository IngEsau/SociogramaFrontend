/**
 * Servicio de restablecimiento de contraseña
 * TODO: Conectar con el backend cuando esté disponible
 */

// import { api } from '../../../core/api/axios';

interface ResetPasswordRequest {
  token: string;
  password: string;
}

interface ResetPasswordResponse {
  message: string;
  success: boolean;
}

/**
 * Restablece la contraseña del usuario usando el token de recuperación
 * @param data - Token de recuperación y nueva contraseña
 * @returns Promesa con el resultado de la operación
 */
export const resetPasswordService = async (
  data: ResetPasswordRequest
): Promise<ResetPasswordResponse> => {
  // TODO: Descomentar cuando el backend esté listo
  // const response = await api.post<ResetPasswordResponse>('/auth/reset-password', data);
  // return response.data;

  // Simulación temporal (solo para propósitos de desarrollo)
  console.log('Restableciendo contraseña con token:', data.token);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        message: 'Contraseña restablecida exitosamente.',
        success: true,
      });
    }, 1500);
  });
};

/**
 * Servicio de restablecimiento de contraseña
 */

import { api } from '../../../core/api/axios';

interface ResetPasswordRequest {
  token: string;
  password: string;
}

interface ResetPasswordResponse {
  message: string;
  success: boolean;
}

interface ValidateTokenResponse {
  valid: boolean;
  error?: string;
}

/**
 * Valida si el token de recuperación de contraseña es válido
 * @param token - Token de recuperación
 * @returns Promesa con el resultado de la validación
 */
export const validateResetTokenService = async (
  token: string
): Promise<ValidateTokenResponse> => {
  try {
    const response = await api.post<ValidateTokenResponse>(
      '/auth/password-reset/validate/',
      { token }
    );
    return response.data;
  } catch (error) {
    console.error('Error validando token:', error);
    return {
      valid: false,
      error: 'Token inválido o expirado',
    };
  }
};

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

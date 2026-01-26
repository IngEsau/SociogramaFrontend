/**
 * Evaluador de Seguridad de Contraseña
 * Análisis robusto sin librerías externas
 * Detecta patrones comunes, secuencias y debilidades
 */

export interface PasswordStrengthResult {
  score: number; // 0-100
  label: string; // 'Muy débil' | 'Débil' | 'Aceptable' | 'Buena' | 'Excelente'
  color: string; // color hex para UI
  feedback: string[]; // sugerencias de mejora
}

/**
 * Interfaz para validar requisitos obligatorios de contraseña
 */
export interface PasswordRequirements {
  hasMinLength: boolean; // Mínimo 8 caracteres
  hasUpperCase: boolean; // Al menos una mayúscula
  hasNumber: boolean; // Al menos un número
  allMet: boolean; // Todos los requisitos cumplidos
}

/**
 * Valida que la contraseña cumpla con los requisitos obligatorios
 * @param password - La contraseña a validar
 * @returns Objeto con el estado de cada requisito
 */
export const validatePasswordRequirements = (password: string): PasswordRequirements => {
  return {
    hasMinLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    allMet: password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password),
  };
};

/**
 * Calcula la puntuación de seguridad de una contraseña
 * @param password - La contraseña a evaluar
 * @returns Objeto con score (0-100), etiqueta, color y feedback
 */
export const evaluatePasswordStrength = (password: string): PasswordStrengthResult => {
  if (!password) {
    return {
      score: 0,
      label: 'Muy débil',
      color: '#dc2626',
      feedback: ['Ingresa una contraseña'],
    };
  }

  let score = 0;
  const feedback: string[] = [];

  // ===== PUNTUACIÓN POR LONGITUD =====
  const len = password.length;
  if (len >= 8 && len < 10) score += 20;
  else if (len >= 10 && len < 12) score += 30;
  else if (len >= 12 && len < 16) score += 35;
  else if (len >= 16) score += 40;
  else {
    feedback.push('Mínimo 8 caracteres');
  }

  // ===== VARIEDAD DE CARACTERES =====
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-={}[\];:'",.<>?/\\|`~]/.test(password);

  let varietyCount = 0;
  if (hasLower) {
    score += 15;
    varietyCount++;
  }
  if (hasUpper) {
    score += 15;
    varietyCount++;
  }
  if (hasNumber) {
    score += 15;
    varietyCount++;
  }
  if (hasSpecial) {
    score += 15;
    varietyCount++;
  }

  if (varietyCount < 4) {
    if (!hasUpper) feedback.push('Agrega mayúsculas (A-Z)');
    if (!hasNumber) feedback.push('Agrega números (0-9)');
  }

  // ===== PENALIZACIONES POR PATRONES COMUNES =====
  const lower = password.toLowerCase();

  // Patrones obviamente débiles
  const weakPatterns = [
    'password',
    '12345',
    '123456',
    '1234567',
    '12345678',
    '123456789',
    '1234567890',
    'qwerty',
    'qwertyuio',
    'asdfgh',
    'zxcvbn',
    'qazwsx',
    '000000',
    '111111',
    '222222',
    '333333',
    '444444',
    '555555',
    '666666',
    '777777',
    '888888',
    '999999',
    '123123',
    '654321',
    'abcdef',
    'abc123',
    '1q2w3e',
    '1qaz2wsx',
    'admin',
    'welcome',
    'iloveyou',
    'passw0rd',
    'qwertyuiop',
    'q1w2e3r4',
    'qwerty123',
    '1g2w3e4r',
    'abc12345',
    'pass1234',
    'pass123',
    'passw0rd',
    'letmein123',
    'admin123',
    'welcome1',
    'welcome123',
    'password1',
    'password123',
    '1234abcd',
    'abcd1234',
    '1234abcd',
    'contraseña',
    'contraseña123',
    'hola1234',
    '1234hola',
    'xdxdxdxd'
  ];

  for (const pattern of weakPatterns) {
    if (lower.includes(pattern)) {
      score -= 30;
      feedback.push(`Evita patrones comunes como "${pattern}"`);
      break;
    }
  }

  // ===== PENALIZACIÓN POR SECUENCIAS ALFABÉTICAS/NUMÉRICAS =====
  const detectSequence = (str: string): boolean => {
    let sequenceLength = 1;
    for (let i = 1; i < str.length; i++) {
      const curr = str.charCodeAt(i);
      const prev = str.charCodeAt(i - 1);

      // Secuencia ascendente o descendente
      if (curr - prev === 1 || curr - prev === -1) {
        sequenceLength++;
        if (sequenceLength >= 4) {
          return true;
        }
      } else {
        sequenceLength = 1;
      }
    }
    return false;
  };

  if (detectSequence(password) || detectSequence(lower)) {
    score -= 20;
    feedback.push('Evita secuencias (ej: abc, 1234, xyz)');
  }

  // ===== PENALIZACIÓN POR CARACTERES REPETIDOS =====
  if (/(.)\1{3,}/.test(password)) {
    score -= 20;
    feedback.push('Evita repeticiones de caracteres (aaaa, 1111)');
  }

  // ===== PENALIZACIÓN: SOLO NÚMEROS O SOLO LETRAS =====
  if (/^\d+$/.test(password)) {
    score -= 30;
    feedback.push('Evita contraseñas con solo números');
  } else if (/^[a-zA-Z]+$/.test(password)) {
    score -= 20;
    feedback.push('Mezcla números y caracteres especiales con letras');
  }

  // ===== NORMALIZACIÓN A 0-100 =====
  score = Math.max(0, Math.min(100, Math.round(score)));

  // ===== ASIGNACIÓN DE ETIQUETA Y COLOR =====
  let label = '';
  let color = '';

  if (score >= 85) {
    label = 'Excelente';
    color = '#166534'; // Verde oscuro
  } else if (score >= 70) {
    label = 'Buena';
    color = '#15803d'; // Verde
  } else if (score >= 50) {
    label = 'Aceptable';
    color = '#f59e0b'; // Ámbar
  } else if (score >= 30) {
    label = 'Débil';
    color = '#f97316'; // Naranja
  } else {
    label = 'Muy débil';
    color = '#dc2626'; // Rojo
  }

  return {
    score,
    label,
    color,
    feedback,
  };
};

/**
 * Configuración de rutas de la aplicación
 */

import { createBrowserRouter } from 'react-router-dom';
import { LoginView } from '../features/auth/views/LoginView';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginView />,
  },
]);

/**
 * Sociograma UTP - App Principal
 */
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { RecaptchaProvider } from './app/RecaptchaProvider';
import { router } from './app/router';
import { useAuthStore } from './store';

function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    // Boot: si hay token, intenta cargar /me
    fetchMe();
  }, [fetchMe]);

  return (
    <RecaptchaProvider>
      <RouterProvider router={router} />
    </RecaptchaProvider>
  );
}

export default App;

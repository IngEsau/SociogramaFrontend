/**
 * Sociograma UTP - App Principal
 */

import { RouterProvider } from 'react-router-dom';
import { RecaptchaProvider } from './app/RecaptchaProvider';
import { router } from './app/router';

function App() {
  return (
    <RecaptchaProvider>
      <RouterProvider router={router} />
    </RecaptchaProvider>
  );
}

export default App;

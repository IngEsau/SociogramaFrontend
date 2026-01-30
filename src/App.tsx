/**
 * Sociograma UTP - App Principal
 */

import { RouterProvider } from 'react-router-dom';
import { RecaptchaProvider } from './app/RecaptchaProvider';
import { router } from './app/router';
import { Toast } from './components/ui';
import { useToastStore } from './store';

function App() {
  const { isVisible, message, type, action, duration, hideToast } = useToastStore();

  return (
    <RecaptchaProvider>
      <RouterProvider router={router} />
      <Toast
        isVisible={isVisible}
        message={message}
        type={type}
        action={action}
        duration={duration}
        onClose={hideToast}
      />
    </RecaptchaProvider>
  );
}

export default App;

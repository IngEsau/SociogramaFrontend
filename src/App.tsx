/**
 * Sociograma UTP - App Principal
 */

import LoginView from './features/auth/views/LoginView';
import { RecaptchaProvider } from './app/RecaptchaProvider';

function App() {
  return (
    <RecaptchaProvider>
      <LoginView />
    </RecaptchaProvider>
  );
}

export default App;

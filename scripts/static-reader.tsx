// The static reader uses the same UI, text, and pagination as the Next.js app.
import { createRoot } from 'react-dom/client';
import Home from '../src/app/page';
import ClientLayout from '../src/app/client-layout';
import { AppProvider } from '../src/context/app-context';

createRoot(document.getElementById('reader')!).render(
  <AppProvider><ClientLayout><Home /></ClientLayout></AppProvider>
);

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  const register = () => {
    navigator.serviceWorker.register(new URL('sw.js', document.baseURI), { scope: './' }).catch(() => {});
  };
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}

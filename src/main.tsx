import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import AdminApp from './AdminApp.tsx';
import './index.css';

// Enrutamiento simple: si la URL tiene #admin (ej. tudominio.com/#admin),
// mostramos el panel de administración en vez de la tienda. Usamos el hash
// (no una ruta /admin) porque GitHub Pages sirve archivos estáticos y no
// puede resolver rutas profundas sin configuración extra — el hash siempre
// funciona sin tocar el hosting.
const isAdminRoute = window.location.hash.startsWith('#admin');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdminRoute ? <AdminApp /> : <App />}
  </StrictMode>,
);

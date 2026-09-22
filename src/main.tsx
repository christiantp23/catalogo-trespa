import {StrictMode, Suspense, lazy, useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import TerminosPage from './pages/TerminosPage.tsx';
import PoliticaDatosPage from './pages/PoliticaDatosPage.tsx';
import './index.css';

// Solo el panel admin queda diferido (chunk aparte): es una ruta poco usada,
// así que no tiene sentido que cargue todos sus formularios/validaciones para
// el 99% de las visitas que van a la tienda. La tienda pública (App) vuelve a
// importarse de forma normal/estática: diferirla agregaba un salto de red
// extra antes del primer contenido visible, empeorando FCP y CLS para el
// caso que sí importa.
const AdminApp = lazy(() => import('./AdminApp.tsx'));

// Pantalla simple mientras se descarga el chunk del panel admin — solo se ve
// un instante, y solo la primera vez que se entra a #admin.
function RouteLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-2 border-slate-200 border-t-brand-blue rounded-full animate-spin" />
    </div>
  );
}

// Enrutamiento simple: si la URL tiene #admin (ej. tudominio.com/#admin),
// mostramos el panel de administración en vez de la tienda. Usamos el hash
// (no una ruta /admin) porque GitHub Pages sirve archivos estáticos y no
// puede resolver rutas profundas sin configuración extra — el hash siempre
// funciona sin tocar el hosting. Mismo mecanismo para #terminos y
// #privacidad (Términos y Condiciones / Política de Tratamiento de Datos).
function Root() {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (hash.startsWith('#admin')) {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <AdminApp />
      </Suspense>
    );
  }

  if (hash.startsWith('#terminos')) {
    return <TerminosPage />;
  }

  if (hash.startsWith('#privacidad')) {
    return <PoliticaDatosPage />;
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);

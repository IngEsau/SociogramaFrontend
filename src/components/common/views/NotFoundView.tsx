import { Link } from 'react-router-dom';

/**
 * Vista de página no encontrada (404)
 */
export function NotFoundView() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FEFEFF] p-6">
      <div className="max-w-lg w-full text-center">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-[#0F7E3C]">404</h1>
        </div>
        
        <h2 className="text-2xl font-semibold text-[#313131] mb-4">
          Página no encontrada
        </h2>
        
        <p className="text-gray-500 mb-8">
          La página que buscas no existe o fue movida a otra ubicación.
        </p>
        
        <Link
          to="/"
          className="inline-block bg-[#0F7E3C] text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

export default NotFoundView;

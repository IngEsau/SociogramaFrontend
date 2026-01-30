import { Link } from 'react-router-dom';

export default function NotFoundView() {
  return (
    <div style={{ padding: 24 }}>
      <h1>404</h1>
      <p>Página no encontrada.</p>
      <Link to="/">Ir al inicio</Link>
    </div>
  );
}

import { useAuthStore } from '../../../store';

export default function AlumnoDashboardView() {
  const user = useAuthStore((s) => s.me?.user);

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard ALUMNO</h1>
      <p>Usuario: {user?.first_name} {user?.last_name}</p>
      <p>Aquí irá la pantalla para responder encuestas.</p>
    </div>
  );
}

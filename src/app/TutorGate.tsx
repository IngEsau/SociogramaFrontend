import { useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store';
import { getHomePath, isDocenteTutor, normalizeRole } from '../core/routing/roleRouting';
import { academicService } from '../services/academic.service';
import NoTutorAccessView from '../features/tutor/views/NoTutorAccessView';

type Status = 'checking' | 'allowed' | 'denied';

export function TutorGate() {
  const me = useAuthStore((s) => s.me);
  const role = normalizeRole(me?.user?.rol);

  const [status, setStatus] = useState<Status>('checking');

  const canFastAllow = useMemo(() => {
    return role === 'DOCENTE' && isDocenteTutor(me);
  }, [role, me]);

  useEffect(() => {
    let mounted = true;

    async function checkTutor() {
      if (!me) return;
      if (role !== 'DOCENTE') {
        if (mounted) setStatus('denied');
        return;
      }
      
      if (canFastAllow) {
        if (mounted) setStatus('allowed');
        return;
      }
      
      try {
        const groups = await academicService.getMyGroups();
        if (!mounted) return;
        setStatus(groups?.length ? 'allowed' : 'denied');
      } catch {
        if (!mounted) return;
        setStatus('denied');
      }
    }

    setStatus('checking');
    checkTutor();

    return () => {
      mounted = false;
    };
  }, [me, role, canFastAllow]);

  if (!me) return null;

  if (role !== 'DOCENTE') {
    return <Navigate to={getHomePath(me)} replace />;
  }

  if (status === 'checking') return null;

  if (status === 'denied') {
    return <NoTutorAccessView />;
  }

  return <Outlet />;
}

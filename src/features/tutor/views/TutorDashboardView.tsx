import { useEffect, useState } from 'react';
import { academicService } from '../../../services/academic.service';
import type { Group } from '../../../core/types/api.types';

export default function TutorDashboardView() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await academicService.myGroups();
        if (mounted) {
          // normalize incoming groups, so `id` is a number and match the Group type
          setGroups((data ?? []).map(g => ({ ...g, id: Number((g as any).id) })) as Group[]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return null;

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard TUTOR</h1>
      <p>Grupos asignados: {groups.length}</p>
      <pre>{JSON.stringify(groups, null, 2)}</pre>
    </div>
  );
}

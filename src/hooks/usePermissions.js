import { useAuth } from './useAuth';
import { canView, canEdit, normalizeRole } from '../utils/permissions';

// Role-aware UI gating. The database RLS is the real lock; this hook keeps
// the interface honest about it (hide what a role can't open, disable what
// it can't edit).
export const usePermissions = () => {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  return {
    role,
    isDoctor: role === 'doctor',
    canView: (path) => canView(role, path),
    canEdit: (path) => canEdit(role, path),
  };
};

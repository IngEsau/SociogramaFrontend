/**
 * Exportación centralizada de stores
 */

export {
  useAuthStore,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectError,
  selectUserRole,
} from '../features/auth/store/auth.store';

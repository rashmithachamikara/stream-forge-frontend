import { UserRole } from '@/features/auth/types';

export const ACTIVE_VIEW_STORAGE_KEY = 'streamForgeActiveView';
export const ACTIVE_VIEW_CHANGE_EVENT = 'streamforge:view-mode-change';

export const VIEW_DASHBOARD_PATHS: Record<UserRole, string> = {
  admin: '/dashboard/admin',
  editor: '/dashboard/editor',
  viewer: '/dashboard/viewer',
};

export const ALLOWED_VIEWS_BY_ROLE: Record<UserRole, UserRole[]> = {
  admin: ['admin', 'editor', 'viewer'],
  editor: ['editor', 'viewer'],
  viewer: ['viewer'],
};

export const getAllowedViews = (role: UserRole) => ALLOWED_VIEWS_BY_ROLE[role];

export const getViewFromPath = (pathname?: string | null): UserRole | null => {
  if (!pathname) {
    return null;
  }

  if (pathname.startsWith('/admin')) {
    return 'admin';
  }

  if (pathname.startsWith('/bookmarks')) {
    return 'viewer';
  }

  if (pathname.startsWith('/dashboard/admin')) {
    return 'admin';
  }

  if (pathname.startsWith('/dashboard/editor')) {
    return 'editor';
  }

  if (pathname.startsWith('/dashboard/viewer')) {
    return 'viewer';
  }

  return null;
};

export const readStoredView = (): UserRole | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedView = window.localStorage.getItem(ACTIVE_VIEW_STORAGE_KEY);
  return storedView === 'admin' || storedView === 'editor' || storedView === 'viewer' ? storedView : null;
};

export const resolveActiveView = (userRole: UserRole, pathname?: string | null): UserRole => {
  const allowedViews = getAllowedViews(userRole);
  const pathView = getViewFromPath(pathname);

  if (pathView && allowedViews.includes(pathView)) {
    return pathView;
  }

  const storedView = readStoredView();

  if (storedView && allowedViews.includes(storedView)) {
    return storedView;
  }

  return userRole;
};

export const setStoredView = (view: UserRole) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ACTIVE_VIEW_STORAGE_KEY, view);
  window.dispatchEvent(new CustomEvent<UserRole>(ACTIVE_VIEW_CHANGE_EVENT, { detail: view }));
};

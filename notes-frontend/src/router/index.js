import { createRouter, createWebHistory } from 'vue-router';

import { authStore } from '@/features/auth/stores/authStore';
import { authRoutes } from '@/features/auth/routes';
import { notesRoutes } from '@/features/notes/routes';

const routes = [
  ...authRoutes,
  ...notesRoutes
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to) => {
  if (to.meta.requiresAuth) {
    const user = await authStore.checkAuth();

    if (!user) {
      return {
        name: 'login',
        query: {
          redirect: to.fullPath
        }
      };
    }
  }

  if (to.meta.guestOnly) {
    const user = await authStore.checkAuth();

    if (user) {
      return {
        name: 'home'
      };
    }
  }

  return true;
});

export default router;

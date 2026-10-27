import HomeView from './views/HomeView.vue';
import TrashView from './views/TrashView.vue';

export const notesRoutes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/trash',
    name: 'trash',
    component: TrashView,
    meta: {
      requiresAuth: true
    }
  }
];

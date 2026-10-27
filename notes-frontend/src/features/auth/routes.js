import LoginView from './views/LoginView.vue';

export const authRoutes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      guestOnly: true
    }
  }
];

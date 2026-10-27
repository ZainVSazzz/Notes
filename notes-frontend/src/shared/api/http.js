import axios from 'axios';

const protocol = window.location.protocol;
const hostname = window.location.hostname;

const api = axios.create({
  baseURL: `${protocol}//${hostname}:5000/api`,
  withCredentials: true
});

// Flag untuk mencegah multiple redirect ke login secara bersamaan
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;

      // Lazy import untuk menghindari circular dependency
      import('@/features/auth/stores/authStore').then(({ authStore }) => {
        authStore.state.user = null;
        authStore.state.checked = false;
      });

      import('@/router').then(({ default: router }) => {
        const currentRoute = router.currentRoute.value;

        if (currentRoute.name !== 'login') {
          router.push({
            name: 'login',
            query: { redirect: currentRoute.fullPath }
          });
        }

        // Reset flag setelah redirect selesai
        setTimeout(() => { isRedirecting = false; }, 1000);
      });
    }

    return Promise.reject(error);
  }
);

export default api;

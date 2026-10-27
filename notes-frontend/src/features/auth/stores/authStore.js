import { reactive } from 'vue';
import http from '@/shared/api/http';

const state = reactive({
  user: null,
  checked: false,
  loading: false
});

export const authStore = {
  state,

  get isAuthenticated() {
    return Boolean(state.user);
  },

  async checkAuth(force = false) {
    if (state.checked && !force) {
      return state.user;
    }

    state.loading = true;

    try {
      const response = await http.get('/auth/me');

      state.user = response.data.data.user;

      return state.user;
    } catch {
      state.user = null;

      return null;
    } finally {
      state.checked = true;
      state.loading = false;
    }
  },

  async login(payload) {
    const response = await http.post('/auth/login', payload);

    state.user = response.data.data.user;
    state.checked = true;

    return response.data;
  },

  async logout() {
    await http.post('/auth/logout');

    state.user = null;
    state.checked = true;
  }
};

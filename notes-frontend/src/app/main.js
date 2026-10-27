import { createApp } from 'vue';

import App from './App.vue';
import router from '@/router';
import { registerPrimeVue } from './primevue';
import '@/assets/base.css';

const app = createApp(App);

app.use(router);
registerPrimeVue(app);

app.mount('#app');

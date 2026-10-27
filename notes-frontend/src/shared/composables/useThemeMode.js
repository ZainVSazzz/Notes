import { ref } from 'vue';

const savedThemeMode = localStorage.getItem('notes_theme_mode');
const darkMode = ref(savedThemeMode ? savedThemeMode === 'dark' : true);

function applyTheme(value) {
  document.documentElement.classList.toggle('app-dark', value);
  localStorage.setItem('notes_theme_mode', value ? 'dark' : 'light');
}

applyTheme(darkMode.value);

export function useThemeMode() {
  function setDarkMode(value) {
    darkMode.value = value;
    applyTheme(value);
  }

  function toggleTheme() {
    setDarkMode(!darkMode.value);
  }

  return {
    darkMode,
    setDarkMode,
    toggleTheme
  };
}

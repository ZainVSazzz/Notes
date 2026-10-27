import { ref } from 'vue';

const STORAGE_KEY = 'notes_sidebar_collapsed';

const collapsed = ref(localStorage.getItem(STORAGE_KEY) === 'true');

function setCollapsed(value) {
  collapsed.value = value;
  localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
}

export function useSidebar() {
  function toggleCollapse() {
    setCollapsed(!collapsed.value);
  }

  return {
    collapsed,
    setCollapsed,
    toggleCollapse
  };
}

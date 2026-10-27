<script setup>
const props = defineProps({
  viewMode: {
    type: String,
    default: 'public'
  },
  search: {
    type: String,
    default: ''
  },
  sort: {
    type: String,
    default: 'populer'
  },
  darkMode: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'update:viewMode',
  'update:search',
  'update:sort',
  'toggle-theme',
  'refresh'
]);

const sortOptions = [
  { label: 'Terbaru', value: 'terbaru' },
  { label: 'Terlama', value: 'terlama' },
  { label: 'Populer', value: 'populer' },
  { label: 'Un-Populer', value: 'unpopuler' }
];
</script>

<template>
  <header class="app-header">
    <div class="segmented-control">
      <button
        type="button"
        :class="{ active: props.viewMode === 'public' }"
        @click="emit('update:viewMode', 'public')"
      >
        <i class="pi pi-globe"></i>
        Public
      </button>

      <button
        type="button"
        :class="{ active: props.viewMode === 'private' }"
        @click="emit('update:viewMode', 'private')"
      >
        <i class="pi pi-lock"></i>
        Private
      </button>
    </div>

    <div class="header-actions">
      <span class="header-search">
        <i class="pi pi-search"></i>
        <InputText
          :model-value="props.search"
          placeholder="Cari judul, isi, solusi..."
          @update:model-value="emit('update:search', $event)"
        />
      </span>

      <Select
        :model-value="props.sort"
        :options="sortOptions"
        option-label="label"
        option-value="value"
        class="sort-select"
        @update:model-value="emit('update:sort', $event)"
      />

      <Button
        :icon="props.darkMode ? 'pi pi-sun' : 'pi pi-moon'"
        severity="secondary"
        rounded
        outlined
        aria-label="Ganti mode"
        @click="emit('toggle-theme')"
      />

      <Button
        icon="pi pi-refresh"
        severity="secondary"
        rounded
        text
        aria-label="Refresh"
        @click="emit('refresh')"
      />
    </div>
  </header>
</template>

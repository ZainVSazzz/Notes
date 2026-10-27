<script setup>
import { onMounted, ref, watch } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

import DashboardShell from '@/shared/layout/DashboardShell.vue';
import NoteCard from '@/features/notes/components/NoteCard.vue';
import NoteFormDialog from '@/features/notes/components/NoteFormDialog.vue';
import { catatanService } from '@/features/notes/services/catatanService';
import { authStore } from '@/features/auth/stores/authStore';
import { useThemeMode } from '@/shared/composables/useThemeMode';

const toast = useToast();
const confirm = useConfirm();
const { darkMode, toggleTheme } = useThemeMode();

const notes = ref([]);
const pagination = ref(null);
const loading = ref(false);
const search = ref('');
const sort = ref('populer');
const dialogVisible = ref(false);
const selectedNote = ref(null);

let searchTimer = null;

const sortOptions = [
  { label: 'Terbaru', value: 'terbaru' },
  { label: 'Terlama', value: 'terlama' },
  { label: 'Populer', value: 'populer' },
  { label: 'Un-Populer', value: 'unpopuler' }
];

async function loadTrash() {
  loading.value = true;

  try {
    const data = await catatanService.getTrash({
      page: 1,
      limit: 30,
      search: search.value,
      sort: sort.value
    });

    notes.value = data.catatan || [];
    pagination.value = data.pagination || null;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal',
      detail: error.response?.data?.message || 'Gagal mengambil keranjang sampah',
      life: 2600
    });
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  selectedNote.value = null;
  dialogVisible.value = true;
}

async function saveNote(payload) {
  try {
    await catatanService.create({
      judul: payload.judul,
      gambar: payload.gambar,
      isi: payload.isi,
      solusi: payload.solusi,
      status: payload.status
    });

    dialogVisible.value = false;
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Catatan berhasil dibuat', life: 2200 });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal', detail: error.response?.data?.message || 'Gagal membuat catatan', life: 2600 });
  }
}

function restoreNote(note) {
  confirm.require({
    message: `Restore catatan "${note.judul}"?`,
    header: 'Restore Catatan',
    icon: 'pi pi-undo',
    rejectLabel: 'Batal',
    acceptLabel: 'Ya, Restore',
    accept: async () => {
      try {
        await catatanService.restore(note.id);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Catatan berhasil direstore', life: 2200 });
        await loadTrash();
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: error.response?.data?.message || 'Gagal restore catatan', life: 2600 });
      }
    }
  });
}

watch(sort, () => loadTrash());
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadTrash(), 450);
});

onMounted(() => {
  loadTrash();
});
</script>

<template>
  <DashboardShell
    active-page="trash"
    @create="openCreateDialog"
  >
    <header class="app-header trash-header">
      <div class="header-title">
        <span class="eyebrow">Keranjang Sampah</span>
        <h2>Catatan Hide</h2>
      </div>

      <div class="header-actions">
        <span class="header-search">
          <i class="pi pi-search"></i>
          <InputText
            v-model="search"
            placeholder="Cari catatan di sampah..."
          />
        </span>

        <Select
          v-model="sort"
          :options="sortOptions"
          option-label="label"
          option-value="value"
          class="sort-select"
        />

        <Button
          :icon="darkMode ? 'pi pi-sun' : 'pi pi-moon'"
          severity="secondary"
          rounded
          outlined
          aria-label="Ganti mode"
          @click="toggleTheme"
        />

        <Button
          icon="pi pi-refresh"
          severity="secondary"
          rounded
          text
          aria-label="Refresh"
          @click="loadTrash"
        />
      </div>
    </header>

    <section class="content-section">
      <div class="section-summary">
        <div>
          <h3>{{ pagination?.total || 0 }} Catatan di Sampah</h3>
          <p>Catatan dengan keterangan <b>hide</b> tampil di sini.</p>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <ProgressSpinner style="width: 46px; height: 46px" stroke-width="5" />
        <span>Memuat keranjang sampah...</span>
      </div>

      <div v-else-if="notes.length === 0" class="empty-state">
        <i class="pi pi-trash"></i>
        <h3>Keranjang sampah kosong</h3>
        <p>Catatan yang di-delete akan tampil di halaman ini.</p>
      </div>

      <div v-else class="notes-list">
        <NoteCard
          v-for="note in notes"
          :key="note.id"
          :note="note"
          :current-user-name="authStore.state.user?.name"
          is-trash
          @restore="restoreNote"
        />
      </div>
    </section>

    <NoteFormDialog
      v-model:visible="dialogVisible"
      :note="selectedNote"
      @save="saveNote"
    />
  </DashboardShell>
</template>

<style src="@/features/notes/notes.css"></style>

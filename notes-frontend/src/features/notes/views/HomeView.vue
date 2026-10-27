<script setup>
import { onMounted, ref, watch } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

import DashboardShell from '@/shared/layout/DashboardShell.vue';
import NotesHeader from '@/features/notes/components/NotesHeader.vue';
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
const viewMode = ref('public');
const search = ref('');
const sort = ref('populer');
const dialogVisible = ref(false);
const selectedNote = ref(null);

let searchTimer = null;

async function loadNotes() {
  loading.value = true;

  try {
    const params = {
      page: 1,
      limit: 30,
      search: search.value,
      sort: sort.value
    };

    const data = viewMode.value === 'public'
      ? await catatanService.getPublic(params)
      : await catatanService.getPrivate(params);

    notes.value = data.catatan || [];
    pagination.value = data.pagination || null;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal',
      detail: error.response?.data?.message || 'Gagal mengambil catatan',
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

function openEditDialog(note) {
  selectedNote.value = { ...note };
  dialogVisible.value = true;
}

async function saveNote(payload) {
  if (!payload.judul) {
    toast.add({ severity: 'warn', summary: 'Validasi', detail: 'Judul wajib diisi', life: 2200 });
    return;
  }

  if (!payload.solusi) {
    toast.add({ severity: 'warn', summary: 'Validasi', detail: 'Solusi wajib diisi', life: 2200 });
    return;
  }

  try {
    if (payload.id) {
      await catatanService.update(payload.id, {
        judul: payload.judul,
        gambar: payload.gambar,
        isi: payload.isi,
        solusi: payload.solusi,
        status: payload.status
      });

      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Catatan berhasil diupdate', life: 2200 });
    } else {
      await catatanService.create({
        judul: payload.judul,
        gambar: payload.gambar,
        isi: payload.isi,
        solusi: payload.solusi,
        status: payload.status
      });

      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Catatan berhasil dibuat', life: 2200 });
    }

    dialogVisible.value = false;
    await loadNotes();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal',
      detail: error.response?.data?.message || 'Gagal menyimpan catatan',
      life: 2600
    });
  }
}

async function copyIsiNote(note) {
  try {
    const result = await catatanService.copyIsi(note.id);

    await navigator.clipboard.writeText(result.copyText || '');

    const targetNote = notes.value.find((item) => item.id === note.id);

    if (targetNote) {
      targetNote.klik = result.catatan.klik;
    }

    toast.add({
      severity: 'success',
      summary: 'Berhasil',
      detail: 'Isi catatan berhasil dicopy',
      life: 2200
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal',
      detail: error.response?.data?.message || 'Gagal copy isi catatan',
      life: 2500
    });
  }
}

async function copySolusiNote(note) {
  try {
    const result = await catatanService.copySolusi(note.id);

    await navigator.clipboard.writeText(result.copyText || '');

    toast.add({
      severity: 'success',
      summary: 'Berhasil',
      detail: 'Solusi berhasil dicopy',
      life: 2200
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal',
      detail: error.response?.data?.message || 'Gagal copy solusi',
      life: 2500
    });
  }
}

function toggleStatus(note) {
  const nextStatus = note.status === 'public' ? 'private' : 'public';

  confirm.require({
    message: `Ubah status catatan menjadi ${nextStatus}?`,
    header: 'Konfirmasi Status',
    icon: 'pi pi-info-circle',
    rejectLabel: 'Batal',
    acceptLabel: 'Ya, Ubah',
    accept: async () => {
      try {
        await catatanService.updateStatus(note.id, nextStatus);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Status catatan berhasil diubah', life: 2200 });
        await loadNotes();
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: error.response?.data?.message || 'Gagal mengubah status', life: 2600 });
      }
    }
  });
}

function moveToTrash(note) {
  confirm.require({
    message: `Pindahkan catatan "${note.judul}" ke keranjang sampah?`,
    header: 'Konfirmasi Delete',
    icon: 'pi pi-trash',
    rejectLabel: 'Batal',
    acceptLabel: 'Ya, Pindahkan',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await catatanService.moveToTrash(note.id);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Catatan masuk keranjang sampah', life: 2200 });
        await loadNotes();
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: error.response?.data?.message || 'Gagal delete catatan', life: 2600 });
      }
    }
  });
}

watch([viewMode, sort], () => {
  loadNotes();
});

watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadNotes();
  }, 450);
});

onMounted(() => {
  loadNotes();
});
</script>

<template>
  <DashboardShell
    active-page="home"
    @create="openCreateDialog"
  >
    <NotesHeader
      v-model:view-mode="viewMode"
      v-model:search="search"
      v-model:sort="sort"
      :dark-mode="darkMode"
      @toggle-theme="toggleTheme"
      @refresh="loadNotes"
    />

    <section class="content-section">
      <div class="section-summary">
        <div>
          <h3>{{ pagination?.total || 0 }} Catatan</h3>
          <p>
            Menampilkan catatan {{ viewMode === 'public' ? 'public' : 'private milik Anda' }}.
          </p>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <ProgressSpinner style="width: 46px; height: 46px" stroke-width="5" />
        <span>Memuat catatan...</span>
      </div>

      <div v-else-if="notes.length === 0" class="empty-state">
        <i class="pi pi-inbox"></i>
        <h3>Belum ada catatan</h3>
        <p>Coba ubah pencarian atau tambah catatan baru.</p>
        <Button label="Tambah Catatan" icon="pi pi-plus" @click="openCreateDialog" />
      </div>

      <div v-else class="notes-list">
        <NoteCard
          v-for="note in notes"
          :key="note.id"
          :note="note"
          :current-user-name="authStore.state.user?.name"
          @copy-isi="copyIsiNote"
          @copy-solusi="copySolusiNote"
          @edit="openEditDialog"
          @toggle-status="toggleStatus"
          @delete="moveToTrash"
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

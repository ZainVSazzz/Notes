<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  note: {
    type: Object,
    required: true,
  },
  currentUserName: {
    type: String,
    default: "",
  },
  isTrash: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "copy-isi",
  "copy-solusi",
  "edit",
  "toggle-status",
  "delete",
  "restore",
]);

const imagePreviewVisible = ref(false);

const canManage = computed(() => {
  return props.note.nama === props.currentUserName;
});

const statusIcon = computed(() => {
  return props.note.status === "public" ? "pi pi-globe" : "pi pi-lock";
});

const nextStatusTitle = computed(() => {
  return props.note.status === "public" ? "Ubah ke private" : "Ubah ke public";
});

const imageUrl = computed(() => {
  if (!props.note.gambar) {
    return null;
  }

  if (
    props.note.gambar.startsWith("http") ||
    props.note.gambar.startsWith("data:")
  ) {
    return props.note.gambar;
  }

  const protocol = window.location.protocol;
  const hostname = window.location.hostname;

  return `${protocol}//${hostname}:5000${props.note.gambar}`;
});

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function openImagePreview() {
  if (!imageUrl.value) {
    return;
  }

  imagePreviewVisible.value = true;
}
</script>

<template>
  <article class="note-wide-card">
    <button
      v-if="imageUrl"
      type="button"
      class="note-wide-image"
      @click="openImagePreview"
    >
      <img :src="imageUrl" :alt="props.note.judul" />
      <span class="image-zoom-badge">
        <i class="pi pi-search-plus"></i>
      </span>
    </button>

    <div v-else class="note-wide-image empty">
      <i class="pi pi-image"></i>
      <span>Tidak ada gambar</span>
    </div>

    <div class="note-wide-content">
      <div class="note-wide-head">
        <div class="note-title-block">
          <h3>{{ props.note.judul }}</h3>

          <div class="note-wide-meta">
            <span>
              <i class="pi pi-user"></i>
              {{ props.note.nama }}
            </span>

            <span>
              <i class="pi pi-calendar"></i>
              Updated:
              {{ formatDateTime(props.note.updtime || props.note.tanggal) }}
            </span>

            <span>
              <i class="pi pi-eye"></i>
              {{ props.note.klik || 0 }}x copy isi
            </span>
          </div>
        </div>

        <div class="note-icon-actions">
          <template v-if="!props.isTrash && canManage">
            <Button
              :icon="statusIcon"
              text
              rounded
              severity="info"
              :title="nextStatusTitle"
              @click="emit('toggle-status', props.note)"
            />

            <Button
              icon="pi pi-pencil"
              text
              rounded
              severity="warn"
              title="Edit catatan"
              @click="emit('edit', props.note)"
            />

            <Button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              title="Pindahkan ke keranjang sampah"
              @click="emit('delete', props.note)"
            />
          </template>

          <template v-if="props.isTrash">
            <Button
              icon="pi pi-undo"
              text
              rounded
              severity="success"
              title="Restore catatan"
              @click="emit('restore', props.note)"
            />
          </template>
        </div>
      </div>

      <div class="note-divider"></div>

      <div class="note-section">
        <div class="note-section-header">
          <strong>Isi:</strong>

          <Button
            v-if="!props.isTrash"
            icon="pi pi-copy"
            label="Copy Isi"
            size="small"
            severity="success"
            text
            class="copy-inline-btn"
            @click="emit('copy-isi', props.note)"
          />
        </div>

        <div class="note-text-box">
          <pre>{{ props.note.isi || "-" }}</pre>
        </div>
      </div>

      <div class="note-section solution">
        <div class="note-section-header">
          <strong>Solusi:</strong>

          <Button
            v-if="!props.isTrash"
            icon="pi pi-copy"
            label="Copy Solusi"
            size="small"
            severity="info"
            text
            class="copy-inline-btn"
            @click="emit('copy-solusi', props.note)"
          />
        </div>

        <div class="note-text-box">
          <pre>{{ props.note.solusi || "-" }}</pre>
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="imagePreviewVisible"
      modal
      dismissable-mask
      class="image-preview-dialog"
      :style="{ width: 'min(980px, 96vw)' }"
    >
      <template #header>
        <span class="image-dialog-title">{{ props.note.judul }}</span>
      </template>

      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="props.note.judul"
        class="image-preview-full"
      />
    </Dialog>
  </article>
</template>

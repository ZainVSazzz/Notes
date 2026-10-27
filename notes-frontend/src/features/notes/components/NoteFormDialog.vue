<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { uploadService } from '@/features/notes/services/uploadService';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  note: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:visible', 'save']);

const fileInput = ref(null);
const uploadingImage = ref(false);
const imageError = ref('');

const form = reactive({
  judul: '',
  gambar: '',
  isi: '',
  solusi: '',
  status: 'private'
});

const statusOptions = [
  { label: 'Private', value: 'private' },
  { label: 'Public', value: 'public' }
];

const isEdit = computed(() => Boolean(props.note?.id));
const title = computed(() => isEdit.value ? 'Edit Catatan' : 'Tambah Catatan');

const previewImage = computed(() => {
  if (!form.gambar) {
    return null;
  }

  if (
    form.gambar.startsWith('http') ||
    form.gambar.startsWith('data:')
  ) {
    return form.gambar;
  }

  return `${import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000'}${form.gambar}`;
});

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      return;
    }

    imageError.value = '';
    form.judul = props.note?.judul || '';
    form.gambar = props.note?.gambar || '';
    form.isi = props.note?.isi || '';
    form.solusi = props.note?.solusi || '';
    form.status = props.note?.status || 'private';
  }
);

function closeDialog() {
  emit('update:visible', false);
}

function openFilePicker() {
  fileInput.value?.click();
}

async function handleFileChange(event) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  await uploadImageFile(file);

  event.target.value = '';
}

async function handlePaste(event) {
  const items = event.clipboardData?.items || [];

  const imageItem = [...items].find((item) => {
    return item.type.startsWith('image/');
  });

  if (!imageItem) {
    return;
  }

  const file = imageItem.getAsFile();

  if (!file) {
    return;
  }

  await uploadImageFile(file);
}

async function uploadImageFile(file) {
  imageError.value = '';

  if (!file.type.startsWith('image/')) {
    imageError.value = 'File harus berupa gambar';
    return;
  }

  if (file.size > 3 * 1024 * 1024) {
    imageError.value = 'Ukuran gambar maksimal 3MB';
    return;
  }

  uploadingImage.value = true;

  try {
    const result = await uploadService.uploadImage(file);

    form.gambar = result.imageUrl;
  } catch (error) {
    imageError.value =
      error.response?.data?.message || 'Upload gambar gagal';
  } finally {
    uploadingImage.value = false;
  }
}

function removeImage() {
  form.gambar = '';
  imageError.value = '';
}

function submitForm() {
  emit('save', {
    id: props.note?.id || null,
    judul: form.judul.trim(),
    gambar: form.gambar || null,
    isi: form.isi.trim() || null,
    solusi: form.solusi.trim(),
    status: form.status
  });
}
</script>

<template>
  <Dialog
    :visible="props.visible"
    modal
    :header="title"
    class="note-dialog"
    :style="{ width: 'min(760px, 94vw)' }"
    @update:visible="emit('update:visible', $event)"
  >
    <form class="note-form" @submit.prevent="submitForm">
      <div class="form-grid two">
        <div class="form-group">
          <label>Judul</label>
          <InputText
            v-model="form.judul"
            placeholder="Judul catatan"
            autofocus
          />
        </div>

        <div class="form-group">
          <label>Status</label>
          <Select
            v-model="form.status"
            :options="statusOptions"
            option-label="label"
            option-value="value"
          />
        </div>
      </div>

      <div class="form-group">
        <label>Gambar</label>

        <div
          class="image-upload-box"
          tabindex="0"
          @paste.prevent="handlePaste"
        >
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden-file-input"
            @change="handleFileChange"
          />

          <div v-if="previewImage" class="image-upload-preview">
            <img :src="previewImage" alt="Preview gambar" />

            <div class="image-upload-actions">
              <Button
                type="button"
                label="Ganti"
                icon="pi pi-upload"
                size="small"
                severity="info"
                outlined
                :loading="uploadingImage"
                @click="openFilePicker"
              />

              <Button
                type="button"
                label="Hapus"
                icon="pi pi-times"
                size="small"
                severity="danger"
                outlined
                @click="removeImage"
              />
            </div>
          </div>

          <div v-else class="image-upload-empty">
            <i class="pi pi-cloud-upload"></i>
            <strong>Choose file atau paste gambar di area ini</strong>
            <span>Format JPG, PNG, WEBP, GIF. Maksimal 3MB.</span>

            <Button
              type="button"
              label="Pilih Gambar"
              icon="pi pi-image"
              size="small"
              :loading="uploadingImage"
              @click="openFilePicker"
            />
          </div>
        </div>

        <small v-if="imageError" class="field-error">
          {{ imageError }}
        </small>
      </div>

      <div class="form-group">
        <label>Isi Catatan</label>
        <Textarea
          v-model="form.isi"
          rows="7"
          auto-resize
          placeholder="Tulis isi catatan di sini..."
        />
      </div>

      <div class="form-group">
        <label>Penyelesaian / Solusi</label>
        <Textarea
          v-model="form.solusi"
          rows="4"
          auto-resize
          placeholder="Tulis penyelesaian atau solusi..."
        />
      </div>

      <div class="dialog-footer">
        <Button
          type="button"
          label="Batal"
          severity="secondary"
          outlined
          @click="closeDialog"
        />

        <Button
          type="submit"
          :label="isEdit ? 'Simpan Perubahan' : 'Tambah Catatan'"
          icon="pi pi-save"
        />
      </div>
    </form>
  </Dialog>
</template>

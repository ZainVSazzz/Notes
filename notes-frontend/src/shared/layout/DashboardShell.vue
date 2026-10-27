<script setup>
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";

import { authStore } from "@/features/auth/stores/authStore";
import { useSidebar } from "@/shared/composables/useSidebar";
import { getCabang } from "@/features/notes/services/cabangService";

const props = defineProps({
  activePage: {
    type: String,
    default: "home",
  },
});

const emit = defineEmits(["create"]);

const router = useRouter();
const toast = useToast();
const sidebarOpen = ref(false);
const { collapsed, toggleCollapse } = useSidebar();
const cabangList = ref([]);

const initials = computed(() => {
  const name =
    authStore.state.user?.name || authStore.state.user?.username || "U";

  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
});

onMounted(async () => {
  await loadCabang();
});

async function loadCabang() {
  try {
    cabangList.value = await getCabang();
  } catch (error) {
    console.error(error);
  }
}

async function copyCabang(text) {
  try {
    await navigator.clipboard.writeText(text);

    toast.add({
      severity: "success",
      summary: "Berhasil",
      detail: `${text} disalin`,
      life: 1500,
    });
  } catch {
    toast.add({
      severity: "error",
      summary: "Gagal",
      detail: "Gagal menyalin",
      life: 2000,
    });
  }
}

function goToHome() {
  sidebarOpen.value = false;
  router.push("/");
}

function goToTrash() {
  sidebarOpen.value = false;
  router.push("/trash");
}

function openCreate() {
  sidebarOpen.value = false;
  emit("create");
}

async function logout() {
  try {
    await authStore.logout();

    toast.add({
      severity: "success",
      summary: "Logout",
      detail: "Logout berhasil",
      life: 2200,
    });

    router.replace("/login");
  } catch {
    toast.add({
      severity: "error",
      summary: "Gagal",
      detail: "Logout gagal",
      life: 2500,
    });
  }
}
</script>

<template>
  <div class="dashboard" :class="{ collapsed }">
    <div
      v-if="sidebarOpen"
      class="sidebar-backdrop"
      @click="sidebarOpen = false"
    ></div>

    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-top">
        <button
          type="button"
          class="brand-row"
          :title="collapsed ? 'Perbesar sidebar' : 'Perkecil sidebar'"
          @click="toggleCollapse"
        >
          <div class="brand-icon">
            <i class="pi pi-book"></i>
          </div>
          <span class="brand-text">Notes</span>
        </button>

        <Button
          label="Tambah Catatan"
          icon="pi pi-plus"
          class="add-note-button"
          aria-label="Tambah Catatan"
          @click="openCreate"
        />

        <nav class="side-nav">
          <button
            type="button"
            :class="{ active: props.activePage === 'home' }"
            title="Beranda"
            @click="goToHome"
          >
            <i class="pi pi-home"></i>
            <span>Beranda</span>
          </button>

          <button
            type="button"
            :class="{ active: props.activePage === 'trash' }"
            title="Keranjang Sampah"
            @click="goToTrash"
          >
            <i class="pi pi-trash"></i>
            <span>Keranjang Sampah</span>
          </button>

          <div class="sidebar-cabang">
            <div class="sidebar-cabang-header">
              <i class="pi pi-building"></i>
              <span>Daftar Cabang</span>
            </div>

            <div class="sidebar-cabang-list">
              <button
                v-for="cabang in cabangList"
                :key="cabang.kodeCab"
                type="button"
                class="sidebar-cabang-item"
                @click="copyCabang(cabang.label)"
              >
                <span class="cabang-text">
                  {{ cabang.label }}
                </span>

                <i class="pi pi-copy"></i>
              </button>
            </div>
          </div>
        </nav>
      </div>

      <div class="sidebar-bottom">
        <div class="profile-card">
          <Avatar :label="initials" shape="circle" />
          <div class="profile-info">
            <strong>{{ authStore.state.user?.name }}</strong>
            <span>@{{ authStore.state.user?.username }}</span>
          </div>
        </div>

        <Button
          label="Logout"
          icon="pi pi-sign-out"
          severity="danger"
          outlined
          class="logout-button"
          aria-label="Logout"
          @click="logout"
        />
      </div>
    </aside>

    <main class="content-wrap">
      <button
        type="button"
        class="mobile-menu-button"
        @click="sidebarOpen = true"
      >
        <i class="pi pi-bars"></i>
      </button>

      <slot></slot>
    </main>
  </div>
</template>

<style src="./layout.css"></style>

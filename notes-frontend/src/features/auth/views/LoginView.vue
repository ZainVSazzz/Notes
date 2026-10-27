<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";

import http from "@/shared/api/http";
import { authStore } from "@/features/auth/stores/authStore";

const router = useRouter();
const route = useRoute();
const toast = useToast();

const identifier = ref("");
const rememberUsername = ref(false);

const captcha = ref(null);
const selectedCaptchaOptionId = ref("");
const captchaCountdown = ref(0);
let captchaTimer = null;
const loadingCaptcha = ref(false);
const loadingLogin = ref(false);
const errorMessage = ref("");

const SAVED_USERNAME_KEY = "notes_forum_saved_username";

function startCaptchaCountdown(seconds) {
  captchaCountdown.value = seconds;

  if (captchaTimer) {
    clearInterval(captchaTimer);
  }

  captchaTimer = setInterval(async () => {
    captchaCountdown.value--;

    if (captchaCountdown.value <= 0) {
      clearInterval(captchaTimer);
      captchaTimer = null;

      await loadCaptcha();
    }
  }, 1000);
}

async function loadCaptcha() {
  loadingCaptcha.value = true;
  errorMessage.value = "";
  selectedCaptchaOptionId.value = "";

  try {
    const response = await http.get("/auth/captcha");

    captcha.value = response.data.data;
    startCaptchaCountdown(response.data.data.expiresIn);
  } catch {
    errorMessage.value = "Gagal memuat captcha";
  } finally {
    loadingCaptcha.value = false;
  }
}

function selectCaptchaOption(optionId) {
  selectedCaptchaOptionId.value = optionId;
}

function loadSavedUsername() {
  const savedUsername = localStorage.getItem(SAVED_USERNAME_KEY);

  if (savedUsername) {
    identifier.value = savedUsername;
    rememberUsername.value = true;
  }
}

function saveUsernamePreference() {
  if (rememberUsername.value) {
    localStorage.setItem(SAVED_USERNAME_KEY, identifier.value.trim());
    return;
  }

  localStorage.removeItem(SAVED_USERNAME_KEY);
}

async function handleLogin() {
  errorMessage.value = "";

  if (!identifier.value.trim()) {
    errorMessage.value = "Username atau NIK wajib diisi";
    return;
  }

  if (!selectedCaptchaOptionId.value) {
    errorMessage.value = "Pilih jawaban captcha terlebih dahulu";
    return;
  }

  loadingLogin.value = true;

  try {
    await authStore.login({
      identifier: identifier.value.trim(),
      captchaOptionId: selectedCaptchaOptionId.value,
    });

    saveUsernamePreference();

    toast.add({
      severity: "success",
      summary: "Berhasil",
      detail: "Login berhasil",
      life: 2500,
    });

    const redirectPath = route.query.redirect || "/";

    router.replace(String(redirectPath));
  } catch (error) {
    const message = error.response?.data?.message || "Login gagal";

    errorMessage.value = message;

    await loadCaptcha();
  } finally {
    loadingLogin.value = false;
  }
}

onMounted(() => {
  loadSavedUsername();
  loadCaptcha();
});

onUnmounted(() => {
  if (captchaTimer) {
    clearInterval(captchaTimer);
  }
});
</script>

<template>
  <main class="login-page">
    <section class="login-shell">
      <div class="login-hero">
        <div class="brand-badge">
          <i class="pi pi-book"></i>
        </div>

        <h1>Note Apps</h1>

        <p>
          Tempat mencatat, menyimpan solusi, dan berbagi catatan pribadi atau
          publik.
        </p>

        <div class="hero-features">
          <div class="hero-feature">
            <i class="pi pi-shield"></i>
            <span>Login aman dengan cookie HttpOnly</span>
          </div>

          <div class="hero-feature">
            <i class="pi pi-users"></i>
            <span>Catatan bisa pribadi atau publik</span>
          </div>

          <div class="hero-feature">
            <i class="pi pi-image"></i>
            <span>Dukung judul, gambar, isi, dan penyelesaian</span>
          </div>
        </div>
      </div>

      <Card class="login-card">
        <template #title>
          <div class="card-title">
            <span>Masuk Akun</span>
          </div>
        </template>

        <template #content>
          <form class="login-form" @submit.prevent="handleLogin">
            <div class="form-group">
              <label for="identifier">Username atau NIK</label>

              <span class="input-icon-wrap">
                <i class="pi pi-user"></i>
                <InputText
                  id="identifier"
                  v-model="identifier"
                  placeholder="Contoh: zainuri / 1234567890"
                  autocomplete="username"
                  class="input-with-icon"
                />
              </span>
            </div>

            <div class="remember-row">
              <Checkbox
                v-model="rememberUsername"
                input-id="rememberUsername"
                binary
              />

              <label for="rememberUsername"> Simpan username </label>
            </div>

            <div class="captcha-box">
              <div class="captcha-top">
                <div>
                  <h3>Captcha</h3>
                  <p>
                    Pilih hasil perhitungan.
                    <span class="captcha-timer">
                      ({{ captchaCountdown }}s)
                    </span>
                  </p>
                </div>

                <Button
                  type="button"
                  icon="pi pi-refresh"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  :loading="loadingCaptcha"
                  @click="loadCaptcha"
                />
              </div>

              <div v-if="loadingCaptcha" class="captcha-loading-small">
                <ProgressSpinner
                  style="width: 28px; height: 28px"
                  stroke-width="5"
                />
              </div>

              <template v-else-if="captcha">
                <div class="captcha-question-small">
                  <div v-html="captcha.questionSvg"></div>
                </div>

                <div class="captcha-options-small">
                  <button
                    v-for="option in captcha.options"
                    :key="option.optionId"
                    type="button"
                    class="captcha-option-small"
                    :class="{
                      active: selectedCaptchaOptionId === option.optionId,
                    }"
                    @click="selectCaptchaOption(option.optionId)"
                  >
                    <span v-html="option.svg"></span>
                  </button>
                </div>
              </template>
            </div>

            <Message v-if="errorMessage" severity="error" :closable="false">
              {{ errorMessage }}
            </Message>

            <Button
              type="submit"
              label="Login"
              icon="pi pi-sign-in"
              class="login-button"
              :loading="loadingLogin"
            />
          </form>
        </template>
      </Card>
    </section>
  </main>
</template>

<style src="@/features/auth/auth.css"></style>

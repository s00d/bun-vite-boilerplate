<template>
  <div>
    <select
      :value="currentLocale"
      @change="onChange"
      class="border px-2 py-1 rounded"
    >
      <option
        v-for="code in availableLocales"
        :key="code"
        :value="code"
      >
        {{ code.toUpperCase() }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { computed } from "vue";

// ⬇️ Получаем доступные языки и текущую локаль из i18n
const { locale, fallbackLocale, availableLocales } = useI18n();
const defaultLocale = Array.isArray(fallbackLocale.value)
  ? fallbackLocale.value[0]
  : fallbackLocale.value ?? "en";

const route = useRoute();
const router = useRouter();

// 🧠 Определяем текущую локаль по URL
const currentLocale = computed(() => {
  const segments = route.path.split("/").filter(Boolean);
  const first = segments[0];
  return /^[a-z]{2}$/.test(first) ? first : defaultLocale;
});

// 🔁 Редирект на новый путь с учётом локали
function onChange(event: Event) {
  const newLocale = (event.target as HTMLSelectElement).value;
  const segments = route.path.split("/").filter(Boolean);

  let restPath = segments;
  if (segments.length && /^[a-z]{2}$/.test(segments[0])) {
    restPath = segments.slice(1);
  }

  const newPath =
    newLocale === defaultLocale
      ? `/${restPath.join("/")}`
      : `/${newLocale}/${restPath.join("/")}`;

  router.push(newPath || "/");
}
</script>

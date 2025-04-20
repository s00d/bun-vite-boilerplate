<template>
  <div class="inline-block">
    <select
      :value="currentLocale"
      @change="onChange"
      class="px-3 py-2 border border-border bg-input text-foreground rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-zinc-900 dark:border-zinc-700"
    >
      <option
        v-for="code in availableLocales"
        :key="code"
        :value="code"
        class="bg-white dark:bg-zinc-800 text-foreground dark:text-white"
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

const { locale, fallbackLocale, availableLocales } = useI18n();
const defaultLocale = Array.isArray(fallbackLocale.value)
  ? fallbackLocale.value[0]
  : fallbackLocale.value ?? "en";

const route = useRoute();
const router = useRouter();

const currentLocale = computed(() => {
  const segments = route.path.split("/").filter(Boolean);
  const first = segments[0];
  return /^[a-z]{2}$/.test(first) ? first : defaultLocale;
});

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

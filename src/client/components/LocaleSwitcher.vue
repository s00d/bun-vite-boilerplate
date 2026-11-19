<script setup lang="ts">
import { useI18n } from "@i18n-micro/vue";

// switchLocale: sets the locale and navigates to the same page in it (/about ↔ /ru/about).
const { locale, getLocales, switchLocale } = useI18n();
</script>

<template>
  <div class="inline-block">
    <select
      :value="locale"
      class="px-3 py-2 border border-border bg-input text-foreground rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-zinc-900 dark:border-zinc-700"
      @change="switchLocale(($event.target as HTMLSelectElement).value)"
    >
      <option
        v-for="l in getLocales()"
        :key="l.code"
        :value="l.code"
        class="bg-white dark:bg-zinc-800 text-foreground dark:text-white"
      >
        {{ l.displayName ?? l.code.toUpperCase() }}
      </option>
    </select>
  </div>
</template>

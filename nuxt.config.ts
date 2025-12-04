// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
    vite: {
    plugins: [tailwindcss()],
  },
  css: ["./app/tailwind.css"],
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/content',
    ['@pinia/nuxt',
      {
        autoImports: [
          'defineStore',
          'acceptHMRUpdate',
        ],
      }
    ]
  ],
  imports: {
    dirs: ['stores'],
  }
})
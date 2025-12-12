// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devServer: {
    port: 3000,
    host: '::',
  },
  devtools: { enabled: true },
    vite: {
    plugins: [tailwindcss()],
  },
  css: ["./app/tailwind.css"],
  modules: ['@nuxt/eslint', '@nuxt/content', ['@pinia/nuxt',
    {
      autoImports: [
        'defineStore',
        'acceptHMRUpdate',
      ],
    }
  ], '@nuxt/icon'],
  imports: {
    dirs: ['stores'],
  }
})
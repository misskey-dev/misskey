import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:61812',
    defaultCommandTimeout: 10000,
  },
})

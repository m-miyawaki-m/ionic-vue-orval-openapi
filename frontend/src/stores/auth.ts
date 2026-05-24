import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi } from '../api/auth/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const isAuthenticated = computed(() => token.value !== null)

  async function login(username: string, password: string) {
    const res = await loginApi({ username, password })
    token.value = res.token
  }
  function logout() {
    token.value = null
  }
  return { token, isAuthenticated, login, logout }
})

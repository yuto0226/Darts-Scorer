import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface Profile {
  username: string
}

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<Profile>({
    username: 'Player',
  })

  // Load from localStorage
  const saved = localStorage.getItem('profile')
  if (saved) {
    try {
      profile.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to load profile', e)
    }
  }

  // Save to localStorage whenever profile changes
  watch(
    profile,
    (val) => {
      localStorage.setItem('profile', JSON.stringify(val))
    },
    { deep: true },
  )

  function setUsername(username: string) {
    profile.value.username = username
  }

  return {
    profile,
    setUsername,
  }
})

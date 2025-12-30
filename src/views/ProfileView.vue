<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from '../stores/profile'
import { useHistoryStore } from '../stores/history'

const router = useRouter()
const profileStore = useProfileStore()
const historyStore = useHistoryStore()

const username = ref(profileStore.profile.username)
const fileInput = ref<HTMLInputElement>()

const updateUsername = () => {
    profileStore.setUsername(username.value)
}

const exportData = () => {
    const data = {
        profile: profileStore.profile,
        history: historyStore.games
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'darts-data.json'
    a.click()
    URL.revokeObjectURL(url)
}

const importData = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target?.result as string)
            if (data.profile) {
                profileStore.profile = data.profile
            }
            if (data.history) {
                historyStore.games = data.history
            }
            alert('資料匯入成功！')
        } catch {
            alert('匯入失敗：無效的檔案格式')
        }
    }
    reader.readAsText(file)
}
</script>

<template>
    <div class="profile">
        <header class="sticky-header">
            <button @click="router.push('/')">Back</button>
            <h1>Profile</h1>
            <div class="header-spacer"></div>
        </header>

        <div class="content-wrapper">
            <div class="settings-card">
                <h2>個人設定</h2>
                <div class="username-section">
                    <label for="username">暱稱</label>
                    <input id="username" v-model="username" placeholder="輸入您的暱稱" />
                    <button @click="updateUsername" class="save-btn">儲存</button>
                </div>
            </div>

            <div class="data-card">
                <h2>資料匯入匯出</h2>
                <div class="buttons">
                    <button @click="exportData">匯出資料</button>
                    <input type="file" accept=".json" @change="importData" style="display: none" ref="fileInput" />
                    <button @click="fileInput?.click()">匯入資料</button>
                </div>
                <p class="note">匯出資料包含您的個人設定和遊戲歷史記錄。</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.profile {
    max-width: 800px;
    margin: 0 auto;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.content-wrapper {
    flex: 1;
    overflow-y: auto;
    padding: 0;
}

.sticky-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px 20px;
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 10;
    flex-shrink: 0;
    position: relative;
    height: 60px;
    box-sizing: border-box;
}

h1 {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    margin: 0;
    font-size: 1.5rem;
    white-space: nowrap;
}

.header-spacer {
    width: 40px;
    visibility: hidden;
}

button {
    padding: 8px 16px;
    border-radius: 4px;
    border: 1px solid #ccc;
    background: white;
    cursor: pointer;
    font-size: 1rem;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.settings-card,
.data-card {
    background: white;
    margin: 20px;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.settings-card h2,
.data-card h2 {
    margin: 0 0 15px 0;
    font-size: 1.2rem;
    color: #333;
}

.username-section {
    margin-bottom: 0;
    display: flex;
    gap: 10px;
    align-items: center;
}

.username-section label {
    flex: 0 0 auto;
    font-weight: bold;
    color: #333;
}

.username-section input {
    flex: 1;
    padding: 16px 20px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
    font-size: 1.1rem;
    height: 36px;
}

.username-section .save-btn {
    flex: 0 0 auto;
    padding: 16px 20px;
    border: 1px solid #42b883;
    border-radius: 4px;
    background: #42b883;
    color: white;
    cursor: pointer;
    font-size: 1.1rem;
    transition: background 0.2s;
}

.username-section .save-btn:hover {
    background: #369870;
}

.buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}

.buttons button {
    flex: 1;
    padding: 12px;
    border: 1px solid #42b883;
    border-radius: 4px;
    background: #42b883;
    color: white;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.2s;
}

.buttons button:hover {
    background: #369870;
}

.note {
    font-size: 0.9rem;
    color: #666;
    margin: 0;
}
</style>
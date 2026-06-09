<template>
  <div class="screen">
    <!-- 헤더 -->
    <header class="header">
      <button class="icon-btn" @click="goBack()">
        <i class="ti ti-arrow-left"></i>
      </button>
      <div class="group-avatar">
        <img src="/default_group.svg" alt="group" class="group-img" />
      </div>
      <div class="group-info">
        <div class="group-name">{{ selectedGroup?.name ?? '채팅' }}</div>
        <div class="group-sub">
          <span class="online-dot" :class="{ connected: isConnected }"></span>
          {{ isConnected ? '연결됨' : '연결 중...' }}
        </div>
      </div>
    </header>

    <!-- 메시지 목록 -->
    <main class="messages" ref="messagesEl">
      <template v-for="(item, i) in messageItems" :key="i">
        <div v-if="item.type === 'divider'" class="date-divider">
          <span>{{ item.label }}</span>
        </div>
        <div v-else
          class="msg-row"
          :class="{ mine: isMyMessage(item) }"
        >
          <div v-if="!isMyMessage(item)" class="avatar">
            <img src="/default_avatar.svg" alt="avatar" class="avatar-img" />
          </div>
          <div class="msg-wrap">
            <div v-if="!isMyMessage(item)" class="sender-name">{{ item.nickName }}</div>
            <div class="bubble" :class="{ mine: isMyMessage(item) }">{{ item.text }}</div>
            <div class="time" :class="{ mine: isMyMessage(item) }">{{ formatTime(item.timestamp) }}</div>
          </div>
        </div>
      </template>

      <div v-if="messages.length === 0 && !loading" class="empty-chat">
        <div class="empty-icon">💬</div>
        <p>아직 대화가 없어요.<br/>첫 메시지를 보내보세요!</p>
      </div>
      <div v-if="loading" class="loading-msg">불러오는 중...</div>
    </main>

    <!-- 입력창 -->
    <div class="input-bar">
      <input
        v-model="inputText"
        placeholder="메시지를 입력하세요..."
        class="chat-input"
        @keydown="handleKeydown"
        :disabled="!isConnected"
      />
      <button class="send-btn" @click="sendMessage" :disabled="!isConnected || !inputText.trim()">
        <i class="ti ti-send"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, inject } from 'vue'
import axios from 'axios'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useStore } from '../composables/useStore.js'

const { goBack } = inject('navigation')
const auth = inject('auth')
const { selectedGroup } = useStore()

const messages = ref([])
const inputText = ref('')
const loading = ref(false)
const isConnected = ref(false)
const messagesEl = ref(null)

let stompClient = null

const myUserId  = () => auth.loginUser.value?.id
const myNickName = () => auth.loginUser.value?.nickName || '나'

function isMyMessage(msg) {
  return msg.userId != null && myUserId() != null && String(msg.userId) === String(myUserId())
}

const messageItems = computed(() => {
  const items = []
  let lastKey = null
  for (const msg of messages.value) {
    const d = msg.timestamp ? new Date(msg.timestamp) : null
    const key = d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : null
    if (key && key !== lastKey) {
      lastKey = key
      items.push({ type: 'divider', label: d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) })
    }
    items.push({ type: 'msg', ...msg })
  }
  return items
})

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

async function scrollToBottom() {
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

async function loadHistory() {
  if (!selectedGroup.value?.id) return
  loading.value = true
  try {
    const res = await axios.get(`/api/chat/${selectedGroup.value.id}/messages`)
    messages.value = res.data
    await scrollToBottom()
  } catch (e) {
    console.error('채팅 히스토리 로드 실패:', e)
  } finally {
    loading.value = false
  }
}

function connect() {
  if (!selectedGroup.value?.id) return

  stompClient = new Client({
    webSocketFactory: () => new SockJS('/ws'),
    reconnectDelay: 3000,
    onConnect: () => {
      isConnected.value = true
      stompClient.subscribe(`/topic/chat/${selectedGroup.value.id}`, (frame) => {
        const msg = JSON.parse(frame.body)
        messages.value.push(msg)
        scrollToBottom()
      })
    },
    onDisconnect: () => { isConnected.value = false },
    onStompError: () => { isConnected.value = false },
  })
  stompClient.activate()
}

function sendMessage() {
  const text = inputText.value.trim()
  if (!text || !isConnected.value || !selectedGroup.value?.id) return
  stompClient.publish({
    destination: `/app/chat/${selectedGroup.value.id}`,
    body: JSON.stringify({ userId: myUserId(), nickName: myNickName(), text }),
  })
  inputText.value = ''
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
}

onMounted(async () => {
  await loadHistory()
  connect()
})

onUnmounted(() => { stompClient?.deactivate() })
</script>

<style scoped>
.screen {
  height: 100vh; height: 100dvh;
  display: flex; flex-direction: column;
  overflow: hidden; background: #f7f7f7;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  padding: 12px 16px; border-bottom: 1px solid #e5e5e5;
  display: flex; align-items: center; gap: 10px;
  background: #fff; flex-shrink: 0;
}
.icon-btn {
  width: 36px; height: 36px; border-radius: 50%;
  background: transparent; border: none; color: #333; font-size: 20px;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.icon-btn:active { background: #f5f5f5; }
.group-avatar { width: 38px; height: 38px; border-radius: 50%; overflow: hidden; flex-shrink: 0; }
.group-img { width: 100%; height: 100%; object-fit: cover; }
.group-info { flex: 1; }
.group-name { font-size: 15px; font-weight: 700; color: #000; }
.group-sub { font-size: 11px; color: #888; display: flex; align-items: center; gap: 4px; }
.online-dot { width: 6px; height: 6px; border-radius: 50%; background: #ccc; transition: background 0.3s; }
.online-dot.connected { background: #22c55e; }

.messages {
  flex: 1; overflow-y: auto;
  padding: 16px 14px; display: flex; flex-direction: column; gap: 10px;
}

.date-divider { display: flex; align-items: center; gap: 8px; margin: 4px 0 8px; }
.date-divider::before, .date-divider::after { content: ''; flex: 1; height: 1px; background: #e5e5e5; }
.date-divider span { font-size: 11px; color: #aaa; white-space: nowrap; }

.msg-row { display: flex; align-items: flex-end; gap: 8px; }
.msg-row.mine { flex-direction: row-reverse; }

.avatar { width: 30px; height: 30px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: #f0f0f0; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; }

.msg-wrap { max-width: 72%; display: flex; flex-direction: column; }
.msg-row.mine .msg-wrap { align-items: flex-end; }

.sender-name { font-size: 11px; color: #888; margin-bottom: 3px; padding-left: 4px; }

.bubble {
  background: #fff; color: #000;
  padding: 10px 14px; border-radius: 18px 18px 18px 4px;
  font-size: 14px; line-height: 1.5; word-break: break-word;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.bubble.mine { background: #000; color: #fff; border-radius: 18px 18px 4px 18px; }

.time { font-size: 10px; color: #aaa; margin-top: 3px; padding: 0 4px; }
.time.mine { text-align: right; }

.empty-chat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #bbb; text-align: center; }
.empty-icon { font-size: 40px; }
.empty-chat p { font-size: 14px; line-height: 1.6; margin: 0; }
.loading-msg { text-align: center; color: #bbb; font-size: 13px; padding: 20px; }

.input-bar {
  padding: 10px 14px; padding-bottom: max(10px, env(safe-area-inset-bottom));
  border-top: 1px solid #e5e5e5; display: flex; align-items: center; gap: 8px;
  background: #fff; flex-shrink: 0;
}
.chat-input {
  flex: 1; padding: 10px 16px;
  border: 1.5px solid #e5e5e5; border-radius: 22px;
  font-size: 14px; background: #f7f7f7; color: #000; outline: none;
  transition: border-color 0.15s;
}
.chat-input:focus { border-color: #000; background: #fff; }
.chat-input:disabled { opacity: 0.5; }
.send-btn {
  width: 40px; height: 40px; border-radius: 50%;
  background: #000; border: none; color: #fff; font-size: 18px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; cursor: pointer; transition: opacity 0.15s;
}
.send-btn:hover:not(:disabled) { opacity: 0.85; }
.send-btn:disabled { opacity: 0.3; cursor: not-allowed; }
</style>

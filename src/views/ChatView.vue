<script setup>
import { ref, nextTick, inject } from 'vue'
import { useStore } from '../composables/useStore.js'

const { goBack } = inject('navigation')
const { messages } = useStore()

const chatInput = ref('')
const messagesEl = ref(null)

function currentTime() {
  return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

async function sendMessage() {
  const text = chatInput.value.trim()
  if (!text) return
  messages.value.push({
    id: Date.now(),
    sender: '나',
    text,
    time: currentTime(),
    isMine: true
  })
  chatInput.value = ''
  await nextTick()
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <div class="screen">
    <header class="header">
      <button class="back-btn" @click="goBack()">
        <i class="ti ti-arrow-left"></i>
      </button>
      <div class="group-icon">👥</div>
      <div class="group-info">
        <div class="group-name">다이어트 챌린지</div>
        <div class="group-sub">12명 참여중</div>
      </div>
      <button class="menu-btn">
        <i class="ti ti-dots-vertical"></i>
      </button>
    </header>

    <main class="messages" ref="messagesEl">
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="msg-row"
        :class="{ mine: msg.isMine }"
      >
        <div v-if="!msg.isMine" class="avatar">😊</div>
        <div class="msg-wrap">
          <div v-if="!msg.isMine" class="sender-name">{{ msg.sender }}</div>
          <div class="bubble" :class="{ mine: msg.isMine }">
            <span v-if="msg.reaction" class="reaction">{{ msg.reaction }} </span>{{ msg.text }}
          </div>
          <div class="time" :class="{ mine: msg.isMine }">{{ msg.time }}</div>
        </div>
      </div>
    </main>

    <div class="input-bar">
      <button class="attach-btn" aria-label="식단 공유">
        <i class="ti ti-salad"></i>
      </button>
      <input
        v-model="chatInput"
        placeholder="메시지를 입력하세요..."
        class="chat-input"
        @keydown="handleKeydown"
      />
      <button class="send-btn" @click="sendMessage" aria-label="전송">
        <i class="ti ti-send"></i>
      </button>
    </div>
  </div>
</template>

<style scoped>
.screen {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  background: var(--bg-primary);
}

.back-btn,
.menu-btn {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}

.back-btn:active,
.menu-btn:active {
  background: var(--bg-secondary);
}

.group-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--accent-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.group-info {
  flex: 1;
}

.group-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.group-sub {
  font-size: 12px;
  color: var(--text-secondary);
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--bg-primary);
}

.msg-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.msg-row.mine {
  flex-direction: row-reverse;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
  align-self: flex-end;
}

.msg-wrap {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.msg-row.mine .msg-wrap {
  align-items: flex-end;
}

.sender-name {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  padding-left: 4px;
}

.bubble {
  background: var(--bg-secondary);
  color: var(--text-primary);
  padding: 10px 14px;
  border-radius: 18px 18px 18px 4px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.bubble.mine {
  background: var(--accent);
  color: #fff;
  border-radius: 18px 18px 4px 18px;
}

.reaction {
  font-size: 16px;
}

.time {
  font-size: 10px;
  color: var(--text-secondary);
  margin-top: 4px;
  padding: 0 4px;
}

.time.mine {
  text-align: right;
}

.input-bar {
  padding: 10px 12px;
  padding-bottom: max(10px, env(safe-area-inset-bottom));
  border-top: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-primary);
  flex-shrink: 0;
}

.attach-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.chat-input {
  flex: 1;
  padding: 10px 16px;
  border: 1.5px solid var(--border-medium);
  border-radius: 22px;
  font-size: 14px;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent);
  border: none;
  color: #fff;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.15s;
}

.send-btn:active {
  opacity: 0.88;
}
</style>

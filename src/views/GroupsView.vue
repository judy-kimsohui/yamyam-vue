<script setup>
import { ref, inject, onMounted } from "vue";
import axios from "axios";
import BottomNav from "../components/BottomNav.vue";
import { useStore } from "../composables/useStore.js";

const { goTo } = inject("navigation");
const { selectedGroup } = useStore();

const groups = ref([]); // 서버에서 받아온 실제 그룹 데이터 저장

onMounted(async () => {
  try {
    const response = await axios.get("/api/teams/my");
    groups.value = response.data; // 서버가 준 TeamDto 리스트 바인딩
  } catch (error) {
    console.error("팀 목록을 가져오는데 실패했습니다:", error);
    alert("그룹 정보를 불러오지 못했습니다. 다시 로그인해 주세요.");
    goTo("home"); // 실패 시 로그인 화면이나 메인으로 튕기기
  }
});

function openGroup(group) {
  selectedGroup.value = group;
  goTo("group-detail");
}

const showCreate = ref(false);
const newGroupName = ref("");
const newMemberCount = ref("");

function createGroup() {
  const name = newGroupName.value.trim();
  if (!name) return;
  groups.value.push({
    id: Date.now(),
    name,
    members: parseInt(newMemberCount.value) || 2,
  });
  newGroupName.value = "";
  newMemberCount.value = "";
  showCreate.value = false;
}
</script>

<template>
  <div class="screen">
    <!-- Group list -->
    <template v-if="!showCreate">
      <header class="header">
        <div class="title">그룹</div>
        <button
          class="add-btn"
          @click="showCreate = true"
          aria-label="그룹 만들기"
        >
          <i class="ti ti-plus"></i>
        </button>
      </header>

      <main class="content">
        <div class="section-label">참여 중인 그룹</div>
        <div class="group-list">
          <div
            v-for="group in groups"
            :key="group.id"
            class="group-card"
            @click="openGroup(group)"
          >
            <div class="group-icon">👥</div>
            <div class="group-info">
              <div class="group-name">{{ group.name }}</div>
              <div class="group-members">{{ group.members }}명 참여중</div>
            </div>
            <button class="share-btn" @click.stop>공유하기</button>
          </div>
        </div>
      </main>

      <BottomNav active-tab="groups" @navigate="goTo" />
    </template>

    <!-- Create group -->
    <template v-else>
      <header class="header">
        <button class="back-btn" @click="showCreate = false">
          <i class="ti ti-arrow-left"></i>
        </button>
        <div class="title">그룹 만들기</div>
        <div class="spacer"></div>
      </header>

      <main class="create-form">
        <div class="form-group">
          <label>그룹 이름</label>
          <input
            v-model="newGroupName"
            placeholder="예: 다이어트 챌린지"
            class="form-input"
            maxlength="20"
          />
        </div>
        <div class="form-group">
          <label>최대 인원</label>
          <select v-model="newMemberCount" class="form-input">
            <option value="">인원수 선택</option>
            <option
              v-for="n in [2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20]"
              :key="n"
              :value="String(n)"
            >
              {{ n }}명
            </option>
          </select>
        </div>
        <div class="form-hint">
          그룹을 만들면 친구들을 초대하고 식단을 함께 공유할 수 있어요! 🥗
        </div>
        <div class="form-actions">
          <button class="create-btn" @click="createGroup">그룹 만들기</button>
        </div>
      </main>
    </template>
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
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.add-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent);
  border: none;
  color: #fff;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
}

.add-btn:active {
  opacity: 0.85;
}

.back-btn {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.spacer {
  width: 32px;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 12px;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-card {
  display: flex;
  align-items: center;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.group-card:active {
  background: var(--bg-secondary);
}

.group-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--accent-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 14px;
  flex-shrink: 0;
}

.group-info {
  flex: 1;
}

.group-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.group-members {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.share-btn {
  background: var(--accent-light);
  color: var(--accent);
  border: 1px solid var(--accent-border);
  padding: 7px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

/* Create form */
.create-form {
  flex: 1;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 600;
}

.form-input {
  width: 100%;
  padding: 13px 16px;
  border: 1.5px solid var(--border-medium);
  border-radius: 12px;
  font-size: 14px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: border-color 0.2s;
  appearance: none;
  -webkit-appearance: none;
}

.form-hint {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 12px 14px;
}

.form-actions {
  margin-top: auto;
}

.create-btn {
  width: 100%;
  padding: 15px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  transition: opacity 0.15s;
}

.create-btn:active {
  opacity: 0.9;
}
</style>

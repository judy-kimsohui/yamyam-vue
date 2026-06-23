<script setup>
import { ref, inject, onMounted } from "vue";
import axios from "axios";
import BottomNav from "../components/BottomNav.vue";
import { useStore } from "../composables/useStore.js";
import { useToast } from "../composables/useToast.js";

const { goTo } = inject("navigation");
const { selectedGroup } = useStore();
const pendingInviteCode = inject("inviteCode");
const { showToast } = useToast();

const groups = ref([]);
const loading = ref(false);
const showJoin = ref(false);
const inviteInput = ref("");

// 초대 수락 모달 상태
const inviteModal = ref({ show: false, teamName: "", memberCount: 0, capacity: 0, inviteCode: "", joining: false });

async function fetchMyTeams() {
  try {
    loading.value = true;
    const response = await axios.get("/api/teams/my");
    groups.value = response.data;
  } catch (error) {
    console.error("팀 목록을 가져오는데 실패했습니다:", error);
    showToast("error", "그룹 정보를 불러오지 못했습니다.", "다시 로그인해 주세요.");
    goTo("home");
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await fetchMyTeams();
  // 초대 링크로 접근한 경우 팀 정보 조회 후 수락 모달 표시
  if (pendingInviteCode?.value) {
    try {
      const res = await axios.get(`/api/teams/invite/${pendingInviteCode.value}`);
      inviteModal.value = {
        show: true,
        teamName: res.data.teamName,
        memberCount: res.data.memberCount,
        capacity: res.data.capacity,
        inviteCode: pendingInviteCode.value,
        joining: false,
      };
    } catch (e) {
      const msg = e.response?.data;
      if (msg) showToast("error", "초대 링크 오류", msg);
      pendingInviteCode.value = null;
    }
  }
});

async function acceptInvite() {
  inviteModal.value.joining = true;
  try {
    await axios.post("/api/teams/join", { inviteCode: inviteModal.value.inviteCode });
    inviteModal.value.show = false;
    pendingInviteCode.value = null;
    await fetchMyTeams();
  } catch (e) {
    const msg = e.response?.data;
    if (msg === "이미 참여 중인 팀입니다.") {
      inviteModal.value.show = false;
      pendingInviteCode.value = null;
    } else {
      showToast("error", "참여 실패", msg || "서버 오류");
      inviteModal.value.joining = false;
    }
  }
}

function dismissInvite() {
  inviteModal.value.show = false;
  pendingInviteCode.value = null;
}

function openGroup(group) {
  selectedGroup.value = group;
  goTo("group-detail");
}

const showCreate = ref(false);
const newGroupName = ref("");
const newMemberCount = ref("");

function copyInviteCode(group) {
  const inviteCode = group?.inviteCode;
  if (!inviteCode) {
    showToast("error", "초대코드를 찾을 수 없습니다.");
    return;
  }

  const link = `${window.location.origin}?invite=${inviteCode}`;
  navigator.clipboard?.writeText(link).catch(() => {});
  showToast("success", "초대 링크를 복사했습니다.");
}

function parseInviteCode(input) {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";

  try {
    const parsedUrl = new URL(trimmed);
    const queryCode =
      parsedUrl.searchParams.get("invite") ||
      parsedUrl.searchParams.get("inviteCode");
    if (queryCode) return queryCode.trim();
  } catch {
    // URL 형식이 아니면 코드 직접 입력으로 처리
  }

  return trimmed;
}

async function createGroup() {
  const name = newGroupName.value.trim();
  if (!name) return;
  try {
    await axios.post("/api/teams", {
      teamName: name,
      capacity: parseInt(newMemberCount.value) || 10,
    });
    await fetchMyTeams();
    newGroupName.value = "";
    newMemberCount.value = "";
    showCreate.value = false;
  } catch (e) {
    showToast("error", "그룹 생성 실패", e.response?.data || "서버 오류");
  }
}

async function joinByInvite() {
  const inviteCode = parseInviteCode(inviteInput.value);
  if (!inviteCode) {
    showToast("error", "초대 링크 또는 코드를 입력해 주세요.");
    return;
  }

  try {
    await axios.post("/api/teams/join", { inviteCode });
    await fetchMyTeams();
    inviteInput.value = "";
    showJoin.value = false;
    showToast("success", "그룹 참여 완료!");
  } catch (e) {
    showToast("error", "참여 실패", e.response?.data || "서버 오류");
  }
}
</script>

<template>
  <div class="screen">
    <!-- Group list -->
    <template v-if="!showCreate">
      <header class="header">
        <div class="title">그룹</div>
        <button
          type="button"
          class="join-link-btn"
          @click="showJoin = true"
          aria-label="초대 링크로 참여"
        >
          링크 참여
        </button>
        <button
          type="button"
          class="add-btn"
          @click="showCreate = true"
          aria-label="그룹 만들기"
        >
          <i class="ti ti-plus"></i>
        </button>
      </header>

      <main class="content">
        <div v-if="loading" class="loading">불러오는 중...</div>
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
            <button class="share-btn" @click.stop="copyInviteCode(group)">
              공유하기
            </button>
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
          그룹을 만들면 친구들을 초대하고 식단을 함께 공유할 수 있어요!
        </div>
        <div class="form-actions">
          <button class="create-btn" @click="createGroup">그룹 만들기</button>
        </div>
      </main>
    </template>

    <div v-if="showJoin" class="join-overlay" @click.self="showJoin = false">
      <div class="join-modal">
        <h3>초대 링크로 참여</h3>
        <input
          v-model="inviteInput"
          class="form-input"
          placeholder="https://yamyamlog.site?invite=XXXXXXXXXX"
        />
        <div class="join-actions">
          <button type="button" class="ghost-btn" @click="showJoin = false">
            취소
          </button>
          <button type="button" class="create-btn" @click="joinByInvite">
            참여하기
          </button>
        </div>
      </div>
    </div>

    <!-- 초대 수락 모달 -->
    <div v-if="inviteModal.show" class="invite-overlay">
      <div class="invite-card">
        <div class="invite-icon">👥</div>
        <div class="invite-label">그룹 초대</div>
        <div class="invite-team-name">{{ inviteModal.teamName }}</div>
        <div class="invite-meta">현재 {{ inviteModal.memberCount }}명 / 최대 {{ inviteModal.capacity }}명</div>
        <div class="invite-actions">
          <button class="ghost-btn" @click="dismissInvite">거절</button>
          <button class="create-btn invite-accept-btn" @click="acceptInvite" :disabled="inviteModal.joining">
            {{ inviteModal.joining ? "참여 중..." : "초대 수락하기" }}
          </button>
        </div>
      </div>
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

.join-link-btn {
  height: 36px;
  border-radius: 999px;
  border: 1px solid var(--accent-border);
  background: var(--accent-light);
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
  padding: 0 12px;
  margin-right: 8px;
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

.loading {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
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

.join-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 2000;
}

.join-modal {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 14px;
  padding: 18px;
  box-sizing: border-box;
}

.join-modal h3 {
  margin: 0 0 12px;
  font-size: 16px;
}

.join-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.ghost-btn {
  border: 1px solid var(--border-medium);
  background: #fff;
  color: var(--text-secondary);
  border-radius: 10px;
  padding: 10px 14px;
}

/* 초대 수락 모달 */
.invite-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 2000;
}
.invite-card {
  width: 100%;
  max-width: 360px;
  background: #fff;
  border-radius: 20px;
  padding: 32px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}
.invite-icon {
  font-size: 48px;
  line-height: 1;
  margin-bottom: 4px;
}
.invite-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--accent, #e8909e);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}
.invite-team-name {
  font-size: 22px;
  font-weight: 800;
  color: #000;
  margin-top: 2px;
}
.invite-meta {
  font-size: 13px;
  color: var(--text-secondary, #888);
  margin-bottom: 8px;
}
.invite-actions {
  display: flex;
  gap: 10px;
  width: 100%;
  margin-top: 8px;
}
.invite-actions .ghost-btn {
  flex: 1;
}
.invite-accept-btn {
  flex: 2;
}
.invite-accept-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

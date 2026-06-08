<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-window">
      <h3 class="modal-title">동영상 업로드</h3>
      <form @submit.prevent="handleUpload">
        <div class="form-group">
          <label>대상 팀 선택</label>
          <select v-model="selectedTeamId" required class="modal-select">
            <option value="" disabled>팀을 선택해주세요</option>
            <option v-for="team in teams" :key="team.id" :value="team.id">
              {{ team.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>동영상 파일</label>
          <input type="file" accept="video/*" @change="onFileChange" required />
        </div>
        <div class="modal-actions">
          <button type="button" @click="$emit('close')" class="btn-cancel">
            취소
          </button>
          <button type="submit" class="btn-submit">업로드</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

defineProps({ teams: Array });
const emit = defineEmits(["close", "upload"]);

const selectedTeamId = ref("");
const videoFile = ref(null);

const onFileChange = (e) => {
  if (e.target.files.length > 0) videoFile.value = e.target.files[0];
};

const handleUpload = () => {
  emit("upload", { teamId: selectedTeamId.value, file: videoFile.value });
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-window {
  background: white;
  padding: 24px;
  border-radius: 6px;
  width: 100%;
  max-width: 360px;
}
.modal-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
.modal-select {
  padding: 10px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}
.btn-cancel {
  padding: 8px 14px;
  background: #eee;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn-submit {
  padding: 8px 14px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>

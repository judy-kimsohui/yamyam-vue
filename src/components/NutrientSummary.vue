<template>
  <div class="summary-card">
    <div class="card-title">오늘 영양 섭취 실시간 현황</div>

    <div class="calorie-row">
      <div class="cal-block">
        <span class="lbl">현재 총 섭취량</span>
        <span class="val black"
          >{{ Math.round(summary?.totalCalories || 0) }}
          <small>kcal</small></span
        >
      </div>
      <div class="cal-sep">/</div>
      <div class="cal-block">
        <span class="lbl">일일 목표 권장량</span>
        <span class="val gray"
          >{{ Math.round(goal?.targetCalories || 2000) }} kcal</span
        >
      </div>
    </div>

    <div class="bars-container">
      <div class="bar-item">
        <div class="bar-meta">
          <span class="nt-lbl font-c">탄수화물</span>
          <span class="nt-val"
            >{{ Math.round(summary?.totalCarbs || 0) }}g /
            {{ Math.round(goal?.targetCarbs || 250) }}g</span
          >
        </div>
        <div class="track">
          <div
            class="fill bg-c"
            :style="{
              width: getPercent(summary?.totalCarbs, goal?.targetCarbs) + '%',
            }"
          ></div>
        </div>
      </div>

      <div class="bar-item">
        <div class="bar-meta">
          <span class="nt-lbl font-p">단백질</span>
          <span class="nt-val"
            >{{ Math.round(summary?.totalProtein || 0) }}g /
            {{ Math.round(goal?.targetProtein || 150) }}g</span
          >
        </div>
        <div class="track">
          <div
            class="fill bg-p"
            :style="{
              width:
                getPercent(summary?.totalProtein, goal?.targetProtein) + '%',
            }"
          ></div>
        </div>
      </div>

      <div class="bar-item">
        <div class="bar-meta">
          <span class="nt-lbl font-f">지방</span>
          <span class="nt-val"
            >{{ Math.round(summary?.totalFat || 0) }}g /
            {{ Math.round(goal?.targetFat || 50) }}g</span
          >
        </div>
        <div class="track">
          <div
            class="fill bg-f"
            :style="{
              width: getPercent(summary?.totalFat, goal?.targetFat) + '%',
            }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  goal: { type: Object, required: true },
  summary: { type: Object, required: true },
});

function getPercent(val, target) {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((val / target) * 100));
}
</script>

<style scoped>
.summary-card {
  background: #fff;
  padding: 20px;
  border-radius: 14px;
  border: 1px solid #e5e5e5;
  margin-bottom: 12px;
}
.card-title {
  font-size: 11px;
  font-weight: 700;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
}
.calorie-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f5f5f5;
}
.cal-block {
  display: flex;
  flex-direction: column;
}
.cal-block .lbl {
  font-size: 10px;
  color: #aaa;
  font-weight: 600;
  margin-bottom: 2px;
}
.cal-block .val {
  font-size: 22px;
  font-weight: 800;
}
.cal-block .val small {
  font-size: 13px;
  font-weight: 600;
}
.cal-block .val.black {
  color: #000;
}
.cal-block .val.gray {
  color: #666;
  font-size: 15px;
  font-weight: 700;
}
.cal-sep {
  font-size: 18px;
  color: #e5e5e5;
}
.bars-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.bar-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.bar-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
}
.nt-lbl {
  font-weight: 700;
}
.nt-val {
  color: #666;
  font-size: 11px;
}
.track {
  width: 100%;
  height: 6px;
  background: #f0f0f0;
  border-radius: 99px;
  overflow: hidden;
}
.fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.3s ease;
}
.font-c {
  color: #2f80ed;
}
.font-p {
  color: #22c55e;
}
.font-f {
  color: #b78306;
}
.bg-c {
  background: #2f80ed;
}
.bg-p {
  background: #22c55e;
}
.bg-f {
  background: #b78306;
}
</style>

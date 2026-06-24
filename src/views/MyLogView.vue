<template>
  <div class="mylog-container">
    <!-- ==============================================
         모바일 레이아웃 (< 768px)
         ============================================== -->
    <main v-if="isMobile" class="scroll-body form-fade">
      <!-- 1. 달력 패널 -->
      <section class="mylog-cal-wrap">
        <div class="cal-nav">
          <button class="cal-arrow" @click="prevMonth">
            <i class="ti ti-chevron-left"></i>
          </button>
          <span class="cal-month">{{ monthLabel }}</span>
          <button class="cal-arrow" @click="nextMonth">
            <i class="ti ti-chevron-right"></i>
          </button>
        </div>
        <div class="cal-grid">
          <div
            v-for="(cell, i) in calendarCells"
            :key="i"
            class="cal-cell"
            :class="{ selected: cell === selectedDay }"
            @click="cell && selectDay(cell)"
          >
            <span class="cal-num">{{ cell }}</span>
            <span v-if="hasRecordInMonth(cell)" class="cal-dot"></span>
          </div>
        </div>
      </section>

      <!-- 2. 데일리 영양 인사이트 대시보드 (맞춤형 데이터 연동 완료) -->
      <section class="daily-insight-panel">
        <div class="insight-header">
          <h2 class="insight-title">
            {{ currentMonth + 1 }}월 {{ selectedDay }}일 영양 리포트
          </h2>
          <span class="insight-score" v-if="dailyTotals.calories > 0">
            목표 달성률
            <strong
              >{{
                Math.round((dailyTotals.calories / targets.calories) * 100)
              }}%</strong
            >
          </span>
        </div>

        <div class="macro-cards">
          <!-- 칼로리 메인 카드 -->
          <div class="macro-card kcal-card">
            <div class="macro-label">총 섭취 칼로리</div>
            <div class="macro-value">
              <span class="current">{{
                Math.round(dailyTotals.calories)
              }}</span>
              <span class="target">/ {{ targets.calories }} kcal</span>
            </div>
            <div class="progress-bg">
              <div
                class="progress-fill kcal"
                :style="{
                  width: percent(dailyTotals.calories, targets.calories) + '%',
                }"
              ></div>
            </div>
          </div>
          <!-- 탄단지 서브 카드 -->
          <div class="macro-sub-grid">
            <div class="macro-card">
              <div class="macro-label">탄수화물</div>
              <div class="macro-value small">
                <span class="current">{{ Math.round(dailyTotals.carbs) }}</span
                ><span class="target">/{{ targets.carbs }}g</span>
              </div>
              <div class="progress-bg">
                <div
                  class="progress-fill carbs"
                  :style="{
                    width: percent(dailyTotals.carbs, targets.carbs) + '%',
                  }"
                ></div>
              </div>
            </div>
            <div class="macro-card">
              <div class="macro-label">단백질</div>
              <div class="macro-value small">
                <span class="current">{{
                  Math.round(dailyTotals.protein)
                }}</span
                ><span class="target">/{{ targets.protein }}g</span>
              </div>
              <div class="progress-bg">
                <div
                  class="progress-fill protein"
                  :style="{
                    width: percent(dailyTotals.protein, targets.protein) + '%',
                  }"
                ></div>
              </div>
            </div>
            <div class="macro-card">
              <div class="macro-label">지방</div>
              <div class="macro-value small">
                <span class="current">{{ Math.round(dailyTotals.fat) }}</span
                ><span class="target">/{{ targets.fat }}g</span>
              </div>
              <div class="progress-bg">
                <div
                  class="progress-fill fat"
                  :style="{
                    width: percent(dailyTotals.fat, targets.fat) + '%',
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
        <button
          v-if="!dailyAiComment"
          @click="requestDailyEvaluation"
          class="eval-btn"
        >
          오늘 하루 식단 AI 평가받기 ✨
        </button>
        <!-- AI 피드백 영역 -->
        <div class="ai-feedback-card" v-if="dailyAiComment">
          <div class="ai-header">
            <span class="ai-badge"><i class="ti ti-robot"></i> AI 코멘트</span>
          </div>
          <p class="ai-text">{{ dailyAiComment }}</p>
        </div>
      </section>

      <!-- 3. 모바일 환경 하단 탭형 차트 요약 (맞춤형 목표선 적용) -->
      <section class="daily-insight-panel trend-mobile-section">
        <div class="trend-ctrl-header">
          <span class="trend-sec-title">연속 영양 분석 추이</span>
          <div class="trend-period-tabs">
            <button
              v-for="p in ['day', 'week', 'month']"
              :key="p"
              :class="{ active: trendPeriod === p }"
              @click="trendPeriod = p"
            >
              {{ p === "day" ? "일" : p === "week" ? "주" : "월" }}
            </button>
          </div>
        </div>
        <div class="mobile-chart-box">
          <div class="chart-mini-label">📈 칼로리 섭취 및 목표 매핑 가이드</div>
          <div class="svg-chart-container">
            <svg class="insight-svg" viewBox="0 0 300 120">
              <rect
                x="0"
                y="0"
                width="300"
                height="120"
                fill="#fafafa"
                rx="6"
              />
              <!-- 맞춤형 권장 칼로리 목표선 -->
              <line
                x1="10"
                :y1="getSvgY(targets.calories, 'calories')"
                x2="290"
                :y2="getSvgY(targets.calories, 'calories')"
                stroke="#fda4af"
                stroke-dasharray="4 3"
                stroke-width="1.5"
              />

              <g v-for="(pt, idx) in aiTrendData.calories" :key="idx">
                <rect
                  :x="15 + idx * 40"
                  :y="getSvgY(pt.value, 'calories')"
                  width="20"
                  :height="Math.max(110 - getSvgY(pt.value, 'calories'), 2)"
                  :fill="pt.isForecast ? '#fbcfe8' : '#e8909e'"
                  rx="3"
                />
                <text
                  :x="25 + idx * 40"
                  y="118"
                  font-size="8"
                  text-anchor="middle"
                  fill="#666"
                >
                  {{ pt.label }}
                </text>
              </g>
              <text
                v-if="
                  !aiTrendData.calories || aiTrendData.calories.length === 0
                "
                x="150"
                y="60"
                font-size="10"
                text-anchor="middle"
                fill="#94a3b8"
              >
                데이터를 불러오는 중입니다...
              </text>
            </svg>
          </div>
        </div>
      </section>

      <!-- 4. 식단 영상 리스트 -->
      <section class="video-list-section">
        <div class="mylog-day-header">
          <span class="mylog-day-title"
            >식단 기록 ({{ dayVideos.length }})</span
          >
          <div class="mylog-filter-bar">
            <button
              v-for="f in mealFilters"
              :key="f.key"
              class="mylog-filter-btn"
              :class="{ active: activeFilter === f.key }"
              @click="activeFilter = f.key"
            >
              {{ f.label }}
            </button>
          </div>
        </div>

        <div v-if="loadingDayVideos" class="mylog-empty">
          데이터를 불러오는 중...
        </div>
        <div v-else-if="filteredDayVideos.length === 0" class="mylog-empty">
          <i class="ti ti-video-off" style="font-size: 28px; color: #ccc"></i>
          <p>이 날 기록된 식단이 없어요</p>
        </div>
        <div v-else class="mylog-list-mobile">
          <div v-for="v in filteredDayVideos" :key="v.id" class="mylog-card">
            <div class="video-overlay-wrap">
              <video
                :src="v.videoUrl"
                v-lazy-video
                loop
                muted
                playsinline
                preload="metadata"
                class="mylog-video"
              ></video>
              <div class="macro-tags-overlay" v-if="v.calories">
                <span class="m-tag c">탄 {{ Math.round(v.carbs || 0) }}g</span>
                <span class="m-tag p"
                  >단 {{ Math.round(v.protein || 0) }}g</span
                >
                <span class="m-tag f">지 {{ Math.round(v.fat || 0) }}g</span>
                <span class="m-tag k"
                  >{{ Math.round(v.calories || 0) }}kcal</span
                >
              </div>
            </div>
            <div class="video-info-strip">
              <span class="mylog-vid-tag">{{ mealLabel(v.mealType) }}</span>
              <span class="vid-desc" v-if="v.description">{{
                v.description
              }}</span>
              <span class="vid-desc empty" v-else>기록된 메모가 없습니다.</span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- ==============================================
         태블릿 / 데스크탑 와이드 레이아웃 (>= 768px)
         ============================================== -->
    <div v-else class="wide-split form-fade">
      <aside class="wide-cal-panel">
        <div class="cal-nav">
          <button class="cal-arrow" @click="prevMonth">
            <i class="ti ti-chevron-left"></i>
          </button>
          <span class="cal-month">{{ monthLabel }}</span>
          <button class="cal-arrow" @click="nextMonth">
            <i class="ti ti-chevron-right"></i>
          </button>
        </div>
        <div class="cal-weekdays">
          <span
            v-for="d in ['일', '월', '화', '수', '목', '금', '토']"
            :key="d"
            >{{ d }}</span
          >
        </div>
        <div class="cal-grid">
          <div
            v-for="(cell, i) in calendarCells"
            :key="i"
            class="cal-cell"
            :class="{
              empty: !cell,
              selected: cell === selectedDay,
              today:
                cell === todayDate &&
                currentMonth === todayMonth &&
                currentYear === todayYear,
              'has-record': hasRecordInMonth(cell),
            }"
            @click="cell && selectDay(cell)"
          >
            <template v-if="cell">
              <span class="cal-num">{{ cell }}</span>
              <span v-if="hasRecordInMonth(cell)" class="cal-dot"></span>
            </template>
          </div>
        </div>

        <div class="month-stats">
          <div class="month-stats-title">이번 달 요약 인사이트 (AI)</div>
          <div class="month-stats-grid">
            <div class="mstat">
              <div class="mstat-icon"><i class="ti ti-flame"></i></div>
              <div class="mstat-content">
                <div class="mstat-val">
                  {{ aiSummaryStats.avgCalories }} kcal
                </div>
                <div class="mstat-lbl">일평균 섭취량</div>
              </div>
            </div>
            <div class="mstat">
              <div class="mstat-icon"><i class="ti ti-checkup-list"></i></div>
              <div class="mstat-content">
                <div class="mstat-val">
                  {{ aiSummaryStats.recordedDays }} 일
                </div>
                <div class="mstat-lbl">총 기록 일수</div>
              </div>
            </div>
          </div>
        </div>

        <div class="month-stats trend-analysis-section">
          <div class="trend-ctrl-header">
            <div class="trend-section-headline">연속 데이터 피드백</div>
            <div class="trend-period-tabs">
              <button
                :class="{ active: trendPeriod === 'day' }"
                @click="trendPeriod = 'day'"
              >
                일
              </button>
              <button
                :class="{ active: trendPeriod === 'week' }"
                @click="trendPeriod = 'week'"
              >
                주
              </button>
              <button
                :class="{ active: trendPeriod === 'month' }"
                @click="trendPeriod = 'month'"
              >
                월
              </button>
            </div>
          </div>

          <div class="trend-legend-info">
            <span class="leg-item"><span class="leg-dot real"></span>실제</span>
            <span class="leg-item"
              ><span class="leg-dot forecast"></span>AI 권장 제안</span
            >
            <span class="leg-item"
              ><span class="leg-line-dashed"></span>목표선</span
            >
          </div>

          <div class="trend-micro-charts-scroll">
            <div class="trend-chart-card">
              <div class="tchart-meta">
                <span class="tchart-lbl">🔥 에너지 총량 (Calories)</span>
                <span class="tchart-value-summary"
                  >{{ Math.round(dailyTotals.calories) }} /
                  {{ targets.calories }} kcal</span
                >
              </div>
              <svg class="trend-mini-svg" viewBox="0 0 280 70">
                <rect width="280" height="70" fill="#f8fafc" rx="6" />
                <line
                  x1="5"
                  :y1="getSvgY(targets.calories, 'calories')"
                  x2="275"
                  :y2="getSvgY(targets.calories, 'calories')"
                  stroke="#ef4444"
                  stroke-dasharray="3 2"
                  stroke-width="1"
                />
                <g v-for="(pt, i) in aiTrendData.calories" :key="i">
                  <rect
                    :x="12 + i * 38"
                    :y="getSvgY(pt.value, 'calories')"
                    width="16"
                    :height="Math.max(62 - getSvgY(pt.value, 'calories'), 2)"
                    :fill="pt.isForecast ? '#fbcfe8' : '#e8909e'"
                    rx="2"
                  />
                  <text
                    :x="20 + i * 38"
                    y="68"
                    font-size="7"
                    text-anchor="middle"
                    fill="#64748b"
                  >
                    {{ pt.label }}
                  </text>
                </g>
              </svg>
            </div>

            <div class="trend-chart-card">
              <div class="tchart-meta">
                <span class="tchart-lbl">🍞 탄수화물 (Carbs)</span>
                <span class="tchart-value-summary"
                  >{{ Math.round(dailyTotals.carbs) }}g /
                  {{ targets.carbs }}g</span
                >
              </div>
              <svg class="trend-mini-svg" viewBox="0 0 280 70">
                <rect width="280" height="70" fill="#f8fafc" rx="6" />
                <line
                  x1="5"
                  :y1="getSvgY(targets.carbs, 'carbs')"
                  x2="275"
                  :y2="getSvgY(targets.carbs, 'carbs')"
                  stroke="#3b82f6"
                  stroke-dasharray="3 2"
                  stroke-width="1"
                />
                <g v-for="(pt, i) in aiTrendData.carbs" :key="i">
                  <rect
                    :x="12 + i * 38"
                    :y="getSvgY(pt.value, 'carbs')"
                    width="16"
                    :height="Math.max(62 - getSvgY(pt.value, 'carbs'), 2)"
                    :fill="pt.isForecast ? '#dbeafe' : '#60a5fa'"
                    rx="2"
                  />
                  <text
                    :x="20 + i * 38"
                    y="68"
                    font-size="7"
                    text-anchor="middle"
                    fill="#64748b"
                  >
                    {{ pt.label }}
                  </text>
                </g>
              </svg>
            </div>

            <div class="trend-chart-card">
              <div class="tchart-meta">
                <span class="tchart-lbl">🥩 단백질 (Protein)</span>
                <span class="tchart-value-summary"
                  >{{ Math.round(dailyTotals.protein) }}g /
                  {{ targets.protein }}g</span
                >
              </div>
              <svg class="trend-mini-svg" viewBox="0 0 280 70">
                <rect width="280" height="70" fill="#f8fafc" rx="6" />
                <line
                  x1="5"
                  :y1="getSvgY(targets.protein, 'protein')"
                  x2="275"
                  :y2="getSvgY(targets.protein, 'protein')"
                  stroke="#10b981"
                  stroke-dasharray="3 2"
                  stroke-width="1"
                />
                <g v-for="(pt, i) in aiTrendData.protein" :key="i">
                  <rect
                    :x="12 + i * 38"
                    :y="getSvgY(pt.value, 'protein')"
                    width="16"
                    :height="Math.max(62 - getSvgY(pt.value, 'protein'), 2)"
                    :fill="pt.isForecast ? '#d1fae5' : '#34d399'"
                    rx="2"
                  />
                  <text
                    :x="20 + i * 38"
                    y="68"
                    font-size="7"
                    text-anchor="middle"
                    fill="#64748b"
                  >
                    {{ pt.label }}
                  </text>
                </g>
              </svg>
            </div>

            <div class="trend-chart-card">
              <div class="tchart-meta">
                <span class="tchart-lbl">🥑 지방 (Fat)</span>
                <span class="tchart-value-summary"
                  >{{ Math.round(dailyTotals.fat) }}g / {{ targets.fat }}g</span
                >
              </div>
              <svg class="trend-mini-svg" viewBox="0 0 280 70">
                <rect width="280" height="70" fill="#f8fafc" rx="6" />
                <line
                  x1="5"
                  :y1="getSvgY(targets.fat, 'fat')"
                  x2="275"
                  :y2="getSvgY(targets.fat, 'fat')"
                  stroke="#f59e0b"
                  stroke-dasharray="3 2"
                  stroke-width="1"
                />
                <g v-for="(pt, i) in aiTrendData.fat" :key="i">
                  <rect
                    :x="12 + i * 38"
                    :y="getSvgY(pt.value, 'fat')"
                    width="16"
                    :height="Math.max(62 - getSvgY(pt.value, 'fat'), 2)"
                    :fill="pt.isForecast ? '#fef3c7' : '#fbbf24'"
                    rx="2"
                  />
                  <text
                    :x="20 + i * 38"
                    y="68"
                    font-size="7"
                    text-anchor="middle"
                    fill="#64748b"
                  >
                    {{ pt.label }}
                  </text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </aside>

      <main class="wide-video-panel">
        <div class="desk-insight-wrap">
          <h2 class="insight-title">
            {{ currentMonth + 1 }}월 {{ selectedDay }}일 영양 리포트
          </h2>

          <div class="desk-macro-layout">
            <div class="macro-card desk-kcal">
              <div class="macro-label">총 칼로리</div>
              <div class="macro-value">
                <span class="current">{{
                  Math.round(dailyTotals.calories)
                }}</span>
                <span class="target">/ {{ targets.calories }} kcal</span>
              </div>
              <div class="progress-bg">
                <div
                  class="progress-fill kcal"
                  :style="{
                    width:
                      percent(dailyTotals.calories, targets.calories) + '%',
                  }"
                ></div>
              </div>
            </div>

            <div class="desk-sub-macros">
              <div class="macro-card">
                <div class="macro-label">탄수화물</div>
                <div class="macro-value small">
                  <span class="current">{{
                    Math.round(dailyTotals.carbs)
                  }}</span
                  ><span class="target">/{{ targets.carbs }}g</span>
                </div>
                <div class="progress-bg">
                  <div
                    class="progress-fill carbs"
                    :style="{
                      width: percent(dailyTotals.carbs, targets.carbs) + '%',
                    }"
                  ></div>
                </div>
              </div>
              <div class="macro-card">
                <div class="macro-label">단백질</div>
                <div class="macro-value small">
                  <span class="current">{{
                    Math.round(dailyTotals.protein)
                  }}</span
                  ><span class="target">/{{ targets.protein }}g</span>
                </div>
                <div class="progress-bg">
                  <div
                    class="progress-fill protein"
                    :style="{
                      width:
                        percent(dailyTotals.protein, targets.protein) + '%',
                    }"
                  ></div>
                </div>
              </div>
              <div class="macro-card">
                <div class="macro-label">지방</div>
                <div class="macro-value small">
                  <span class="current">{{ Math.round(dailyTotals.fat) }}</span
                  ><span class="target">/{{ targets.fat }}g</span>
                </div>
                <div class="progress-bg">
                  <div
                    class="progress-fill fat"
                    :style="{
                      width: percent(dailyTotals.fat, targets.fat) + '%',
                    }"
                  ></div>
                </div>
              </div>
            </div>

            <div class="ai-feedback-card desk-ai" v-if="dailyAiComment">
              <div class="ai-header">
                <span class="ai-badge"
                  ><i class="ti ti-robot"></i> AI 종합 피드백</span
                >
              </div>
              <p class="ai-text">{{ dailyAiComment }}</p>
            </div>
            <div class="ai-feedback-card desk-ai empty" v-else>
              <i class="ti ti-robot-off"></i>
              <p>기록된 식단이 부족하여 AI 피드백이 없습니다.</p>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="mylog-day-header">
          <span class="mylog-day-title">식단 기록 갤러리</span>
          <div class="mylog-filter-bar">
            <button
              v-for="f in mealFilters"
              :key="f.key"
              class="mylog-filter-btn"
              :class="{ active: activeFilter === f.key }"
              @click="activeFilter = f.key"
            >
              {{ f.label }}
            </button>
          </div>
        </div>

        <div v-if="loadingDayVideos" class="mylog-empty">불러오는 중...</div>
        <div v-else-if="filteredDayVideos.length === 0" class="mylog-empty">
          <i class="ti ti-video-off" style="font-size: 36px; color: #ccc"></i>
          <p>이 날 기록된 식단이 없어요</p>
        </div>
        <div v-else :class="isWide ? 'mylog-grid-3' : 'mylog-grid-2'">
          <div v-for="v in filteredDayVideos" :key="v.id" class="mylog-card">
            <div class="video-overlay-wrap">
              <video
                :src="v.videoUrl"
                v-lazy-video
                loop
                muted
                playsinline
                preload="metadata"
                class="mylog-video"
              ></video>
              <div class="macro-tags-overlay" v-if="v.calories">
                <span class="m-tag c">탄{{ Math.round(v.carbs || 0) }}</span>
                <span class="m-tag p">단{{ Math.round(v.protein || 0) }}</span>
                <span class="m-tag f">지{{ Math.round(v.fat || 0) }}</span>
                <span class="m-tag k">{{ Math.round(v.calories || 0) }}</span>
              </div>
            </div>
            <div class="video-info-strip desk">
              <span class="mylog-vid-tag">{{ mealLabel(v.mealType) }}</span>
              <span class="vid-desc" v-if="v.description">{{
                v.description
              }}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject, watch } from "vue";
import axios from "axios";

const auth = inject("auth");

// 반응형 핸들러
const isMobile = ref(window.innerWidth < 768);
const isWide = ref(window.innerWidth >= 1200);
const onResize = () => {
  isMobile.value = window.innerWidth < 768;
  isWide.value = window.innerWidth >= 1200;
};
window.addEventListener("resize", onResize);
onUnmounted(() => window.removeEventListener("resize", onResize));

// 식사 필터 & 데이터
const mealFilters = [
  { key: "all", label: "전체" },
  { key: "BREAKFAST", label: "아침" },
  { key: "LUNCH", label: "점심" },
  { key: "DINNER", label: "저녁" },
];
const activeFilter = ref("all");
const dayVideos = ref([]);
const loadingDayVideos = ref(false);

const trendPeriod = ref("week");

// 달력 날짜 로직
const today = new Date();
const todayDate = today.getDate();
const todayMonth = today.getMonth();
const todayYear = today.getFullYear();
const currentYear = ref(today.getFullYear());
const currentMonth = ref(today.getMonth());
const selectedDay = ref(today.getDate());

const monthLabel = computed(
  () => `${currentYear.value}년 ${currentMonth.value + 1}월`,
);

const calendarCells = computed(() => {
  const total = new Date(
    currentYear.value,
    currentMonth.value + 1,
    0,
  ).getDate();
  const offset = new Date(currentYear.value, currentMonth.value, 1).getDay();
  return [
    ...Array(offset).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
});

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else currentMonth.value--;
}
function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else currentMonth.value++;
}
function toDateStr(d, y, m) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// ==============================================
// 🎯 핵심 추가 로직: 프로필 로딩 및 맞춤형 권장량 계산 (Mifflin-St Jeor)
// ==============================================

// MyLogView.vue 내에 추가할 함수
async function requestDailyEvaluation() {
  loadingDayVideos.value = true; // 평가 중 로딩 표시
  try {
    const dateStr = toDateStr(
      selectedDay.value,
      currentYear.value,
      currentMonth.value,
    );
    const res = await axios.post(
      `/api/logs/daily/evaluate?date=${dateStr}`,
      null,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, // 토큰 확인 필요
      },
    );

    // AI 피드백을 상태 변수에 저장
    const aiData = JSON.parse(res.data.aiComment);
    // 이제 화면에 aiData.summary 등이 뿌려집니다.
  } catch (e) {
    alert("평가 생성 실패: " + e.message);
  } finally {
    loadingDayVideos.value = false;
  }
}

// 1. 유저 상세 프로필을 담을 반응형 객체
const myDetailedProfile = ref(null);

// 2. 백엔드에서 내 프로필 정보를 불러오는 함수
async function loadMyProfile() {
  try {
    const res = await axios.get("/api/users/profile");
    myDetailedProfile.value = res.data;
  } catch (error) {
    console.error("사용자 프로필 로드 실패. 기본값으로 계산합니다.", error);
  }
}

// 3. 불러온 프로필 기반으로 자동 계산되는 '나만의 목표 영양치'
const targets = computed(() => {
  const user = myDetailedProfile.value;

  // 프로필이 아직 없거나 정보 부족 시 성인 평균 권장량 부여
  if (!user || !user.height || !user.weight || !user.age) {
    return { calories: 2200, carbs: 275, protein: 110, fat: 60 };
  }

  // Java DTO 네이밍 컨벤션 매핑 (스네이크 및 카멜 방어)
  const w = user.weight;
  const h = user.height;
  const a = user.age;
  const gender = user.gender;
  const goalW = user.goal_weight || user.goalWeight || w;

  // 기초 대사량 (BMR) - 남여 구분 보정
  let bmr = 10 * w + 6.25 * h - 5 * a;
  bmr += gender === "MALE" || gender === "M" ? 5 : -161;

  // 활동 대사량 (TDEE) - 보통 활동 1.375
  let tdee = bmr * 1.375;

  let targetKcal = tdee;
  let carbRatio = 0.5; // 탄수화물 50%
  let proteinRatio = 0.3; // 단백질 30%
  let fatRatio = 0.2; // 지방 20%

  // 다이어트 (몸무게 > 목표 체중)
  if (w > goalW + 0.5) {
    targetKcal -= 500;
    carbRatio = 0.4;
    proteinRatio = 0.4;
  }
  // 벌크업 (몸무게 < 목표 체중)
  else if (w < goalW - 0.5) {
    targetKcal += 500;
    carbRatio = 0.5;
    proteinRatio = 0.25;
    fatRatio = 0.25;
  }

  // 너무 낮은 위험 칼로리선 방어
  if (targetKcal < bmr) targetKcal = bmr;

  // 계산된 비율을 g(그램)으로 환산하여 리턴
  return {
    calories: Math.round(targetKcal),
    carbs: Math.round((targetKcal * carbRatio) / 4),
    protein: Math.round((targetKcal * proteinRatio) / 4),
    fat: Math.round((targetKcal * fatRatio) / 9),
  };
});

// ==============================================
// 🎯 일일 비디오 및 영양 데이터 패치
// ==============================================
async function selectDay(d) {
  selectedDay.value = d;
  loadingDayVideos.value = true;
  const dateStr = toDateStr(d, currentYear.value, currentMonth.value);

  try {
    const res = await axios.post("/graphql", {
      query: `query GetMyVideos($userId: ID, $date: String!) {
        videos(userId: $userId, date: $date) {
          id userId uploaderNickName teamId mealType mealDate videoUrl
          description calories carbs protein fat aiComment likeCount liked createdAt status
        }
      }`,
      variables: { userId: String(auth.loginUser.value?.id), date: dateStr },
    });
    dayVideos.value = res.data?.data?.videos ?? [];

    // 차트 트렌드 데이터 최신화
    await fetchAiIntegratedData(dateStr, trendPeriod.value);
  } catch (err) {
    console.error(err);
    dayVideos.value = [];
  } finally {
    loadingDayVideos.value = false;
  }
}

// 1. 월간 AI 통계 요약 (임시값)
const aiSummaryStats = ref({ avgCalories: 0, recordedDays: 0 });

// 2. AI 차트 트렌드 배열
const aiTrendData = ref({ calories: [], carbs: [], protein: [], fat: [] });

// 3. 백엔드 AI 분석 통합 API 호출 함수 (임시 방어 로직)
async function fetchAiIntegratedData(dateString, period) {
  // TODO: 백엔드 트렌드 API 연동 위치
  if (!aiTrendData.value.calories.length || period === "day") {
    aiTrendData.value = {
      calories: [
        {
          label: "오늘",
          value: dailyTotals.value.calories || 0,
          isForecast: false,
        },
      ],
      carbs: [
        {
          label: "오늘",
          value: dailyTotals.value.carbs || 0,
          isForecast: false,
        },
      ],
      protein: [
        {
          label: "오늘",
          value: dailyTotals.value.protein || 0,
          isForecast: false,
        },
      ],
      fat: [
        { label: "오늘", value: dailyTotals.value.fat || 0, isForecast: false },
      ],
    };
  }
}

watch(trendPeriod, async (newPeriod) => {
  const dateStr = toDateStr(
    selectedDay.value,
    currentYear.value,
    currentMonth.value,
  );
  await fetchAiIntegratedData(dateStr, newPeriod);
});

// UI 연산 헬퍼
const dailyTotals = computed(() => {
  return dayVideos.value.reduce(
    (acc, v) => {
      if (v.status === "DONE" || v.calories) {
        acc.calories += v.calories || 0;
        acc.carbs += v.carbs || 0;
        acc.protein += v.protein || 0;
        acc.fat += v.fat || 0;
      }
      return acc;
    },
    { calories: 0, carbs: 0, protein: 0, fat: 0 },
  );
});

const dailyAiComment = computed(() => {
  const comments = dayVideos.value
    .filter((v) => v.aiComment && v.aiComment.trim() !== "")
    .map((v) => v.aiComment);
  return comments.length > 0 ? comments[0] : null;
});

function percent(current, target) {
  if (!target) return 0;
  const p = (current / target) * 100;
  return p > 100 ? 100 : p;
}

// 차트 Y축 스케일링 동적 할당 (나의 타겟 칼로리에 맞춰 차트 높이가 조절됨)
function getSvgY(value, type) {
  if (value === undefined || value === null) value = 0;

  // 나의 목표치에 1.5배의 여유고도를 줘서 그래프가 예쁘게 그려지도록 동적 보정
  let maxDomain = 2000;
  if (type === "calories") maxDomain = targets.value.calories * 1.5;
  else if (type === "carbs") maxDomain = targets.value.carbs * 1.5;
  else if (type === "protein") maxDomain = targets.value.protein * 1.5;
  else if (type === "fat") maxDomain = targets.value.fat * 1.5;

  const chartHeight = 50;
  const paddingBottom = 60;
  return paddingBottom - (value / maxDomain) * chartHeight;
}

function hasRecordInMonth(day) {
  if (day === selectedDay.value && currentMonth.value === todayMonth)
    return dayVideos.value.length > 0;
  return false;
}

const filteredDayVideos = computed(() =>
  activeFilter.value === "all"
    ? dayVideos.value
    : dayVideos.value.filter((v) => v.mealType === activeFilter.value),
);
function mealLabel(key) {
  return { BREAKFAST: "아침", LUNCH: "점심", DINNER: "저녁" }[key] ?? key;
}

// ==============================================
// 🚀 앱 진입 시 실행 시퀀스 (프로필 먼저 가져온 뒤 데이터 조회)
// ==============================================
onMounted(async () => {
  await loadMyProfile(); // 1. 먼저 내 키, 몸무게 등 상세 정보 가져옴 -> targets 즉시 갱신
  selectDay(today.getDate()); // 2. 그 다음 오늘 날짜의 영상과 데이터를 가져와 차트를 그림
});
</script>

<style scoped>
/* =========================================================
   공통 기초 뼈대 아키텍처 구조 정의
   ========================================================= */
.mylog-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f8fafc;
}

.scroll-body {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 40px;
}

.wide-split {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.wide-cal-panel {
  width: 340px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e2e8f0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.wide-video-panel {
  flex: 1;
  overflow-y: auto;
  background: #f8fafc;
}

/* 달력 패널 랩 컨텐츠 코어 */
.mylog-cal-wrap {
  padding: 16px 20px;
  background: #fff;
  margin-bottom: 8px;
}
.cal-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.cal-month {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}
.cal-arrow {
  background: none;
  border: none;
  color: #64748b;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
}
.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
}
.cal-weekdays span {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
.cal-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.cal-cell.empty {
  cursor: default;
}
.cal-cell:not(.empty):hover {
  background: #f1f5f9;
}
.cal-cell.today {
  border: 1.5px solid #e8909e;
  color: #e8909e;
  font-weight: 700;
}
.cal-cell.selected {
  background: #e8909e;
  color: #fff;
  box-shadow: 0 4px 12px rgba(232, 144, 158, 0.35);
}
.cal-cell.selected .cal-num {
  color: #fff;
  font-weight: 700;
}
.cal-num {
  font-size: 13px;
  color: #334155;
  z-index: 2;
}
.cal-dot {
  width: 4.5px;
  height: 4.5px;
  background-color: #10b981;
  border-radius: 50%;
  position: absolute;
  bottom: 6px;
}
.cal-cell.selected .cal-dot {
  background-color: #fff;
}

/* 데일리 리포팅 인사이트 대시보드 스펙 */
.daily-insight-panel {
  background: #fff;
  padding: 20px;
  margin-bottom: 8px;
}
.insight-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
}
.insight-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.insight-score {
  font-size: 12px;
  color: #475569;
}
.insight-score strong {
  color: #e8909e;
  font-size: 14px;
}

.macro-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.macro-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px 16px;
}
.macro-sub-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.macro-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 4px;
}
.macro-value {
  margin-bottom: 10px;
}
.macro-value .current {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
}
.macro-value .target {
  font-size: 12px;
  color: #94a3b8;
  margin-left: 4px;
}
.macro-value.small .current {
  font-size: 16px;
}

.progress-bg {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
.progress-fill.kcal {
  background: linear-gradient(90deg, #ffb6c1, #e8909e);
}
.progress-fill.carbs {
  background: #3b82f6;
}
.progress-fill.protein {
  background: #10b981;
}
.progress-fill.fat {
  background: #f59e0b;
}

.ai-feedback-card {
  margin-top: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
}
.ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #0f172a;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
}
.ai-text {
  font-size: 13px;
  line-height: 1.6;
  color: #334155;
  margin: 0;
  word-break: keep-all;
}

/* =========================================================
   📊 시각화 트렌드 분석 차트 가젯 시스템 스타일링
   ========================================================= */
.trend-analysis-section {
  border-top: 1px solid #f1f5f9;
  margin-top: 20px;
  padding-top: 20px;
}
.trend-ctrl-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.trend-section-headline {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
}
.trend-period-tabs {
  display: flex;
  background: #f1f5f9;
  padding: 2.5px;
  border-radius: 8px;
}
.trend-period-tabs button {
  border: none;
  background: transparent;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}
.trend-period-tabs button.active {
  background: #fff;
  color: #0f172a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.trend-legend-info {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}
.leg-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #64748b;
  font-weight: 500;
}
.leg-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.leg-dot.real {
  background-color: #e8909e;
}
.leg-dot.forecast {
  background-color: #cbd5e1;
  border: 1px dashed #94a3b8;
}
.leg-line-dashed {
  width: 12px;
  height: 0px;
  border-top: 1.5px dashed #ef4444;
}

.trend-micro-charts-scroll {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.trend-chart-card {
  background: #fff;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  padding: 10px 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}
.tchart-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.tchart-lbl {
  font-size: 11px;
  font-weight: 700;
  color: #334155;
}
.tchart-value-summary {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
}
.trend-mini-svg {
  width: 100%;
  display: block;
  overflow: visible;
}

.trend-mobile-section {
  margin-top: 0;
  border-top: none;
}
.trend-sec-title {
  font-size: 14px;
  font-weight: 700;
  color: #111;
}
.mobile-chart-box {
  margin-top: 12px;
}
.chart-mini-label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}
.svg-chart-container {
  width: 100%;
  overflow: hidden;
  border-radius: 8px;
}
.insight-svg {
  width: 100%;
  display: block;
}

/* =========================================================
   식단 비디오 컨텐츠 구조 및 리스트 뷰 영역
   ========================================================= */
.video-list-section {
  padding: 0 16px 24px;
}
.mylog-day-header {
  display: flex;
  align-items: center;
  padding: 20px 0 12px;
  justify-content: space-between;
}
.wide-video-panel .mylog-day-header {
  padding: 32px 32px 16px;
}

.mylog-day-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}
.mylog-filter-bar {
  display: flex;
  gap: 6px;
}
.mylog-filter-btn {
  padding: 6px 14px;
  border-radius: 20px;
  background: #fff;
  border: 1px solid #e2e8f0;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}
.mylog-filter-btn.active {
  background: #0f172a;
  color: #fff;
  border-color: #0f172a;
}

.mylog-empty {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
  font-size: 14px;
}
.mylog-empty p {
  margin-top: 12px;
}

.mylog-list-mobile {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.mylog-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  border: 1px solid #e2e8f0;
}
.video-overlay-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: #0f172a;
}
.mylog-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.macro-tags-overlay {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  gap: 4px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(6px);
  padding: 5px 8px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.m-tag {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 4px;
  border-radius: 5px;
}
.m-tag.c {
  color: #1d4ed8;
  background: #dbeafe;
}
.m-tag.p {
  color: #065f46;
  background: #d1fae5;
}
.m-tag.f {
  color: #92400e;
  background: #fef3c7;
}
.m-tag.k {
  color: #0f172a;
  margin-left: 1px;
  font-family: monospace;
}

.video-info-strip {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.mylog-vid-tag {
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  flex-shrink: 0;
}
.vid-desc {
  font-size: 14px;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.vid-desc.empty {
  color: #94a3b8;
  font-style: italic;
}

.desk-insight-wrap {
  background: #fff;
  padding: 32px;
  border-bottom: 1px solid #e2e8f0;
}
.desk-macro-layout {
  display: flex;
  gap: 20px;
  margin-top: 24px;
}
.desk-kcal {
  flex: 1;
  min-width: 200px;
}
.desk-kcal .current {
  font-size: 28px;
}
.desk-sub-macros {
  flex: 2;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.desk-ai {
  flex: 2;
  margin-top: 0;
}
.desk-ai.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  border-style: dashed;
}

.divider {
  height: 8px;
  background: #f1f5f9;
}

.mylog-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 0 32px 40px;
}
.mylog-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 0 32px 40px;
}
.mylog-grid-2 .video-overlay-wrap,
.mylog-grid-3 .video-overlay-wrap {
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
}
.video-info-strip.desk {
  padding: 10px 4px;
}

.month-stats-title {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}
.month-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.mstat {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8fafc;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
}
.mstat-icon {
  width: 34px;
  height: 34px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #e8909e;
  box-shadow: 0 1.5px 4px rgba(0, 0, 0, 0.03);
}
.mstat-content {
  display: flex;
  flex-direction: column;
}
.mstat-val {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
}
.mstat-lbl {
  font-size: 10px;
  color: #64748b;
  font-weight: 600;
}

.form-fade {
  animation: slideInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

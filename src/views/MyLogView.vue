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
            <span v-if="getDayEmoji(cell)" class="cal-expr" v-html="getDayEmoji(cell)"></span>
            <span v-else-if="hasRecordInMonth(cell)" class="cal-dot"></span>
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
            <div class="macro-card macro-card--carbs">
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
            <div class="macro-card macro-card--protein">
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
            <div class="macro-card macro-card--fat">
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
          @click="requestDailyEvaluation(true)"
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
          <button
            v-if="dailyAiError"
            class="eval-btn retry-ai-btn"
            @click="requestDailyEvaluation(true)"
          >
            다시 AI 피드백 받기
          </button>
        </div>
      </section>

      <!-- 3. 모바일 연속 영양 분석 추이 (탄단지 포함 전체) -->
      <section class="daily-insight-panel trend-mobile-section">
        <div class="trend-ctrl-header">
          <span class="trend-sec-title">연속 영양 분석</span>
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

        <div class="trend-legend-info">
          <span class="leg-item"><span class="leg-dot real"></span>실제</span>
          <span class="leg-item"><span class="leg-dot forecast"></span>AI 권장</span>
          <span class="leg-item"><span class="leg-line-dashed"></span>목표선</span>
        </div>

        <div class="trend-chart-card">
          <div class="tchart-meta">
            <span class="tchart-lbl">🔥 칼로리</span>
            <span class="tchart-value-summary">{{ Math.round(dailyTotals.calories) }} / {{ targets.calories }} kcal</span>
          </div>
          <svg class="trend-mini-svg" viewBox="0 0 280 70">
            <rect width="280" height="70" fill="#f8fafc" rx="6" />
            <line x1="5" :y1="getSvgY(targets.calories, 'calories')" x2="275" :y2="getSvgY(targets.calories, 'calories')" stroke="#ef4444" stroke-dasharray="3 2" stroke-width="1" />
            <g v-for="(pt, i) in aiTrendData.calories" :key="i">
              <rect :x="barX(i, aiTrendData.calories.length)" :y="getSvgY(pt.value, 'calories')" :width="barWidth(aiTrendData.calories.length)" :height="Math.max(62 - getSvgY(pt.value, 'calories'), pt.hasRecord ? 2 : 0)" :fill="pt.isForecast ? '#fbcfe8' : '#e8909e'" rx="2" />
              <text :x="barCenterX(i, aiTrendData.calories.length)" y="68" font-size="7" text-anchor="middle" fill="#64748b">{{ pt.label }}</text>
            </g>
          </svg>
        </div>

        <div class="trend-chart-card">
          <div class="tchart-meta">
            <span class="tchart-lbl">🍞 탄수화물</span>
            <span class="tchart-value-summary">{{ Math.round(dailyTotals.carbs) }}g / {{ targets.carbs }}g</span>
          </div>
          <svg class="trend-mini-svg" viewBox="0 0 280 70">
            <rect width="280" height="70" fill="#f8fafc" rx="6" />
            <line x1="5" :y1="getSvgY(targets.carbs, 'carbs')" x2="275" :y2="getSvgY(targets.carbs, 'carbs')" stroke="#3b82f6" stroke-dasharray="3 2" stroke-width="1" />
            <g v-for="(pt, i) in aiTrendData.carbs" :key="i">
              <rect :x="barX(i, aiTrendData.carbs.length)" :y="getSvgY(pt.value, 'carbs')" :width="barWidth(aiTrendData.carbs.length)" :height="Math.max(62 - getSvgY(pt.value, 'carbs'), pt.hasRecord ? 2 : 0)" :fill="pt.isForecast ? '#dbeafe' : '#60a5fa'" rx="2" />
              <text :x="barCenterX(i, aiTrendData.carbs.length)" y="68" font-size="7" text-anchor="middle" fill="#64748b">{{ pt.label }}</text>
            </g>
          </svg>
        </div>

        <div class="trend-chart-card">
          <div class="tchart-meta">
            <span class="tchart-lbl">🥩 단백질</span>
            <span class="tchart-value-summary">{{ Math.round(dailyTotals.protein) }}g / {{ targets.protein }}g</span>
          </div>
          <svg class="trend-mini-svg" viewBox="0 0 280 70">
            <rect width="280" height="70" fill="#f8fafc" rx="6" />
            <line x1="5" :y1="getSvgY(targets.protein, 'protein')" x2="275" :y2="getSvgY(targets.protein, 'protein')" stroke="#10b981" stroke-dasharray="3 2" stroke-width="1" />
            <g v-for="(pt, i) in aiTrendData.protein" :key="i">
              <rect :x="barX(i, aiTrendData.protein.length)" :y="getSvgY(pt.value, 'protein')" :width="barWidth(aiTrendData.protein.length)" :height="Math.max(62 - getSvgY(pt.value, 'protein'), pt.hasRecord ? 2 : 0)" :fill="pt.isForecast ? '#d1fae5' : '#34d399'" rx="2" />
              <text :x="barCenterX(i, aiTrendData.protein.length)" y="68" font-size="7" text-anchor="middle" fill="#64748b">{{ pt.label }}</text>
            </g>
          </svg>
        </div>

        <div class="trend-chart-card">
          <div class="tchart-meta">
            <span class="tchart-lbl">🥑 지방</span>
            <span class="tchart-value-summary">{{ Math.round(dailyTotals.fat) }}g / {{ targets.fat }}g</span>
          </div>
          <svg class="trend-mini-svg" viewBox="0 0 280 70">
            <rect width="280" height="70" fill="#f8fafc" rx="6" />
            <line x1="5" :y1="getSvgY(targets.fat, 'fat')" x2="275" :y2="getSvgY(targets.fat, 'fat')" stroke="#f59e0b" stroke-dasharray="3 2" stroke-width="1" />
            <g v-for="(pt, i) in aiTrendData.fat" :key="i">
              <rect :x="barX(i, aiTrendData.fat.length)" :y="getSvgY(pt.value, 'fat')" :width="barWidth(aiTrendData.fat.length)" :height="Math.max(62 - getSvgY(pt.value, 'fat'), pt.hasRecord ? 2 : 0)" :fill="pt.isForecast ? '#fef3c7' : '#fbbf24'" rx="2" />
              <text :x="barCenterX(i, aiTrendData.fat.length)" y="68" font-size="7" text-anchor="middle" fill="#64748b">{{ pt.label }}</text>
            </g>
          </svg>
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
                muted
                playsinline
                preload="metadata"
                class="mylog-video"
              ></video>
              <span class="mylog-meal-badge">{{ mealLabel(v.mealType) }}</span>
              <div class="macro-tags-overlay" v-if="v.calories">
                <span class="m-tag c">탄 {{ Math.round(v.carbs || 0) }}g</span>
                <span class="m-tag p">단 {{ Math.round(v.protein || 0) }}g</span>
                <span class="m-tag f">지 {{ Math.round(v.fat || 0) }}g</span>
                <span class="m-tag k">{{ Math.round(v.calories || 0) }}kcal</span>
              </div>
            </div>
            <div class="mylog-card-footer">
              <span class="vid-desc" v-if="v.description">{{ v.description }}</span>
              <span class="vid-desc empty" v-else>메모가 없습니다.</span>
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

        <hr class="cal-divider" />
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
                    :x="barX(i, aiTrendData.calories.length)"
                    :y="getSvgY(pt.value, 'calories')"
                    :width="barWidth(aiTrendData.calories.length)"
                    :height="
                      Math.max(
                        62 - getSvgY(pt.value, 'calories'),
                        pt.hasRecord ? 2 : 0,
                      )
                    "
                    :fill="pt.isForecast ? '#fbcfe8' : '#e8909e'"
                    rx="2"
                  />
                  <text
                    :x="barCenterX(i, aiTrendData.calories.length)"
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
                    :x="barX(i, aiTrendData.carbs.length)"
                    :y="getSvgY(pt.value, 'carbs')"
                    :width="barWidth(aiTrendData.carbs.length)"
                    :height="
                      Math.max(
                        62 - getSvgY(pt.value, 'carbs'),
                        pt.hasRecord ? 2 : 0,
                      )
                    "
                    :fill="pt.isForecast ? '#dbeafe' : '#60a5fa'"
                    rx="2"
                  />
                  <text
                    :x="barCenterX(i, aiTrendData.carbs.length)"
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
                    :x="barX(i, aiTrendData.protein.length)"
                    :y="getSvgY(pt.value, 'protein')"
                    :width="barWidth(aiTrendData.protein.length)"
                    :height="
                      Math.max(
                        62 - getSvgY(pt.value, 'protein'),
                        pt.hasRecord ? 2 : 0,
                      )
                    "
                    :fill="pt.isForecast ? '#d1fae5' : '#34d399'"
                    rx="2"
                  />
                  <text
                    :x="barCenterX(i, aiTrendData.protein.length)"
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
                    :x="barX(i, aiTrendData.fat.length)"
                    :y="getSvgY(pt.value, 'fat')"
                    :width="barWidth(aiTrendData.fat.length)"
                    :height="
                      Math.max(
                        62 - getSvgY(pt.value, 'fat'),
                        pt.hasRecord ? 2 : 0,
                      )
                    "
                    :fill="pt.isForecast ? '#fef3c7' : '#fbbf24'"
                    rx="2"
                  />
                  <text
                    :x="barCenterX(i, aiTrendData.fat.length)"
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
              <button
                v-if="dailyAiError"
                class="eval-btn retry-ai-btn"
                @click="requestDailyEvaluation(true)"
              >
                다시 AI 피드백 받기
              </button>
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
                muted
                playsinline
                preload="metadata"
                class="mylog-video"
              ></video>
              <span class="mylog-meal-badge">{{ mealLabel(v.mealType) }}</span>
              <div class="macro-tags-overlay" v-if="v.calories">
                <span class="m-tag c">탄{{ Math.round(v.carbs || 0) }}</span>
                <span class="m-tag p">단{{ Math.round(v.protein || 0) }}</span>
                <span class="m-tag f">지{{ Math.round(v.fat || 0) }}</span>
                <span class="m-tag k">{{ Math.round(v.calories || 0) }}</span>
              </div>
            </div>
            <div class="mylog-card-footer">
              <span class="vid-desc" v-if="v.description">{{ v.description }}</span>
              <span class="vid-desc empty" v-else>메모가 없습니다.</span>
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
import { emojis } from "../data/mockData.js";

const auth = inject("auth");

// 반응형 핸들러
const isMobile = ref(window.innerWidth < 768);
const isWide = ref(window.innerWidth >= 1200);
const onResize = () => {
  isMobile.value = window.innerWidth < 768;
  isWide.value = window.innerWidth >= 1200;
};
window.addEventListener("resize", onResize);
onUnmounted(() => {
  window.removeEventListener("resize", onResize);
  stopAnalysisPolling();
});

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
const dailyAiFeedback = ref("");
const evaluatingDailyAi = ref(false);
const dailyAiError = ref(false);
const ANALYSIS_POLL_INTERVAL_MS = 3000;
const ANALYSIS_POLL_MAX_ATTEMPTS = 40;
let analysisPollTimer = null;
let analysisPollAttempts = 0;

const trendPeriod = ref("week");

// 달력 날짜 로직
const today = new Date();
const todayDate = today.getDate();
const todayMonth = today.getMonth();
const todayYear = today.getFullYear();
const currentYear = ref(today.getFullYear());
const currentMonth = ref(today.getMonth());
const selectedDay = ref(today.getDate());
const trendBaseDate = toDateString(today);

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

// force=true 면 항상 새로 생성 (버튼 클릭), false면 캐시 우선 (날짜 이동 시)
async function requestDailyEvaluation(force = false) {
  if (dailyTotals.value.calories <= 0) {
    dailyAiFeedback.value = "";
    dailyAiError.value = false;
    return;
  }

  const dateStr = toDateStr(selectedDay.value, currentYear.value, currentMonth.value);

  if (!force) {
    const hasCached = await fetchDailyAiComment(dateStr);
    if (hasCached) return;
  }

  evaluatingDailyAi.value = true;
  dailyAiError.value = false;
  try {
    const res = await axios.post(`/api/logs/daily/evaluate?date=${dateStr}`, null, {
      headers: authHeaders(),
    });
    dailyAiFeedback.value = formatAiComment(res.data?.aiComment);
  } catch (e) {
    console.error("AI 피드백 생성 실패:", e);
    const cached = await fetchDailyAiComment(dateStr);
    if (!cached) {
      dailyAiError.value = true;
      dailyAiFeedback.value = "AI 피드백을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    }
  } finally {
    evaluatingDailyAi.value = false;
  }
}

async function fetchDailyAiComment(dateStr) {
  try {
    const res = await axios.get("/api/logs/daily/ai-comment", {
      params: { date: dateStr },
      headers: authHeaders(),
    });
    const comment = formatAiComment(res.data?.aiComment);
    dailyAiFeedback.value = comment;
    dailyAiError.value = false;
    return Boolean(comment);
  } catch (e) {
    console.error("저장된 AI 피드백 조회 실패:", e);
    return false;
  }
}

function authHeaders() {
  const token =
    localStorage.getItem("yamyam_token") || localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatAiComment(comment) {
  if (!comment) return "";
  const text = String(comment).trim();
  if (!text.startsWith("{")) return text;

  try {
    const parsed = JSON.parse(text);
    return [parsed.summary, parsed.advice].filter(Boolean).join(" ");
  } catch {
    return text;
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
  let tdee = bmr * 1.75;

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
async function fetchMyVideosByDate(dateStr) {
  const res = await axios.post("/graphql", {
    query: `query GetMyVideos($userId: ID, $date: String!) {
      videos(userId: $userId, date: $date) {
        id userId uploaderNickName teamId mealType mealDate videoUrl
        description calories carbs protein fat aiComment likeCount liked createdAt status
      }
    }`,
    variables: { userId: String(auth.loginUser.value?.id), date: dateStr },
  });
  return res.data?.data?.videos ?? [];
}

function hasPendingAnalysis(videos = dayVideos.value) {
  return videos.some((v) => String(v.status || "").toUpperCase() === "PENDING");
}

function stopAnalysisPolling() {
  if (analysisPollTimer) {
    clearInterval(analysisPollTimer);
    analysisPollTimer = null;
  }
  analysisPollAttempts = 0;
}

// Preserve object references for unchanged videos so Vue never touches those
// <video> DOM elements (avoids any reload/flicker during polling).
function mergeVideoList(current, next) {
  if (!current.length) return next
  const currMap = new Map(current.map(v => [v.id, v]))
  return next.map(v => {
    const existing = currMap.get(v.id)
    if (!existing) return v
    // DONE videos: keep existing reference unconditionally.
    // The video is already playing — even if the server returns a refreshed
    // presigned URL, we don't want to reload a video that's already on screen.
    if (existing.status === 'DONE' && v.status === 'DONE') return existing
    // Other statuses: replace only if something meaningful changed
    if (existing.status === v.status && existing.videoUrl === v.videoUrl) return existing
    return v
  })
}

function startAnalysisPolling() {
  if (!hasPendingAnalysis()) {
    stopAnalysisPolling();
    return;
  }
  if (analysisPollTimer) return;

  analysisPollAttempts = 0;
  analysisPollTimer = setInterval(refreshPendingAnalysis, ANALYSIS_POLL_INTERVAL_MS);
}

async function refreshPendingAnalysis() {
  if (++analysisPollAttempts > ANALYSIS_POLL_MAX_ATTEMPTS) {
    stopAnalysisPolling();
    return;
  }

  const dateStr = toDateStr(
    selectedDay.value,
    currentYear.value,
    currentMonth.value,
  );

  try {
    const videos = await fetchMyVideosByDate(dateStr);
    dayVideos.value = mergeVideoList(dayVideos.value, videos);
    await fetchAiIntegratedData(trendBaseDate, trendPeriod.value);

    if (!hasPendingAnalysis(videos)) {
      stopAnalysisPolling();
      await requestDailyEvaluation();
    }
  } catch (e) {
    console.error("AI 분석 상태 갱신 실패:", e);
  }
}

async function selectDay(d) {
  selectedDay.value = d;
  loadingDayVideos.value = true;
  const dateStr = toDateStr(d, currentYear.value, currentMonth.value);

  try {
    stopAnalysisPolling();
    dayVideos.value = await fetchMyVideosByDate(dateStr);

    // 차트는 선택일이 아니라 오늘 기준으로 고정
    await fetchAiIntegratedData(trendBaseDate, trendPeriod.value);
    await requestDailyEvaluation();
    startAnalysisPolling();
  } catch (err) {
    console.error(err);
    dayVideos.value = [];
    dailyAiFeedback.value = "";
  } finally {
    loadingDayVideos.value = false;
  }
}

// 1. 월간 통계 요약
const aiSummaryStats = ref({ avgCalories: 0, recordedDays: 0 });

// 2. 차트 트렌드 배열
const aiTrendData = ref({ calories: [], carbs: [], protein: [], fat: [] });
let trendRequestSeq = 0;

// 3. GraphQL 일자별 조회 기반 트렌드 구성
async function fetchAiIntegratedData(_dateString, period) {
  const requestSeq = ++trendRequestSeq;

  try {
    const res = await axios.get("/api/logs/trend", {
      params: { period },
      headers: authHeaders(),
    });

    if (requestSeq !== trendRequestSeq) return;

    aiTrendData.value = {
      calories: res.data?.calories ?? [],
      carbs: res.data?.carbs ?? [],
      protein: res.data?.protein ?? [],
      fat: res.data?.fat ?? [],
    };
    aiSummaryStats.value = res.data?.summary ?? {
      avgCalories: 0,
      recordedDays: 0,
    };
  } catch (e) {
    console.error("트렌드 데이터 조회 실패:", e);
    if (requestSeq !== trendRequestSeq) return;
    aiTrendData.value = { calories: [], carbs: [], protein: [], fat: [] };
    aiSummaryStats.value = { avgCalories: 0, recordedDays: 0 };
  }
}

function buildTrendBuckets(dateString, period) {
  const base = parseLocalDate(dateString);

  if (period === "day") {
    return Array.from({ length: 7 }, (_, idx) => {
      const date = addDays(base, idx - 6);
      return {
        label: idx === 6 ? "오늘" : `${date.getMonth() + 1}/${date.getDate()}`,
        dates: [toDateString(date)],
      };
    });
  }

  if (period === "week") {
    return Array.from({ length: 4 }, (_, idx) => {
      const start = addDays(base, (idx - 3) * 7 - 6);
      const end = addDays(start, 6);
      return {
        label: idx === 3 ? "이번주" : `${4 - idx}주전`,
        dates: eachDate(start, end),
      };
    });
  }

  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  const last = new Date(base);
  const buckets = [];
  let cursor = new Date(first);
  let week = 1;

  while (cursor <= last) {
    const start = new Date(cursor);
    const end = new Date(Math.min(addDays(start, 6).getTime(), last.getTime()));
    buckets.push({
      label: `${week}주`,
      dates: eachDate(start, end),
    });
    cursor = addDays(end, 1);
    week += 1;
  }

  return buckets;
}

async function fetchBucketTotals(dates) {
  const totals = { calories: 0, carbs: 0, protein: 0, fat: 0, count: 0 };

  for (const date of dates) {
    const videos = await fetchVideosByDate(date);
    const dayTotal = sumVideos(videos);
    if (dayTotal.count > 0) {
      totals.count += 1;
    }
    totals.calories += dayTotal.calories;
    totals.carbs += dayTotal.carbs;
    totals.protein += dayTotal.protein;
    totals.fat += dayTotal.fat;
  }

  return totals;
}

async function fetchVideosByDate(date) {
  try {
    const res = await axios.post("/graphql", {
      query: `query GetMyVideos($userId: ID, $date: String!) {
        videos(userId: $userId, date: $date) {
          id mealType calories carbs protein fat status
        }
      }`,
      variables: { userId: String(auth.loginUser.value?.id), date },
    });

    return res.data?.data?.videos ?? [];
  } catch (e) {
    console.error("트렌드 영상 조회 실패:", date, e);
    return [];
  }
}

function sumVideos(videos) {
  return videos.reduce(
    (acc, v) => {
      if (v.status === "DONE" || v.calories) {
        acc.calories += Number(v.calories || 0);
        acc.carbs += Number(v.carbs || 0);
        acc.protein += Number(v.protein || 0);
        acc.fat += Number(v.fat || 0);
        acc.count += 1;
      }
      return acc;
    },
    { calories: 0, carbs: 0, protein: 0, fat: 0, count: 0 },
  );
}

function toTrendSeries(buckets) {
  return {
    calories: buckets.map((b) => trendPoint(b, "calories")),
    carbs: buckets.map((b) => trendPoint(b, "carbs")),
    protein: buckets.map((b) => trendPoint(b, "protein")),
    fat: buckets.map((b) => trendPoint(b, "fat")),
  };
}

function trendPoint(bucket, key) {
  return {
    label: bucket.label,
    value: Math.round(bucket.totals[key] || 0),
    isForecast: false,
    hasRecord: bucket.totals.count > 0,
  };
}

function updateMonthlyStats(buckets) {
  const recordedBuckets = buckets.filter((b) => b.totals.count > 0);
  const totalCalories = recordedBuckets.reduce(
    (sum, b) => sum + b.totals.calories,
    0,
  );

  aiSummaryStats.value = {
    avgCalories: recordedBuckets.length
      ? Math.round(totalCalories / recordedBuckets.length)
      : 0,
    recordedDays: buckets.reduce((sum, b) => sum + b.totals.count, 0),
  };
}

function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function eachDate(start, end) {
  const dates = [];
  let cursor = new Date(start);
  while (cursor <= end) {
    dates.push(toDateString(cursor));
    cursor = addDays(cursor, 1);
  }
  return dates;
}

watch(trendPeriod, async (newPeriod) => {
  await fetchAiIntegratedData(trendBaseDate, newPeriod);
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
  return evaluatingDailyAi.value
    ? "AI가 오늘의 영양 균형을 분석하는 중입니다..."
    : dailyAiFeedback.value;
});

function percent(current, target) {
  if (!target) return 0;
  const p = (current / target) * 100;
  return p > 100 ? 100 : p;
}

// 차트 Y축 스케일링 동적 할당
function getSvgY(value, type, baseline = 62, chartHeight = 50) {
  if (value === undefined || value === null) value = 0;

  let maxDomain = 2000;
  if (type === "calories") maxDomain = targets.value.calories * 1.5;
  else if (type === "carbs") maxDomain = targets.value.carbs * 1.5;
  else if (type === "protein") maxDomain = targets.value.protein * 1.5;
  else if (type === "fat") maxDomain = targets.value.fat * 1.5;

  const ratio = Math.min(Number(value || 0) / maxDomain, 1);
  return baseline - ratio * chartHeight;
}

function barWidth(count, svgWidth = 280) {
  if (!count) return 0;
  const plotWidth = svgWidth - 24;
  return Math.max(8, Math.min(22, plotWidth / count - 8));
}

function barX(index, count, svgWidth = 280) {
  if (!count) return 0;
  const plotWidth = svgWidth - 24;
  const step = plotWidth / count;
  return 12 + index * step + (step - barWidth(count, svgWidth)) / 2;
}

function barCenterX(index, count, svgWidth = 280) {
  return barX(index, count, svgWidth) + barWidth(count, svgWidth) / 2;
}

// 달력 이모지 - 월별 일괄 로드
const monthlyDayMap = ref({}); // { "1": { hasRecord, aiComment }, ... }

function moodFromComment(aiComment) {
  if (!aiComment) return "neutral";
  const t = aiComment;
  if (/훌륭|완벽|이상적|최고|탁월/.test(t)) return "great";
  if (/과다|과잉|불균형|매우\s*부족|심각/.test(t)) return "bad";
  if (/부족|아쉬|조금\s*더|보충|낮/.test(t)) return "neutral";
  if (/좋|균형|적절|충분|잘\s/.test(t)) return "happy";
  return "good";
}

function getDayEmoji(day) {
  if (!day) return "";
  const entry = monthlyDayMap.value[String(day)];
  if (!entry || !entry.hasRecord) return "";
  const mood = moodFromComment(entry.aiComment);
  return emojis[mood] || "";
}

function hasRecordInMonth(day) {
  if (!day) return false;
  return !!monthlyDayMap.value[String(day)]?.hasRecord;
}

async function loadMonthlyData() {
  try {
    const res = await axios.get("/api/logs/monthly-ai", {
      params: { year: currentYear.value, month: currentMonth.value + 1 },
      headers: authHeaders(),
    });
    const map = {};
    (res.data || []).forEach((row) => {
      const d = new Date(row.mealDate);
      const day = String(d.getDate());
      map[day] = { hasRecord: Number(row.recordCount) > 0, aiComment: row.aiComment || "" };
    });
    monthlyDayMap.value = map;
  } catch (e) {
    console.error("월별 달력 데이터 조회 실패:", e);
  }
}

watch([currentYear, currentMonth], loadMonthlyData);

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
  loadMonthlyData(); // 3. 달력 이모지 일괄 로드
});
</script>

<style scoped>
/* =========================================================
   공통 기초 뼈대 아키텍처 구조 정의
   ========================================================= */
.mylog-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background-color: #f8fafc;
}

.scroll-body {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 40px;
}

.wide-split {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.wide-cal-panel {
  width: 340px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e2e8f0;
  padding: 20px;
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
  margin-bottom: 14px;
}
.cal-dot {
  width: 4.5px;
  height: 4.5px;
  background-color: #10b981;
  border-radius: 50%;
  position: absolute;
  bottom: 5px;
}
.cal-cell.selected .cal-dot {
  background-color: #fff;
}
.cal-expr {
  position: absolute;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  line-height: 1;
  user-select: none;
  pointer-events: none;
}
.cal-expr :deep(svg) {
  width: 18px;
  height: 18px;
  display: block;
}

/* 데일리 리포팅 인사이트 대시보드 스펙 */
.daily-insight-panel {
  background: #fff;
  padding: 16px 16px 20px;
  margin-bottom: 6px;
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
/* 칼로리 메인 카드: 연한 핑크 배경 */
.kcal-card {
  background: linear-gradient(135deg, #fff5f6 0%, #fff 60%);
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
  background: linear-gradient(90deg, #93c5fd, #3b82f6);
}
.progress-fill.protein {
  background: linear-gradient(90deg, #6ee7b7, #10b981);
}
.progress-fill.fat {
  background: linear-gradient(90deg, #fcd34d, #f59e0b);
}

/* AI 평가 버튼 */
.eval-btn {
  display: block;
  width: 100%;
  margin-top: 16px;
  padding: 14px;
  background: linear-gradient(135deg, #e8909e 0%, #f472b6 100%);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(232, 144, 158, 0.35);
  transition: opacity 0.15s, transform 0.15s;
}
.eval-btn:active {
  opacity: 0.85;
  transform: scale(0.98);
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
  margin: 10px 0 0;
  word-break: keep-all;
}
.retry-ai-btn {
  margin-top: 12px;
  width: auto;
  padding: 9px 14px;
  border-radius: 10px;
  font-size: 12px;
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
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.trend-mobile-section .trend-ctrl-header {
  margin-bottom: 0;
}
.trend-sec-title {
  font-size: 14px;
  font-weight: 700;
  color: #111;
}
/* 모바일 차트 카드에 배경 살짝 강조 */
.trend-mobile-section .trend-chart-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

/* =========================================================
   식단 비디오 컨텐츠 구조 및 리스트 뷰 영역
   ========================================================= */
.video-list-section {
  padding: 0 16px 32px;
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
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.07);
  border: 1px solid #eef2f7;
  transition: transform 0.15s, box-shadow 0.15s;
}
.mylog-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.11);
}
.video-overlay-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: #fdf8f3;
  overflow: hidden;
}
.mylog-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.mylog-meal-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  color: #1e293b;
  z-index: 3;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.macro-tags-overlay {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  gap: 4px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  padding: 5px 8px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 3;
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

.mylog-card-footer {
  padding: 10px 14px;
  border-top: 1px solid #f1f5f9;
  min-height: 38px;
  display: flex;
  align-items: center;
}
.vid-desc {
  font-size: 13px;
  color: #334155;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.vid-desc.empty {
  color: #94a3b8;
  font-style: italic;
  font-weight: 400;
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

.cal-divider {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 16px 0;
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

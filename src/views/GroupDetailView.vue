<template>
  <div class="screen">
    <header class="header">
      <button
        class="icon-btn"
        @click="!isWide && showCalendar ? (showCalendar = false) : goBack()"
      >
        <i class="ti ti-arrow-left"></i>
      </button>
      <div class="group-title-wrap">
        <img
          v-if="!(!isWide && showCalendar)"
          src="/default_group.svg"
          class="group-header-img"
          alt="group"
        />
        <span class="group-title">{{
          !isWide && showCalendar ? "AI 달력" : (selectedGroup?.name ?? "그룹")
        }}</span>
      </div>

      <div class="header-actions" v-if="!isWide && !showCalendar">
        <button class="icon-btn" @click="showCalendar = true" title="AI 달력">
          <i class="ti ti-calendar"></i>
        </button>
        <button class="icon-btn" @click="goTo('chat')" title="채팅">
          <i class="ti ti-message-circle"></i>
        </button>
        <button class="icon-btn" @click="showSettings = true" title="그룹 설정">
          <i class="ti ti-settings"></i>
        </button>
      </div>
      <div v-else class="header-actions">
        <button class="icon-btn" @click="showSettings = true" title="그룹 설정">
          <i class="ti ti-settings"></i>
        </button>
      </div>
    </header>

    <!-- ══════════════ MOBILE (< 768px) ══════════════ -->
    <main v-if="isMobile" class="scroll-body">
      <section v-if="showCalendar" class="calendar-panel">
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
            :class="{ empty: !cell, selected: cell === selectedDay }"
            @click="cell && selectDay(cell)"
          >
            <template v-if="cell">
              <span class="cal-num">{{ cell }}</span>
              <span v-if="hasRecordInMonth(cell)" class="cal-dot"></span>
            </template>
          </div>
        </div>

        <div class="day-record">
          <div class="day-record-title">
            내 일일 영양 기록 ({{ currentMonth + 1 }}/{{ selectedDay }})
          </div>
          <div class="day-bars">
            <div class="bar-row">
              <span class="bar-label">칼로리</span>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{
                    width:
                      calPercent(
                        myDayRecord.calories,
                        myDayRecord.targetCalories,
                      ) + '%',
                  }"
                ></div>
              </div>
              <span class="bar-val"
                >{{ myDayRecord.calories }} /
                {{ myDayRecord.targetCalories }}</span
              >
            </div>
            <div class="bar-row">
              <span class="bar-label">탄수화물</span>
              <div class="bar-track">
                <div
                  class="bar-fill carbs"
                  :style="{
                    width:
                      calPercent(myDayRecord.carbs, myDayRecord.targetCarbs) +
                      '%',
                  }"
                ></div>
              </div>
              <span class="bar-val"
                >{{ myDayRecord.carbs }}g / {{ myDayRecord.targetCarbs }}g</span
              >
            </div>
            <div class="bar-row">
              <span class="bar-label">단백질</span>
              <div class="bar-track">
                <div
                  class="bar-fill protein"
                  :style="{
                    width:
                      calPercent(
                        myDayRecord.protein,
                        myDayRecord.targetProtein,
                      ) + '%',
                  }"
                ></div>
              </div>
              <span class="bar-val"
                >{{ myDayRecord.protein }}g /
                {{ myDayRecord.targetProtein }}g</span
              >
            </div>
            <div class="bar-row">
              <span class="bar-label">지방</span>
              <div class="bar-track">
                <div
                  class="bar-fill fat"
                  :style="{
                    width:
                      calPercent(myDayRecord.fat, myDayRecord.targetFat) + '%',
                  }"
                ></div>
              </div>
              <span class="bar-val"
                >{{ myDayRecord.fat }}g / {{ myDayRecord.targetFat }}g</span
              >
            </div>
          </div>
          <div class="day-ai">
            <span class="ai-chip">AI</span>{{ myDayRecord.aiComment }}
          </div>
          <button
            v-if="dailyAiError"
            class="retry-ai-btn"
            @click="requestDailyEvaluation(calDateStr(selectedDay))"
          >
            다시 AI 피드백 받기
          </button>
        </div>

        <div class="member-summary-list">
          <div class="summary-title">
            {{ currentMonth + 1 }}월 {{ selectedDay }}일 · 참가자 식단
          </div>
          <div
            v-for="member in teamMembers"
            :key="member.id"
            class="summary-row"
          >
            <img
              :src="member.profileImg || '/default_avatar.svg'"
              class="summary-avatar"
              @error="(e) => (e.target.src = '/default_avatar.svg')"
            />
            <div class="summary-info">
              <div class="summary-name">
                {{ member.nickName }}
                <span v-if="teamInfo?.kingId === member.id" class="king-badge">방장</span>
                <span v-if="isMe(member.id)" class="mine-badge">나</span>
                <button v-if="isKing && !isMe(member.id)" class="kick-btn" @click.stop="kickMember(member.id, member.nickName)">추방</button>
              </div>

              <div
                v-if="memberMeals(member.id).length > 0"
                class="summary-meals"
              >
                <span
                  v-for="mt in memberMeals(member.id)"
                  :key="mt.key"
                  class="summary-chip"
                >
                  <span class="summary-meal-type">{{ mt.label }}</span>
                  <div
                    class="summary-macros"
                    v-if="mt.video.status === 'DONE' || mt.video.calories"
                  >
                    <span class="s-mac c"
                      >탄 {{ Math.round(mt.video.carbs || 0) }}</span
                    >
                    <span class="s-mac p"
                      >단 {{ Math.round(mt.video.protein || 0) }}</span
                    >
                    <span class="s-mac f"
                      >지 {{ Math.round(mt.video.fat || 0) }}</span
                    >
                    <span class="s-mac k"
                      >{{ Math.round(mt.video.calories || 0) }}kcal</span
                    >
                  </div>
                  <div class="summary-macros empty" v-else>
                    <span>분석 대기중</span>
                  </div>
                </span>
              </div>
              <div v-else class="summary-no-record">이 날 기록 없음</div>
            </div>
          </div>
          <div
            v-if="teamMembers.length === 0"
            class="summary-no-record"
            style="padding: 12px 0"
          >
            멤버 정보 없음
          </div>
        </div>
      </section>

      <!-- 피드 (모바일) -->
      <template v-else>
        <div class="feed-wrap">
          <div class="feed-controls-bar">
            <div class="feed-date-compact">
              <button class="date-nav-btn" @click="prevDay">
                <i class="ti ti-chevron-left"></i>
              </button>
              <span>{{ feedDate }}</span>
              <button class="date-nav-btn" @click="nextDay">
                <i class="ti ti-chevron-right"></i>
              </button>
            </div>
            <div class="meal-tab-bar">
              <button
                v-for="(mt, i) in mealTypes"
                :key="mt.key"
                class="meal-tab"
                :class="{ active: activeMealIdx === i }"
                @click="activeMealIdx = i"
              >
                {{ mt.label }}
              </button>
            </div>
          </div>
          <div v-if="loading" class="loading-msg">불러오는 중...</div>
          <template v-else>
            <section
              class="feed-mobile"
              @touchstart.passive="onTouchStart"
              @touchend.passive="onTouchEnd"
              @mousedown="onMouseDown"
              @mouseup="onMouseUp"
              @mouseleave="isDragging = false"
            >
              <div
                v-for="member in teamMembers"
                :key="member.id"
                class="member-log-mobile"
              >
                <div
                  v-if="getVideo(member.id, mealTypes[activeMealIdx].key)"
                  class="video-wrap-full"
                  @click="
                    handleVideoClick(
                      $event,
                      getVideo(member.id, mealTypes[activeMealIdx].key),
                    )
                  "
                >
                  <div class="video-thumb-wrap">
                    <video
                      class="meal-video-full"
                      :src="
                        getVideo(member.id, mealTypes[activeMealIdx].key)
                          .videoUrl
                      "
                      v-lazy-video
                      loop
                      muted
                      playsinline
                      preload="metadata"
                    ></video>
                    <div
                      v-if="
                        getVideo(
                          member.id,
                          mealTypes[activeMealIdx].key,
                        ).status?.toUpperCase() === 'DONE'
                      "
                      class="mini-nutri-preview"
                    >
                      <span class="m-tag c"
                        >탄
                        {{
                          Math.round(
                            getVideo(member.id, mealTypes[activeMealIdx].key)
                              .carbs || 0,
                          )
                        }}g</span
                      >
                      <span class="m-tag p"
                        >단
                        {{
                          Math.round(
                            getVideo(member.id, mealTypes[activeMealIdx].key)
                              .protein || 0,
                          )
                        }}g</span
                      >
                      <span class="m-tag f"
                        >지
                        {{
                          Math.round(
                            getVideo(member.id, mealTypes[activeMealIdx].key)
                              .fat || 0,
                          )
                        }}g</span
                      >
                      <span class="m-tag k"
                        >{{
                          Math.round(
                            getVideo(member.id, mealTypes[activeMealIdx].key)
                              .calories || 0,
                          )
                        }}kcal</span
                      >
                    </div>
                  </div>
                  <div class="vid-member-top">
                    <div
                      class="member-avatar"
                      :class="{ mine: isMe(member.id) }"
                    >
                      <img
                        :src="member.profileImg || '/default_avatar.svg'"
                        class="avatar-img"
                        @error="(e) => (e.target.src = '/default_avatar.svg')"
                      />
                    </div>
                    <div class="member-name" style="display:flex; align-items:center; gap:4px;">
                      {{ member.nickName }}
                      <span v-if="teamInfo?.kingId === member.id" class="king-badge" style="transform: scale(0.85); transform-origin: left center;">방장</span>
                    </div>
                    <div v-if="isMe(member.id)" class="mine-badge">나</div>
                  </div>
                  <span
                    v-if="
                      getVideo(member.id, mealTypes[activeMealIdx].key)
                        .description
                    "
                    class="vid-center-desc"
                    >{{
                      getVideo(member.id, mealTypes[activeMealIdx].key)
                        .description
                    }}</span
                  >
                  <div class="vid-bottom">
                    <span class="vid-tag"
                      >{{ mealTypes[activeMealIdx].label }} ·
                      {{
                        videoTime(
                          getVideo(member.id, mealTypes[activeMealIdx].key),
                        )
                      }}</span
                    >
                    <button
                      class="like-btn"
                      :class="{
                        liked: getVideo(member.id, mealTypes[activeMealIdx].key)
                          .liked,
                      }"
                      @click.stop="
                        toggleLike(
                          getVideo(member.id, mealTypes[activeMealIdx].key),
                          $event,
                        )
                      "
                    >
                      <span class="heart-icon">♥</span>
                    </button>
                  </div>
                </div>
                <div
                  v-else-if="isMe(member.id)"
                  class="video-wrap-full upload-full"
                  @click="openUpload(mealTypes[activeMealIdx].key)"
                >
                  <div class="vid-member-top">
                    <div class="member-avatar mine">
                      <img src="/default_avatar.svg" class="avatar-img" />
                    </div>
                    <div class="member-name-dark" style="display:flex; align-items:center; gap:4px;">나</div>
                  </div>
                  <i class="ti ti-upload"></i
                  ><span>{{ mealTypes[activeMealIdx].label }} 업로드</span>
                </div>
                <div v-else class="video-wrap-full empty-full">
                  <div class="vid-member-top">
                    <div class="member-avatar">
                      <img
                        :src="member.profileImg || '/default_avatar.svg'"
                        class="avatar-img"
                        @error="(e) => (e.target.src = '/default_avatar.svg')"
                      />
                    </div>
                    <div class="member-name-dark" style="display:flex; align-items:center; gap:4px;">
                      {{ member.nickName }}
                      <span v-if="teamInfo?.kingId === member.id" class="king-badge" style="transform: scale(0.85); transform-origin: left center; background:#b4b4b4;">방장</span>
                    </div>
                  </div>
                  <i class="ti ti-minus"></i><span>미기록</span>
                </div>
              </div>
              <div v-if="teamMembers.length === 0" class="empty-feed">
                멤버 정보를 불러올 수 없습니다.
              </div>
            </section>
          </template>
        </div>
      </template>
    </main>

    <!-- ══════════════ TABLET / iPad (768–1199px): 3열 그리드 ══════════════ -->
    <main v-else-if="!isWide" class="scroll-body">
      <!-- AI 달력 패널 -->
      <section v-if="showCalendar" class="calendar-panel">
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
            :class="{ empty: !cell, selected: cell === selectedDay }"
            @click="cell && selectDay(cell)"
          >
            <template v-if="cell">
              <span class="cal-num">{{ cell }}</span>
              <span v-if="hasRecordInMonth(cell)" class="cal-dot"></span>
            </template>
          </div>
        </div>

        <div class="day-record">
          <div class="day-record-title">
            내 일일 영양 기록 ({{ currentMonth + 1 }}/{{ selectedDay }})
          </div>
          <div class="day-bars">
            <div class="bar-row">
              <span class="bar-label">칼로리</span>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{
                    width:
                      calPercent(
                        myDayRecord.calories,
                        myDayRecord.targetCalories,
                      ) + '%',
                  }"
                ></div>
              </div>
              <span class="bar-val"
                >{{ myDayRecord.calories }} /
                {{ myDayRecord.targetCalories }}</span
              >
            </div>
            <div class="bar-row">
              <span class="bar-label">탄수화물</span>
              <div class="bar-track">
                <div
                  class="bar-fill carbs"
                  :style="{
                    width:
                      calPercent(myDayRecord.carbs, myDayRecord.targetCarbs) +
                      '%',
                  }"
                ></div>
              </div>
              <span class="bar-val"
                >{{ myDayRecord.carbs }}g / {{ myDayRecord.targetCarbs }}g</span
              >
            </div>
            <div class="bar-row">
              <span class="bar-label">단백질</span>
              <div class="bar-track">
                <div
                  class="bar-fill protein"
                  :style="{
                    width:
                      calPercent(
                        myDayRecord.protein,
                        myDayRecord.targetProtein,
                      ) + '%',
                  }"
                ></div>
              </div>
              <span class="bar-val"
                >{{ myDayRecord.protein }}g /
                {{ myDayRecord.targetProtein }}g</span
              >
            </div>
            <div class="bar-row">
              <span class="bar-label">지방</span>
              <div class="bar-track">
                <div
                  class="bar-fill fat"
                  :style="{
                    width:
                      calPercent(myDayRecord.fat, myDayRecord.targetFat) + '%',
                  }"
                ></div>
              </div>
              <span class="bar-val"
                >{{ myDayRecord.fat }}g / {{ myDayRecord.targetFat }}g</span
              >
            </div>
          </div>
          <div class="day-ai">
            <span class="ai-chip">AI</span>{{ myDayRecord.aiComment }}
          </div>
          <button
            v-if="dailyAiError"
            class="retry-ai-btn"
            @click="requestDailyEvaluation(calDateStr(selectedDay))"
          >
            다시 AI 피드백 받기
          </button>
        </div>

        <div class="member-summary-list">
          <div class="summary-title">
            {{ currentMonth + 1 }}월 {{ selectedDay }}일 · 참가자 식단
          </div>
          <div
            v-for="member in teamMembers"
            :key="member.id"
            class="summary-row"
          >
            <img
              :src="member.profileImg || '/default_avatar.svg'"
              class="summary-avatar"
              @error="(e) => (e.target.src = '/default_avatar.svg')"
            />
            <div class="summary-info">
              <div class="summary-name">
                {{ member.nickName }}
                <span v-if="teamInfo?.kingId === member.id" class="king-badge">방장</span>
                <span v-if="isMe(member.id)" class="mine-badge">나</span>
                <button v-if="isKing && !isMe(member.id)" class="kick-btn" @click.stop="kickMember(member.id, member.nickName)">추방</button>
              </div>
              <div
                v-if="memberMeals(member.id).length > 0"
                class="summary-meals"
              >
                <span
                  v-for="mt in memberMeals(member.id)"
                  :key="mt.key"
                  class="summary-chip"
                >
                  <span class="summary-meal-type">{{ mt.label }}</span>
                  <div
                    class="summary-macros"
                    v-if="mt.video.status === 'DONE' || mt.video.calories"
                  >
                    <span class="s-mac c"
                      >탄 {{ Math.round(mt.video.carbs || 0) }}</span
                    >
                    <span class="s-mac p"
                      >단 {{ Math.round(mt.video.protein || 0) }}</span
                    >
                    <span class="s-mac f"
                      >지 {{ Math.round(mt.video.fat || 0) }}</span
                    >
                    <span class="s-mac k"
                      >{{ Math.round(mt.video.calories || 0) }}kcal</span
                    >
                  </div>
                  <div class="summary-macros empty" v-else>
                    <span>분석 대기중</span>
                  </div>
                </span>
              </div>
              <div v-else class="summary-no-record">이 날 기록 없음</div>
            </div>
          </div>
          <div
            v-if="teamMembers.length === 0"
            class="summary-no-record"
            style="padding: 12px 0"
          >
            멤버 정보 없음
          </div>
        </div>
      </section>

      <!-- 피드 (태블릿) -->
      <template v-else>
        <div class="feed-date-label desk-date">
          <button class="date-nav-btn" @click="prevDay">
            <i class="ti ti-chevron-left"></i>
          </button>
          <span>{{ feedDate }} 식단 기록</span>
          <button class="date-nav-btn" @click="nextDay">
            <i class="ti ti-chevron-right"></i>
          </button>
        </div>
        <div v-if="loading" class="loading-msg">불러오는 중...</div>
        <section v-else class="feed">
          <div
            v-for="member in teamMembers"
            :key="member.id"
            class="member-log"
          >
            <div class="member-row">
              <div class="member-avatar" :class="{ mine: isMe(member.id) }">
                <img
                  :src="member.profileImg || '/default_avatar.svg'"
                  :alt="member.nickName"
                  class="avatar-img"
                  @error="(e) => (e.target.src = '/default_avatar.svg')"
                />
              </div>
              <div class="member-name" style="display:flex; align-items:center;">
                {{ member.nickName }}
                <span v-if="teamInfo?.kingId === member.id" class="king-badge">방장</span>
              </div>
              <div v-if="isMe(member.id)" class="mine-badge">나</div>
              <button v-if="isKing && !isMe(member.id)" class="kick-btn" @click.stop="kickMember(member.id, member.nickName)">추방</button>
            </div>
            <div class="meal-slots">
              <div v-for="mt in mealTypes" :key="mt.key" class="meal-slot">
                <div
                  v-if="getVideo(member.id, mt.key)"
                  class="video-wrap"
                  style="cursor: pointer"
                  @click="openDetail(getVideo(member.id, mt.key))"
                >
                  <div class="video-thumb-wrap">
                    <video
                      class="meal-video"
                      :src="getVideo(member.id, mt.key).videoUrl"
                      v-lazy-video
                      loop
                      muted
                      playsinline
                      preload="metadata"
                    ></video>
                    <div
                      v-if="
                        getVideo(member.id, mt.key).status?.toUpperCase() ===
                        'DONE'
                      "
                      class="mini-nutri-preview"
                    >
                      <span class="m-tag c"
                        >탄
                        {{
                          Math.round(getVideo(member.id, mt.key).carbs || 0)
                        }}g</span
                      >
                      <span class="m-tag p"
                        >단
                        {{
                          Math.round(getVideo(member.id, mt.key).protein || 0)
                        }}g</span
                      >
                      <span class="m-tag f"
                        >지
                        {{
                          Math.round(getVideo(member.id, mt.key).fat || 0)
                        }}g</span
                      >
                      <span class="m-tag k"
                        >{{
                          Math.round(getVideo(member.id, mt.key).calories || 0)
                        }}kcal</span
                      >
                    </div>
                  </div>

                  <span
                    v-if="getVideo(member.id, mt.key).description"
                    class="vid-center-desc"
                    >{{ getVideo(member.id, mt.key).description }}</span
                  >
                  <div class="vid-bottom">
                    <span class="vid-tag"
                      >{{ mt.label }} ·
                      {{ videoTime(getVideo(member.id, mt.key)) }}</span
                    >
                    <button
                      class="like-btn"
                      :class="{ liked: getVideo(member.id, mt.key).liked }"
                      @click.stop="
                        toggleLike(getVideo(member.id, mt.key), $event)
                      "
                    >
                      <span class="heart-icon">♥</span>
                    </button>
                  </div>
                </div>
                <div
                  v-else-if="isMe(member.id)"
                  class="video-thumb upload-slot"
                  @click="openUpload(mt.key)"
                >
                  <i class="ti ti-upload"></i><span>업로드</span>
                </div>
                <div v-else class="video-thumb empty">
                  <i class="ti ti-minus"></i>
                </div>
              </div>
            </div>
          </div>
          <div v-if="teamMembers.length === 0" class="empty-feed">
            멤버 정보를 불러올 수 없습니다.
          </div>
        </section>
      </template>
    </main>

    <!-- ══════════════ WIDE DESKTOP (≥1200px): 1/3 달력 + 2/3 피드 ══════════════ -->
    <div v-else class="desktop-split">
      <aside class="left-panel">
        <div class="cal-nav">
          <button class="cal-arrow" @click="prevMonth"><i class="ti ti-chevron-left"></i></button>
          <span class="cal-month">{{ monthLabel }}</span>
          <button class="cal-arrow" @click="nextMonth"><i class="ti ti-chevron-right"></i></button>
        </div>
        <div class="cal-weekdays">
          <span v-for="d in ['일', '월', '화', '수', '목', '금', '토']" :key="d">{{ d }}</span>
        </div>
        <div class="cal-grid">
          <div
            v-for="(cell, i) in calendarCells" :key="i"
            class="cal-cell" :class="{ empty: !cell, selected: cell === selectedDay }"
            @click="cell && selectDay(cell)"
          >
            <template v-if="cell">
              <span class="cal-num">{{ cell }}</span>
              <span v-if="hasRecordInMonth(cell)" class="cal-dot"></span>
            </template>
          </div>
        </div>

        <div class="day-record">
          <div class="day-record-title">
            내 일일 영양 기록 ({{ currentMonth + 1 }}/{{ selectedDay }})
          </div>
          <div class="day-bars">
            <div class="bar-row">
              <span class="bar-label">칼로리</span>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{
                    width:
                      calPercent(
                        myDayRecord.calories,
                        myDayRecord.targetCalories,
                      ) + '%',
                  }"
                ></div>
              </div>
              <span class="bar-val"
                >{{ myDayRecord.calories }} /
                {{ myDayRecord.targetCalories }}</span
              >
            </div>
            <div class="bar-row">
              <span class="bar-label">탄수화물</span>
              <div class="bar-track">
                <div
                  class="bar-fill carbs"
                  :style="{
                    width:
                      calPercent(myDayRecord.carbs, myDayRecord.targetCarbs) +
                      '%',
                  }"
                ></div>
              </div>
              <span class="bar-val"
                >{{ myDayRecord.carbs }}g / {{ myDayRecord.targetCarbs }}g</span
              >
            </div>
            <div class="bar-row">
              <span class="bar-label">단백질</span>
              <div class="bar-track">
                <div
                  class="bar-fill protein"
                  :style="{
                    width:
                      calPercent(
                        myDayRecord.protein,
                        myDayRecord.targetProtein,
                      ) + '%',
                  }"
                ></div>
              </div>
              <span class="bar-val"
                >{{ myDayRecord.protein }}g /
                {{ myDayRecord.targetProtein }}g</span
              >
            </div>
            <div class="bar-row">
              <span class="bar-label">지방</span>
              <div class="bar-track">
                <div
                  class="bar-fill fat"
                  :style="{
                    width:
                      calPercent(myDayRecord.fat, myDayRecord.targetFat) + '%',
                  }"
                ></div>
              </div>
              <span class="bar-val"
                >{{ myDayRecord.fat }}g / {{ myDayRecord.targetFat }}g</span
              >
            </div>
          </div>
          <div class="day-ai">
            <span class="ai-chip">AI</span>{{ myDayRecord.aiComment }}
          </div>
          <button
            v-if="dailyAiError"
            class="retry-ai-btn"
            @click="requestDailyEvaluation(calDateStr(selectedDay))"
          >
            다시 AI 피드백 받기
          </button>
        </div>

        <div class="member-summary-list">
          <div class="summary-title">{{ currentMonth + 1 }}월 {{ selectedDay }}일 · 참가자 식단</div>
          <div v-for="member in teamMembers" :key="member.id" class="summary-row">
            <img :src="member.profileImg || '/default_avatar.svg'" class="summary-avatar" @error="(e) => (e.target.src = '/default_avatar.svg')" />
            <div class="summary-info">
              <div class="summary-info order" style="flex-direction:row; align-items:center;">
                <div class="summary-name" style="margin-bottom:0;">
                  {{ member.nickName }}
                  <span v-if="teamInfo?.kingId === member.id" class="king-badge">방장</span>
                  <span v-if="isMe(member.id)" class="mine-badge">나</span>
                </div>
                <button v-if="isKing && !isMe(member.id)" class="kick-btn" style="margin-left:auto;" @click.stop="kickMember(member.id, member.nickName)">추방</button>
              </div>
              <div v-if="memberMeals(member.id).length > 0" class="summary-meals">
                <span v-for="mt in memberMeals(member.id)" :key="mt.key" class="summary-chip">
                  <span class="summary-meal-type">{{ mt.label }}</span>
                  <div
                    class="summary-macros"
                    v-if="mt.video.status === 'DONE' || mt.video.calories"
                  >
                    <span class="s-mac c"
                      >탄 {{ Math.round(mt.video.carbs || 0) }}</span
                    >
                    <span class="s-mac p"
                      >단 {{ Math.round(mt.video.protein || 0) }}</span
                    >
                    <span class="s-mac f"
                      >지 {{ Math.round(mt.video.fat || 0) }}</span
                    >
                    <span class="s-mac k"
                      >{{ Math.round(mt.video.calories || 0) }}kcal</span
                    >
                  </div>
                  <div class="summary-macros empty" v-else>
                    <span>분석 대기중</span>
                  </div>
                </span>
              </div>
              <div v-else class="summary-no-record">이 날 기록 없음</div>
            </div>
          </div>
          <div
            v-if="teamMembers.length === 0"
            class="summary-no-record"
            style="padding: 12px 0"
          >
            멤버 정보 없음
          </div>
        </div>
        <button class="chat-btn-desk" @click="goTo('chat')">
          <i class="ti ti-message-circle"></i> 그룹 채팅
        </button>
      </aside>

      <main class="right-panel">
        <div class="feed-date-label desk-date">
          <button class="date-nav-btn" @click="prevDay"><i class="ti ti-chevron-left"></i></button>
          <span>{{ feedDate }} 식단 기록</span>
          <button class="date-nav-btn" @click="nextDay"><i class="ti ti-chevron-right"></i></button>
        </div>
        <div v-if="loading" class="loading-msg">불러오는 중...</div>
        <section v-else class="feed">
          <div v-for="member in teamMembers" :key="member.id" class="member-log">
            <div class="member-row">
              <div class="member-avatar" :class="{ mine: isMe(member.id) }">
                <img :src="member.profileImg || '/default_avatar.svg'" class="avatar-img" @error="(e) => (e.target.src = '/default_avatar.svg')" />
              </div>
              <div class="member-name" style="display:flex; align-items:center;">
                {{ member.nickName }}
                <span v-if="teamInfo?.kingId === member.id" class="king-badge">방장</span>
              </div>
              <div v-if="isMe(member.id)" class="mine-badge">나</div>
              <button v-if="isKing && !isMe(member.id)" class="kick-btn" @click.stop="kickMember(member.id, member.nickName)">추방</button>
            </div>

            <div class="meal-slots">
              <div v-for="mt in mealTypes" :key="mt.key" class="meal-slot">
                <div
                  v-if="getVideo(member.id, mt.key)"
                  class="video-wrap"
                  style="cursor: pointer"
                  @click="openDetail(getVideo(member.id, mt.key))"
                >
                  <div class="video-thumb-wrap">
                    <video
                      class="meal-video"
                      :src="getVideo(member.id, mt.key).videoUrl"
                      v-lazy-video
                      loop
                      muted
                      playsinline
                      preload="metadata"
                    ></video>
                    <div
                      v-if="
                        getVideo(member.id, mt.key).status?.toUpperCase() ===
                        'DONE'
                      "
                      class="mini-nutri-preview"
                    >
                      <span class="m-tag c"
                        >탄
                        {{
                          Math.round(getVideo(member.id, mt.key).carbs || 0)
                        }}g</span
                      >
                      <span class="m-tag p"
                        >단
                        {{
                          Math.round(getVideo(member.id, mt.key).protein || 0)
                        }}g</span
                      >
                      <span class="m-tag f"
                        >지
                        {{
                          Math.round(getVideo(member.id, mt.key).fat || 0)
                        }}g</span
                      >
                      <span class="m-tag k"
                        >{{
                          Math.round(getVideo(member.id, mt.key).calories || 0)
                        }}kcal</span
                      >
                    </div>
                  </div>

                  <span
                    v-if="getVideo(member.id, mt.key).description"
                    class="vid-center-desc"
                    >{{ getVideo(member.id, mt.key).description }}</span
                  >
                  <div class="vid-bottom">
                    <span class="vid-tag"
                      >{{ mt.label }} ·
                      {{ videoTime(getVideo(member.id, mt.key)) }}</span
                    >
                    <button class="like-btn" :class="{ liked: getVideo(member.id, mt.key).liked }" @click.stop="toggleLike(getVideo(member.id, mt.key), $event)">
                      <span class="heart-icon">♥</span>
                    </button>
                  </div>
                </div>
                <div v-else-if="isMe(member.id)" class="video-thumb upload-slot" @click="openUpload(mt.key)">
                  <i class="ti ti-upload"></i><span>업로드</span>
                </div>
                <div v-else class="video-thumb empty"><i class="ti ti-minus"></i></div>
              </div>
            </div>
          </div>
          <div v-if="teamMembers.length === 0" class="empty-feed">
            멤버 정보를 불러올 수 없습니다.
          </div>
        </section>
      </main>
    </div>

    <!-- 업로드 모달 -->
    <div
      v-if="uploadModal.open"
      class="modal-overlay"
      @click.self="closeUpload"
    >
      <div class="modal-box">
        <div class="modal-header">
          <h3 class="modal-title">
            {{ mealTypes.find((m) => m.key === uploadModal.mealType)?.label }}
            업로드
          </h3>
          <button class="modal-close" @click="closeUpload">✕</button>
        </div>
        <form @submit.prevent="submitUpload">
          <div v-if="videoPreviewUrl" class="preview-wrap">
            <video
              :src="videoPreviewUrl"
              class="preview-video"
              autoplay
              loop
              muted
              playsinline
              preload="metadata"
            ></video>

            <textarea
              ref="memoTextRef"
              v-model="uploadModal.description"
              class="memo-direct"
              placeholder="메모 입력..."
              maxlength="30"
              rows="2"
            ></textarea>
            <span class="memo-counter"
              >{{ uploadModal.description.length }}/30</span
            >

            <div class="change-btns">
              <button type="button" class="btn-change-file" @click="uploadFileInput.click()" title="파일 선택">
                <i class="ti ti-folder-open"></i>
              </button>
              <button type="button" class="btn-change-file" @click="openGroupCamera" title="카메라 재촬영">
                <i class="ti ti-camera"></i>
              </button>
            </div>
          </div>

          <div v-else class="file-drop-area">
            <button type="button" class="drop-btn" @click="uploadFileInput.click()">
              <i class="ti ti-folder-open" style="font-size:24px"></i>
              <span>파일 선택</span>
            </button>
            <span class="drop-or">또는</span>
            <button type="button" class="drop-btn camera-btn" @click="openGroupCamera">
              <i class="ti ti-camera" style="font-size:24px"></i>
              <span>카메라 촬영</span>
            </button>
          </div>

          <input
            ref="uploadFileInput"
            type="file"
            accept="video/*"
            @change="onUploadFileChange"
            style="display: none"
          />

          <div class="modal-actions">
            <button type="button" @click="closeUpload" class="btn-cancel">
              취소
            </button>
            <button
              type="submit"
              class="btn-submit"
              :disabled="!uploadModal.file"
            >
              업로드
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 카메라 촬영 오버레이 -->
    <Teleport to="body">
      <div v-if="showGroupCamera" class="camera-overlay">
        <video ref="groupCameraVideoEl" class="camera-feed" autoplay playsinline muted></video>
        <div class="camera-ui">
          <button v-if="!groupIsRecording" type="button" class="btn-close-camera" @click="stopGroupCamera">✕</button>
          <div class="camera-tip" v-if="!groupIsRecording">음식을 화면에 맞추고 촬영 버튼을 누르세요</div>
          <div class="camera-bottom">
            <div v-if="groupIsRecording" class="record-progress-wrap">
              <div class="record-label">
                <span class="rec-dot"></span> 촬영 중...
              </div>
              <div class="record-progress-bar">
                <div class="record-fill" :style="{ width: groupRecordProgress + '%' }"></div>
              </div>
            </div>
            <button v-if="!groupIsRecording" type="button" class="btn-shutter" @click="startGroupRecording">
              <span class="shutter-inner"></span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 비디오 상세 모달 -->
    <VideoDetailModal
      v-if="detailModal.open && detailModal.video"
      :video="detailModal.video"
      :myUserId="auth?.loginUser?.value?.id ?? auth?.loginUser?.id"
      @close="detailModal.open = false"
      @deleted="onVideoDeleted"
      @reupload="onReupload"
      @updated="onVideoUpdated"
    />

    <!-- 그룹 설정 모달 -->
    <div v-if="showSettings" class="modal-overlay" @click.self="showSettings = false">
      <div class="modal-box settings-box">
        <div class="modal-header">
          <h3 class="modal-title">그룹 설정</h3>
          <button class="modal-close" @click="showSettings = false">✕</button>
        </div>
        <div class="settings-actions">
          <button v-if="!isKing" class="btn-leave" @click="leaveTeam">
            <i class="ti ti-logout"></i> 그룹 나가기
          </button>

          <button v-if="isKing" class="btn-delete" @click="deleteTeam">
            <i class="ti ti-trash"></i> 그룹 삭제하기 (방장 전용)
          </button>

          <p v-if="isKing" class="settings-warning">※ 방장은 팀을 나갈 수 없으며, 팀 자체를 삭제해야 합니다.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  watch,
  inject,
  onMounted,
  onUnmounted,
  nextTick,
} from "vue";
import axios from "axios";
import { useStore } from "../composables/useStore.js";
import { useToast } from "../composables/useToast.js";
import VideoDetailModal from "../components/VideoDetailModal.vue";

const { goTo, goBack } = inject("navigation");
const auth = inject("auth");
const { selectedGroup } = useStore();
const { showToast } = useToast();

const teamMembers = ref([]);
const videoMap = ref({});
const loading = ref(false);
const showCalendar = ref(false);
const dailyAiFeedback = ref("");
const evaluatingDailyAi = ref(false);
const dailyAiError = ref(false);
const ANALYSIS_POLL_INTERVAL_MS = 3000;
const ANALYSIS_POLL_MAX_ATTEMPTS = 40;
const TEAM_REFRESH_INTERVAL_MS = 10000;
let analysisPollTimer = null;
let analysisPollAttempts = 0;
let teamRefreshTimer = null;

// ── 그룹 설정(방장/나가기/추방) ──
const teamInfo = ref(null);
const showSettings = ref(false);

const isKing = computed(() => {
  const myId = auth?.loginUser?.value?.id ?? auth?.loginUser?.id;
  return teamInfo.value?.kingId === myId;
});

async function leaveTeam() {
  if (!confirm("정말 이 그룹을 나가시겠습니까?")) return;
  try {
    await axios.delete(`/api/teams/${selectedGroup.value.id}/leave`);
    showToast("success", "그룹을 무사히 나갔습니다.");
    showSettings.value = false;
    goTo("groups");
  } catch (e) {
    showToast("error", "나가기 실패", e.response?.data || "서버 오류");
  }
}

async function deleteTeam() {
  if (!confirm("그룹을 완전히 삭제하시겠습니까?\n모든 기록과 팀원이 함께 삭제되며 복구할 수 없습니다.")) return;
  try {
    await axios.delete(`/api/teams/${selectedGroup.value.id}`);
    showToast("success", "그룹이 완전히 삭제되었습니다.");
    showSettings.value = false;
    goTo("groups");
  } catch (e) {
    showToast("error", "삭제 실패", e.response?.data || "서버 오류");
  }
}

async function kickMember(memberId, memberName) {
  if (!confirm(`정말 ${memberName}님을 이 그룹에서 추방하시겠습니까?`)) return;
  try {
    await axios.delete(`/api/teams/${selectedGroup.value.id}/members/${memberId}`);
    showToast("success", `${memberName}님을 추방했습니다.`);
    await loadTeamDetail();
    await loadVideos();
  } catch (e) {
    showToast("error", "추방 실패", e.response?.data || "서버 오류");
  }
}

function spawnHearts(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < 6; i++) {
    const el = document.createElement("span");
    el.textContent = "♥";
    Object.assign(el.style, {
      position: "fixed",
      left: cx + "px",
      top: cy + "px",
      fontSize: "18px",
      color: "#ff2d55",
      pointerEvents: "none",
      zIndex: "9999",
      transform: "translateX(-50%)",
      userSelect: "none",
    });
    document.body.appendChild(el);
    const dx = (Math.random() - 0.5) * 70;
    const dy = -(60 + Math.random() * 50);
    el.animate(
      [
        {
          opacity: 1,
          transform: `translateX(-50%) translateY(0px) scale(0.5)`,
        },
        {
          opacity: 1,
          transform: `translateX(calc(-50% + ${dx * 0.4}px)) translateY(${dy * 0.5}px) scale(1.3)`,
          offset: 0.35,
        },
        {
          opacity: 0,
          transform: `translateX(calc(-50% + ${dx}px)) translateY(${dy}px) scale(0.8)`,
        },
      ],
      { duration: 850, easing: "ease-out" },
    ).onfinish = () => el.remove();
  }
}

watch(showCalendar, (val) => {
  if (val || isWide.value) selectDay(selectedDay.value);
});

const mealTypes = [
  { key: "BREAKFAST", label: "아침" },
  { key: "LUNCH", label: "점심" },
  { key: "DINNER", label: "저녁" },
];

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
const feedDateObj = ref(new Date());
const feedDate = computed(() => toDateStr(feedDateObj.value));

function syncCalendarFromFeed(d) {
  currentYear.value = d.getFullYear();
  currentMonth.value = d.getMonth();
  selectedDay.value = d.getDate();
}
function prevDay() {
  const d = new Date(feedDateObj.value);
  d.setDate(d.getDate() - 1);
  feedDateObj.value = d;
  syncCalendarFromFeed(d);
  loadVideos();
  selectDay(d.getDate());
}
function nextDay() {
  const d = new Date(feedDateObj.value);
  d.setDate(d.getDate() + 1);
  feedDateObj.value = d;
  syncCalendarFromFeed(d);
  loadVideos();
  selectDay(d.getDate());
}

function isMe(memberId) {
  return (
    auth.loginUser.value?.id != null && auth.loginUser.value.id == memberId
  );
}
function getVideo(userId, mealType) {
  return videoMap.value[`${userId}_${mealType}`] || null;
}

// 🌟 teamInfo(방장 정보 등) 저장이 빠지지 않도록 유지
const loadTeamDetail = async () => {
  if (!selectedGroup.value?.id) return;
  try {
    const res = await axios.get(`/api/teams/${selectedGroup.value.id}`);
    teamInfo.value = res.data.teamInfo;
    teamMembers.value = res.data.members || [];
  } catch (e) {
    const myId = auth.loginUser.value?.id ?? auth.loginUser?.id;
    teamMembers.value = [
      { id: myId, nickName: "나", profileImg: "" },
    ];
  }
};

const loadVideos = async () => {
  if (!selectedGroup.value?.id) return;
  try {
    const res = await axios.post("/graphql", {
      query: `query GetTeamVideos($teamId: ID, $date: String!) {
        videos(teamId: $teamId, date: $date) {
          id userId uploaderNickName teamId mealType mealDate videoUrl
          description calories carbs protein fat aiComment likeCount liked createdAt
          status
        }
      }`,
      variables: { teamId: String(selectedGroup.value.id), date: feedDate.value },
    });
    const map = {};
    const list = res.data?.data?.videos ?? [];
    list.forEach((v) => {
      map[`${v.userId}_${v.mealType}`] = v;
    });
    videoMap.value = map;
  } catch (e) {
    videoMap.value = {};
  }
};

function hasPendingAnalysis() {
  return [...Object.values(videoMap.value), ...Object.values(calendarVideoMap.value)]
    .some((v) => String(v?.status || "").toUpperCase() === "PENDING");
}

function stopAnalysisPolling() {
  if (analysisPollTimer) {
    clearInterval(analysisPollTimer);
    analysisPollTimer = null;
  }
  analysisPollAttempts = 0;
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

  try {
    await loadVideos();
    await selectDay(selectedDay.value, { resetPolling: false });
    if (!hasPendingAnalysis()) {
      stopAnalysisPolling();
    }
  } catch (e) {
    console.error("AI 분석 상태 갱신 실패:", e);
  }
}

function stopTeamRefresh() {
  if (teamRefreshTimer) {
    clearInterval(teamRefreshTimer);
    teamRefreshTimer = null;
  }
}

function startTeamRefresh() {
  if (teamRefreshTimer) return;
  teamRefreshTimer = setInterval(refreshTeamVideos, TEAM_REFRESH_INTERVAL_MS);
}

async function refreshTeamVideos() {
  try {
    await loadVideos();
    if (hasPendingAnalysis()) startAnalysisPolling();
  } catch (e) {
    console.error("그룹 영상 갱신 실패:", e);
  }
}

onMounted(async () => {
  loading.value = true;
  await loadTeamDetail();
  await loadVideos();
  loading.value = false;
  selectDay(selectedDay.value);
  startTeamRefresh();
});

const uploadModal = ref({
  open: false,
  mealType: "",
  description: "",
  file: null,
});

const detailModal = ref({ open: false, video: null });
function openDetail(video) {
  detailModal.value = { open: true, video };
}
function handleVideoClick(e, video) {
  if (e.target.closest(".like-btn")) return;
  openDetail(video);
}
function onVideoDeleted(videoId) {
  const key = Object.keys(videoMap.value).find(
    (k) => videoMap.value[k]?.id === videoId,
  );
  if (key) delete videoMap.value[key];
  videoMap.value = { ...videoMap.value };
}

function patchVideoInMap(sourceMap, updated) {
  const key = Object.keys(sourceMap.value).find(
    (k) => sourceMap.value[k]?.id === updated.id,
  );
  if (!key) return;
  sourceMap.value = {
    ...sourceMap.value,
    [key]: {
      ...sourceMap.value[key],
      ...updated,
    },
  };
}

function onVideoUpdated(updated) {
  patchVideoInMap(videoMap, updated);
  patchVideoInMap(calendarVideoMap, updated);
  if (detailModal.value.video?.id === updated.id) {
    detailModal.value = {
      ...detailModal.value,
      video: {
        ...detailModal.value.video,
        ...updated,
      },
    };
  }
}

function onReupload({ videoId, teamId, mealType, mealDate }) {
  onVideoDeleted(videoId);
  openUpload(mealType);
}

async function toggleLike(video, e) {
  if (!video?.id) return;
  try {
    const res = await axios.post(`/api/videos/${video.id}/like`);
    const key = Object.keys(videoMap.value).find(
      (k) => videoMap.value[k]?.id === video.id,
    );
    if (key) {
      videoMap.value = {
        ...videoMap.value,
        [key]: {
          ...videoMap.value[key],
          liked: res.data.liked,
          likeCount: res.data.count,
        },
      };
    }
    if (res.data.liked && e) spawnHearts(e);
  } catch {}
}

const uploadFileInput = ref(null);
const videoPreviewUrl = ref(null);
const memoTextRef = ref(null);

const showGroupCamera = ref(false);
const groupCameraVideoEl = ref(null);
const groupCameraStream = ref(null);
const groupIsRecording = ref(false);
const groupRecordProgress = ref(0);
let groupMediaRecorder = null;
let groupRecordedChunks = [];
let groupProgressTimer = null;

watch(videoPreviewUrl, async (url) => {
  if (url) {
    await nextTick();
    setTimeout(() => memoTextRef.value?.focus(), 80);
  }
});

function openUpload(mealType) {
  uploadModal.value = { open: true, mealType, description: "", file: null };
  videoPreviewUrl.value = null;
}
function closeUpload() {
  stopGroupCamera();
  if (videoPreviewUrl.value) {
    URL.revokeObjectURL(videoPreviewUrl.value);
    videoPreviewUrl.value = null;
  }
  uploadModal.value.open = false;
}
function onUploadFileChange(e) {
  if (!e.target.files.length) return;
  const file = e.target.files[0];
  uploadModal.value.file = file;
  if (videoPreviewUrl.value) URL.revokeObjectURL(videoPreviewUrl.value);
  videoPreviewUrl.value = URL.createObjectURL(file);
}

async function openGroupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });
    groupCameraStream.value = stream;
    showGroupCamera.value = true;
    await nextTick();
    if (groupCameraVideoEl.value) groupCameraVideoEl.value.srcObject = stream;
  } catch {
    showToast("error", "카메라를 열 수 없습니다.", "카메라 권한을 허용해 주세요.");
  }
}

function startGroupRecording() {
  if (!groupCameraStream.value || groupIsRecording.value) return;
  groupRecordedChunks = [];
  groupRecordProgress.value = 0;
  groupIsRecording.value = true;

  const mimeType =
    ["video/mp4", "video/webm;codecs=vp9", "video/webm"].find((t) =>
      MediaRecorder.isTypeSupported(t),
    ) || "";
  groupMediaRecorder = new MediaRecorder(
    groupCameraStream.value,
    mimeType ? { mimeType } : {},
  );

  groupMediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) groupRecordedChunks.push(e.data);
  };
  groupMediaRecorder.onstop = () => {
    const blob = new Blob(groupRecordedChunks, { type: mimeType || "video/webm" });
    const ext = mimeType.includes("mp4") ? "mp4" : "webm";
    const file = new File([blob], `meal_${Date.now()}.${ext}`, { type: blob.type });
    uploadModal.value.file = file;
    if (videoPreviewUrl.value) URL.revokeObjectURL(videoPreviewUrl.value);
    videoPreviewUrl.value = URL.createObjectURL(blob);
    stopGroupCamera();
  };

  groupMediaRecorder.start();
  const startTime = Date.now();
  groupProgressTimer = setInterval(() => {
    groupRecordProgress.value = Math.min(100, ((Date.now() - startTime) / 2000) * 100);
  }, 30);

  setTimeout(() => {
    clearInterval(groupProgressTimer);
    groupRecordProgress.value = 100;
    if (groupMediaRecorder?.state === "recording") groupMediaRecorder.stop();
    groupIsRecording.value = false;
  }, 2000);
}

function stopGroupCamera() {
  clearInterval(groupProgressTimer);
  if (groupCameraStream.value) {
    groupCameraStream.value.getTracks().forEach((t) => t.stop());
    groupCameraStream.value = null;
  }
  showGroupCamera.value = false;
  groupIsRecording.value = false;
}

// 🔧 [수정] presigned S3 업로드는 axios가 아니라 fetch로 보내야 합니다.
// axios 인스턴스에 Authorization 헤더 인터셉터가 걸려 있으면, presigned URL에
// 서명되지 않은 헤더가 함께 전송되어 S3가 403/CORS 오류로 거부합니다.
// 또한 presigned 시도는 운영(S3) 환경에서만 하고, 로컬 개발(DEV)에서는
// 곧바로 multipart fallback을 쓰도록 원복합니다.
const submitUpload = async () => {
  if (!uploadModal.value.file) return;
  const file = uploadModal.value.file;
  const contentType = file.type || "video/mp4";
  try {
    let presigned = null;
    if (!import.meta.env.DEV) {
      try {
        const res = await axios.get("/api/videos/presigned-upload", {
          params: { contentType },
        });
        presigned = res.data;
      } catch {
        // presigned 미지원 시 multipart fallback
      }
    }

    if (presigned) {
      // S3 presigned PUT — axios 기본 헤더(Authorization 등) 제외하려고 fetch 사용
      const s3Res = await fetch(presigned.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": contentType },
      });
      if (!s3Res.ok) throw new Error(`S3 업로드 실패: ${s3Res.status}`);
      await axios.post("/api/videos/register", {
        key: presigned.key,
        teamId: selectedGroup.value.id,
        mealType: uploadModal.value.mealType,
        mealDate: feedDate.value,
        description: uploadModal.value.description || "",
      });
    } else {
      const formData = new FormData();
      formData.append("teamId", selectedGroup.value.id);
      formData.append("mealType", uploadModal.value.mealType);
      formData.append("mealDate", feedDate.value);
      if (uploadModal.value.description)
        formData.append("description", uploadModal.value.description);
      formData.append("videoFile", file);
      await axios.post("/api/videos/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }

    closeUpload();
    await loadVideos();
    await selectDay(selectedDay.value);
  } catch (e) {
    showToast("error", "업로드 실패", e.response?.data || "서버 오류");
  }
};

// ── 달력 ──
const today = new Date();
const currentYear = ref(today.getFullYear());
const currentMonth = ref(today.getMonth());
const selectedDay = ref(today.getDate());
const monthLabel = computed(
  () => `${currentYear.value}년 ${currentMonth.value + 1}월`,
);

function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}
function firstDayOfWeek(y, m) {
  return new Date(y, m, 1).getDay();
}
const calendarCells = computed(() => {
  const total = daysInMonth(currentYear.value, currentMonth.value);
  const offset = firstDayOfWeek(currentYear.value, currentMonth.value);
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
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

const calendarVideoMap = ref({});
function calDateStr(day) {
  return `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

async function requestDailyEvaluation(dateStr) {
  if (myDayRecord.value.calories <= 0) {
    dailyAiFeedback.value = "";
    dailyAiError.value = false;
    return;
  }

  evaluatingDailyAi.value = true;
  dailyAiError.value = false;
  try {
    const res = await axios.post(
      `/api/logs/daily/evaluate?date=${dateStr}`,
      null,
      {
        headers: authHeaders(),
      },
    );
    dailyAiFeedback.value = formatAiComment(res.data?.aiComment);
  } catch (e) {
    console.error("AI 피드백 생성 실패:", e);
    const cached = await fetchDailyAiComment(dateStr);
    if (!cached) {
      dailyAiError.value = true;
      dailyAiFeedback.value =
        "AI 피드백을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
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

async function selectDay(d, { resetPolling = true } = {}) {
  if (resetPolling) stopAnalysisPolling();
  selectedDay.value = d;
  feedDateObj.value = new Date(currentYear.value, currentMonth.value, d);
  loadVideos();
  if (!selectedGroup.value?.id) return;
  try {
    const res = await axios.post("/graphql", {
      query: `query GetTeamVideos($teamId: ID, $date: String!) {
        videos(teamId: $teamId, date: $date) {
          id userId uploaderNickName teamId mealType mealDate videoUrl
          description calories carbs protein fat aiComment likeCount liked createdAt status
        }
      }`,
      variables: { teamId: String(selectedGroup.value.id), date: calDateStr(d) },
    });
    const map = {};
    const list = res.data?.data?.videos ?? [];
    list.forEach((v) => {
      map[`${v.userId}_${v.mealType}`] = v;
    });
    calendarVideoMap.value = map;
    await requestDailyEvaluation(calDateStr(d));
    if (resetPolling) startAnalysisPolling();
  } catch (e) {
    console.error("달력 영상 로드 실패:", e);
  }
}

function getCalVideo(userId, mealType) {
  return calendarVideoMap.value[`${userId}_${mealType}`] || null;
}
function memberMeals(memberId) {
  return mealTypes
    .map((mt) => ({ ...mt, video: getCalVideo(memberId, mt.key) }))
    .filter((mt) => mt.video);
}

const myDayRecord = computed(() => {
  const myId = auth?.loginUser?.value?.id ?? auth?.loginUser?.id;
  const myVideos = mealTypes.map((mt) => getCalVideo(myId, mt.key)).filter((v) => v);
  const totals = myVideos.reduce(
    (acc, v) => {
      acc.calories += v.calories || 0;
      acc.carbs += v.carbs || 0;
      acc.protein += v.protein || 0;
      acc.fat += v.fat || 0;
      return acc;
    },
    { calories: 0, carbs: 0, protein: 0, fat: 0 },
  );
  let aiComment = dailyAiFeedback.value;
  if (evaluatingDailyAi.value) {
    aiComment = "AI가 오늘의 영양 균형을 분석하는 중입니다...";
  } else if (!aiComment) {
    if (myVideos.length === 0) aiComment = "이 날 기록된 나의 식단이 없습니다.";
    else aiComment = "분석 완료 후 AI 식단 피드백이 표시됩니다.";
  }
  return {
    calories: Math.round(totals.calories),
    targetCalories: 2200,
    carbs: Math.round(totals.carbs),
    targetCarbs: 275,
    protein: Math.round(totals.protein),
    targetProtein: 110,
    fat: Math.round(totals.fat),
    targetFat: 60,
    aiComment,
  };
});

function hasRecordInMonth(day) {
  if (day === selectedDay.value) {
    const myId = auth?.loginUser?.value?.id ?? auth?.loginUser?.id;
    return mealTypes.some((mt) => getCalVideo(myId, mt.key));
  }
  return false;
}

function calPercent(val, total) {
  return Math.min(100, Math.round((val / total) * 100));
}

// 🔧 [복원] 영상 카드에 업로드/촬영 시각을 표시하기 위한 함수 (수정 중 누락되어 있었음)
const MEAL_DEMO_TIMES = { BREAKFAST: "08:23", LUNCH: "12:45", DINNER: "19:12" };
function videoTime(video) {
  if (!video) return null;
  const ts = video.uploadedAt || video.createdAt || video.recordedAt;
  if (ts) {
    const d = new Date(ts);
    if (!isNaN(d))
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return MEAL_DEMO_TIMES[video.mealType] || null;
}

// ── 반응형 ──
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
  stopTeamRefresh();
  stopGroupCamera();
  if (videoPreviewUrl.value) URL.revokeObjectURL(videoPreviewUrl.value);
});

// ── 모바일 스와이프 + 마우스 드래그 ──
const activeMealIdx = ref(0);
let touchStartX = 0;
let touchStartY = 0;
let swipeEnabled = false;

function onTouchStart(e) {
  if (e.target.closest(".like-btn")) {
    swipeEnabled = false;
    return;
  }
  swipeEnabled = true;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}
function onTouchEnd(e) {
  if (!swipeEnabled) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx)) return;
  if (dx < 0 && activeMealIdx.value < mealTypes.length - 1)
    activeMealIdx.value++;
  else if (dx > 0 && activeMealIdx.value > 0) activeMealIdx.value--;
}

let mouseStartX = 0;
const isDragging = ref(false);
function onMouseDown(e) {
  mouseStartX = e.clientX;
  isDragging.value = true;
}
function onMouseUp(e) {
  if (!isDragging.value) return;
  isDragging.value = false;
  const dx = e.clientX - mouseStartX;
  if (Math.abs(dx) >= 40) {
    if (dx < 0 && activeMealIdx.value < mealTypes.length - 1)
      activeMealIdx.value++;
    else if (dx > 0 && activeMealIdx.value > 0) activeMealIdx.value--;
  }
}
</script>

<style scoped>
/* 🌟 방장 배지 */
.king-badge {
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  background: #f59e0b;
  padding: 2px 6px;
  border-radius: 12px;
  margin-left: 4px;
}

/* 🌟 추방 버튼 */
.kick-btn {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  color: #ef4444;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.kick-btn:hover {
  background: #fee2e2;
}

/* 🌟 설정 모달 */
.settings-box {
  max-width: 320px;
}
.settings-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.btn-leave {
  width: 100%;
  padding: 14px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}
.btn-delete {
  width: 100%;
  padding: 14px;
  background: #fef2f2;
  color: #dc2626;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}
.settings-warning {
  margin-top: 8px;
  font-size: 11px;
  color: #888;
  text-align: center;
  line-height: 1.4;
}

.screen {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-secondary, #f7f7f7);
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light, #e5e5e5);
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  flex-shrink: 0;
}
.group-title-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.group-header-img {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.group-title {
  font-size: 16px;
  font-weight: 700;
  color: #000;
  line-height: 1;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: #333;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  transition: background 0.15s;
}
.icon-btn:active {
  background: #f5f5f5;
}

@media (max-width: 767px) {
  .header {
    height: 48px;
    padding: 0 12px;
    gap: 6px;
  }
  .group-title-wrap {
    gap: 6px;
  }
  .group-header-img {
    width: 26px;
    height: 26px;
  }
  .group-title {
    font-size: 15px;
  }
  .header-actions {
    gap: 2px;
  }
  .icon-btn {
    width: 32px;
    height: 32px;
    font-size: 18px;
  }
}

.scroll-body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.feed-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.desktop-split {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.left-panel {
  width: 33%;
  min-width: 260px;
  max-width: 380px;
  overflow-y: auto;
  background: #fff;
  border-right: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 16px 24px;
}
.right-panel {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 24px;
}

.chat-btn-desk {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #e8909e;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
}
.chat-btn-desk:hover {
  opacity: 0.85;
}

.feed-controls-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  gap: 8px;
}
.feed-date-compact {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 700;
  color: #555;
  white-space: nowrap;
}
.feed-date-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 700;
  color: #555;
  padding: 10px 16px 0;
}
@media (min-width: 768px) and (max-width: 1199px) {
  .feed-date-label {
    padding: 10px 16px;
  }
}
.feed-date-label.desk-date {
  justify-content: center;
  gap: 12px;
}
.date-nav-btn {
  background: none;
  border: none;
  color: #bbb;
  font-size: 16px;
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition:
    background 0.15s,
    color 0.15s;
}
.date-nav-btn:hover {
  background: #f0f0f0;
  color: #000;
}

.loading-msg,
.empty-feed {
  text-align: center;
  padding: 40px;
  color: #aaa;
  font-size: 14px;
}

.feed {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 12px;
}
.member-log {
  background: #fff;
  border-radius: 16px;
  padding: 14px;
  border: 1px solid #e5e5e5;
}
.member-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #f0f4ff;
}
.member-avatar.mine {
  box-shadow: 0 0 0 2px #000;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.member-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #000;
}
.mine-badge {
  font-size: 10px;
  font-weight: 700;
  color: #000000;
  background: #eeeeee;
  border: 1px solid #fff;
  padding: 2px 7px;
  border-radius: 20px;
  margin-left: 4px;
}

.meal-slots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.meal-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.video-wrap {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}
.meal-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.vid-bottom {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 2;
}
.like-btn {
  margin-left: auto;
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s;
}
.like-btn:active {
  transform: scale(1.3);
}
.heart-icon {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.25);
  -webkit-text-stroke: 1.8px #fff;
  transition:
    color 0.15s,
    -webkit-text-stroke 0.15s;
  line-height: 1;
}
.like-btn.liked .heart-icon {
  color: #ff2d55;
  -webkit-text-stroke: 1.8px #fff;
}

.vid-tag {
  background: rgba(0, 0, 0, 0.48);
  border-radius: 6px;
  padding: 4px 9px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  white-space: nowrap;
}

.video-thumb {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 18px;
}
.video-thumb.empty {
  background: #f5f5f5;
  border: 1.5px dashed #ddd;
  color: #ccc;
}
.video-thumb.upload-slot {
  background: #f5f5f5;
  border: 1.5px dashed #999999;
  color: #999999;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: background 0.15s;
}
.video-thumb.upload-slot span {
  font-size: 10px;
  font-weight: 600;
}
.video-thumb.upload-slot:hover {
  background: #ebebeb;
}

.meal-tab-bar {
  display: flex;
  gap: 4px;
}
.meal-tab {
  padding: 5px 12px;
  border-radius: 20px;
  background: #f0f0f0;
  border: none;
  font-size: 12px;
  font-weight: 600;
  color: #888;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
  white-space: nowrap;
}
.meal-tab.active {
  background: #e8909e;
  color: #fff;
}

.feed-mobile {
  display: grid;
  grid-template-columns: 1fr 1fr;
  user-select: none;
}
.member-log-mobile {
  width: 100%;
}
.video-wrap-full {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  position: relative;
}
.meal-video-full {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.vid-member-top {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 3;
}
.vid-member-top .member-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #f0f4ff;
  box-shadow: 0 0 0 1.5px rgba(255, 255, 255, 0.8);
}
.vid-member-top .member-avatar.mine {
  box-shadow: 0 0 0 2px #fff;
}
.vid-member-top .member-name {
  flex: 1;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}
.vid-member-top .mine-badge {
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.4);
  padding: 2px 7px;
  border-radius: 20px;
}
.member-name-dark {
  flex: 1;
  font-size: 13px;
  font-weight: 700;
  color: #555;
}

.upload-full,
.empty-full {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
}
.upload-full {
  background: #fff5f7;
  border-top: 1px dashed #f4b8c4;
  color: #e8909e;
  cursor: pointer;
}
.upload-full i,
.empty-full i {
  font-size: 22px;
}
.empty-full {
  background: #f0f0f0;
  border-top: 1px solid #e5e5e5;
  color: #bbb;
}

.calendar-panel {
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.cal-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cal-month {
  font-size: 15px;
  font-weight: 700;
}
.cal-arrow {
  background: none;
  border: none;
  color: #888;
  font-size: 18px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.cal-weekdays span {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: #aaa;
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.cal-cell {
  min-height: 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  transition: background 0.15s;
}
.cal-cell.empty {
  cursor: default;
}
.cal-cell:not(.empty):active {
  background: #f5f5f5;
}
.cal-cell.selected {
  background: #f5f5f5;
  border: 1px solid #d7d7d7;
}
.cal-num {
  font-size: 12px;
  color: #333;
  line-height: 1;
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
  background-color: #059669;
}

.day-record {
  background: #f7f7f7;
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.day-record-title {
  font-size: 13px;
  font-weight: 700;
  color: #000;
}
.day-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bar-label {
  font-size: 11px;
  font-weight: 600;
  color: #666;
  width: 36px;
  flex-shrink: 0;
}
.bar-track {
  flex: 1;
  height: 6px;
  background: #e5e5e5;
  border-radius: 99px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: #e8909e;
  border-radius: 99px;
  transition: width 0.4s;
}
.bar-fill.protein {
  background: #10b981;
}
.bar-fill.carbs {
  background: #3b82f6;
}
.bar-fill.fat {
  background: #f59e0b;
}
.bar-val {
  font-size: 10px;
  color: #888;
  width: 75px;
  text-align: right;
  flex-shrink: 0;
}
.day-ai {
  font-size: 12px;
  color: #666;
  line-height: 1.6;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.ai-chip {
  font-size: 10px;
  font-weight: 700;
  background: #000;
  color: #fff;
  padding: 2px 6px;
  border-radius: 20px;
  flex-shrink: 0;
  margin-top: 1px;
}
.retry-ai-btn {
  align-self: flex-start;
  border: none;
  border-radius: 10px;
  background: #0f172a;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  padding: 9px 14px;
}

.member-summary-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.summary-title {
  font-size: 12px;
  font-weight: 700;
  color: #888;
  padding: 10px 2px 5px;
  border-top: 1px solid #e5e5e5;
  margin-top: 4px;
}
.summary-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fff;
  border-radius: 12px;
  padding: 10px 12px;
}
.summary-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.summary-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.order {
  flex-direction: row;
  justify-content: space-between;
}
.summary-name {
  font-size: 13px;
  font-weight: 700;
  color: #000;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 2px;
}
.summary-meals {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}
.summary-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.summary-meal-type {
  font-size: 10px;
  font-weight: 700;
  background: #f0f0f0;
  color: #555;
  padding: 2px 6px;
  border-radius: 10px;
  flex-shrink: 0;
}
.summary-no-record {
  font-size: 12px;
  color: #bbb;
}
.summary-macros {
  display: flex;
  gap: 4px;
  align-items: center;
}
.summary-macros.empty span {
  font-size: 11px;
  color: #9ca3af;
  font-style: italic;
}
.s-mac {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 4px;
  white-space: nowrap;
}
.s-mac.c {
  background: #eff6ff;
  color: #2563eb;
}
.s-mac.p {
  background: #ecfdf5;
  color: #059669;
}
.s-mac.f {
  background: #fffbeb;
  color: #d97706;
}
.s-mac.k {
  background: #f1f5f9;
  color: #334155;
  margin-left: 2px;
}

.vid-center-desc {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 24px);
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  pointer-events: none;
  line-height: 1.4;
  word-break: keep-all;
  z-index: 2;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  background: #fff;
  padding: 20px;
  border-radius: 18px;
  width: 100%;
  max-width: 400px;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}
.modal-close {
  background: none;
  border: none;
  font-size: 16px;
  color: #888;
  cursor: pointer;
}

.file-drop-area {
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 10px;
  border: 1.5px dashed #e0e0e0;
  border-radius: 16px;
  padding: 20px 14px;
  background: #fafafa;
  margin-bottom: 14px;
}
.drop-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px 0;
  background: #fff;
  border: 1.5px solid #ebebeb;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.18s;
  flex: 1;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.drop-btn:hover {
  border-color: #e8909e;
  color: #e8909e;
  background: #fff5f7;
}
.camera-btn {
  background: #fff5f7;
  color: #e8909e;
  border-color: #f5c6ce;
}
.camera-btn:hover {
  background: #ffe0e8;
  color: #c0607a;
  border-color: #e8909e;
}
.drop-or {
  font-size: 12px;
  color: #ccc;
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.preview-wrap {
  width: 100%;
  aspect-ratio: 9/16;
  max-height: 52vh;
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  background: #000;
  margin-bottom: 14px;
}
.preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.memo-direct {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 32px);
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  line-height: 1.5;
  font-family: inherit;
  caret-color: #fff;
  z-index: 2;
}
.memo-direct::placeholder {
  color: rgba(255, 255, 255, 0.4);
  font-weight: 400;
}
.memo-counter {
  position: absolute;
  bottom: 10px;
  right: 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  z-index: 2;
  pointer-events: none;
}

.change-btns {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 6px;
  z-index: 3;
}
.btn-change-file {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  border: none;
  color: #fff;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.btn-change-file:hover {
  background: rgba(0, 0, 0, 0.65);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.btn-cancel {
  padding: 10px 18px;
  background: #f5f5f5;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
}
.btn-submit {
  padding: 10px 18px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
}
.btn-submit:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.video-thumb-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
}

.ai-analyzing-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(217, 83, 79, 0.9);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 9px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  animation: pulse 1.8s infinite ease-in-out;
}

.mini-nutri-preview {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 4px 6px;
  border-radius: 10px;
  display: flex;
  gap: 4px;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 9;
}

.m-tag {
  font-size: 10px;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 4px;
}
.m-tag.c {
  background: #e8f4ff;
  color: #2f80ed;
}
.m-tag.p {
  background: #fff0f0;
  color: #eb5757;
}
.m-tag.f {
  background: #fffde7;
  color: #b78306;
}
.m-tag.k {
  background: none;
  color: #fff;
  margin-left: 2px;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.75;
    transform: scale(0.97);
  }
}

@media (max-width: 767px) {
  input,
  textarea,
  select {
    font-size: 16px !important;
  }
  .memo-direct {
    font-size: 18px;
  }
}

@media (max-width: 390px) {
  .header {
    padding: 0 8px;
    gap: 4px;
  }
  .group-title {
    font-size: 13px;
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .icon-btn {
    width: 30px;
    height: 30px;
    font-size: 16px;
  }
}
</style>

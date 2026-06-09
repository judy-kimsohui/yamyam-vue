const E = (fill, fc, inner) =>
  `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="${fill}"/>${inner.replace(/\$c/g, fc)}</svg>`

export const emojis = {
  // 복숭아 / 활짝 아치 눈 / 열린 입
  great: E('#FFCCAA','#B06020',
    `<path d="M7.5 11 Q9 8.5 10.5 11" fill="none" stroke="$c" stroke-width="2.4" stroke-linecap="round"/>
     <path d="M13.5 11 Q15 8.5 16.5 11" fill="none" stroke="$c" stroke-width="2.4" stroke-linecap="round"/>
     <path d="M8 14.5 Q12 19.5 16 14.5" fill="white"/>
     <line x1="8" y1="14.5" x2="16" y2="14.5" stroke="$c" stroke-width="2" stroke-linecap="round"/>
     <path d="M8 14.5 Q12 19.5 16 14.5" fill="none" stroke="$c" stroke-width="2" stroke-linecap="round"/>`),
  // 파스텔 민트 / 아치 눈 / 미소
  happy: E('#B8EDB8','#3A7030',
    `<path d="M7.5 11 Q9 8.5 10.5 11" fill="none" stroke="$c" stroke-width="2.4" stroke-linecap="round"/>
     <path d="M13.5 11 Q15 8.5 16.5 11" fill="none" stroke="$c" stroke-width="2.4" stroke-linecap="round"/>
     <path d="M8.5 14.5 Q12 17.5 15.5 14.5" fill="none" stroke="$c" stroke-width="2.2" stroke-linecap="round"/>`),
  // 연한 민트 / 작은 아치 눈 / 작은 미소
  good: E('#C8F0C0','#3A7030',
    `<path d="M7.5 11 Q9 9.5 10.5 11" fill="none" stroke="$c" stroke-width="2.4" stroke-linecap="round"/>
     <path d="M13.5 11 Q15 9.5 16.5 11" fill="none" stroke="$c" stroke-width="2.4" stroke-linecap="round"/>
     <path d="M9 15 Q12 17 15 15" fill="none" stroke="$c" stroke-width="2.2" stroke-linecap="round"/>`),
  // 세이지 / 일자 눈(= =) / 평평한 입
  neutral: E('#B8D8A8','#3A5A25',
    `<line x1="7.5" y1="10.5" x2="10.5" y2="10.5" stroke="$c" stroke-width="2.4" stroke-linecap="round"/>
     <line x1="13.5" y1="10.5" x2="16.5" y2="10.5" stroke="$c" stroke-width="2.4" stroke-linecap="round"/>
     <line x1="8.5" y1="15" x2="15.5" y2="15" stroke="$c" stroke-width="2.2" stroke-linecap="round"/>`),
  // 연한 라벤더-블루 / 처진 눈 / 찡그린 입
  bad: E('#C8D8F0','#4055A0',
    `<line x1="7.5" y1="10" x2="10.5" y2="11" stroke="$c" stroke-width="2.4" stroke-linecap="round"/>
     <line x1="13.5" y1="11" x2="16.5" y2="10" stroke="$c" stroke-width="2.4" stroke-linecap="round"/>
     <path d="M8.5 16.5 Q12 14 15.5 16.5" fill="none" stroke="$c" stroke-width="2.2" stroke-linecap="round"/>`),
  // 블루그레이 / X X 눈 / 직사각형 입
  terrible: E('#C8D0E0','#405070',
    `<line x1="7.5" y1="8.5" x2="10.5" y2="11.5" stroke="$c" stroke-width="2.4" stroke-linecap="round"/>
     <line x1="10.5" y1="8.5" x2="7.5" y2="11.5" stroke="$c" stroke-width="2.4" stroke-linecap="round"/>
     <line x1="13.5" y1="8.5" x2="16.5" y2="11.5" stroke="$c" stroke-width="2.4" stroke-linecap="round"/>
     <line x1="16.5" y1="8.5" x2="13.5" y2="11.5" stroke="$c" stroke-width="2.4" stroke-linecap="round"/>
     <rect x="8.5" y="14" width="7" height="4.5" rx="2.2" fill="white" stroke="$c" stroke-width="1.8"/>`),
  // 파스텔 노랑 / O O 눈 / O 입
  excited: E('#FFF0A0','#906820',
    `<circle cx="9" cy="10" r="2.2" fill="none" stroke="$c" stroke-width="2"/>
     <circle cx="15" cy="10" r="2.2" fill="none" stroke="$c" stroke-width="2"/>
     <circle cx="12" cy="15.5" r="2.6" fill="white" stroke="$c" stroke-width="1.8"/>`),
  // 연한 라벤더 / 반쯤 감긴 눈 / 처진 입
  tired: E('#D8C8EC','#604888',
    `<line x1="7.5" y1="10.5" x2="10.5" y2="10.5" stroke="$c" stroke-width="2.4" stroke-linecap="round"/>
     <path d="M7.5 10.5 Q9 12.5 10.5 10.5" fill="#D8C8EC"/>
     <line x1="13.5" y1="10.5" x2="16.5" y2="10.5" stroke="$c" stroke-width="2.4" stroke-linecap="round"/>
     <path d="M13.5 10.5 Q15 12.5 16.5 10.5" fill="#D8C8EC"/>
     <path d="M9 15.5 Q12 17 15 15.5" fill="none" stroke="$c" stroke-width="2.2" stroke-linecap="round"/>`),
  // 파스텔 아쿠아 / X X 눈 / 구불 입
  sick: E('#B8ECD8','#2A7055',
    `<line x1="7.5" y1="8.5" x2="10.5" y2="11.5" stroke="$c" stroke-width="2.4" stroke-linecap="round"/>
     <line x1="10.5" y1="8.5" x2="7.5" y2="11.5" stroke="$c" stroke-width="2.4" stroke-linecap="round"/>
     <line x1="13.5" y1="8.5" x2="16.5" y2="11.5" stroke="$c" stroke-width="2.4" stroke-linecap="round"/>
     <line x1="16.5" y1="8.5" x2="13.5" y2="11.5" stroke="$c" stroke-width="2.4" stroke-linecap="round"/>
     <path d="M8 15.5 Q9.5 13.5 11 15.5 Q12.5 17.5 14 15.5 Q15.5 13.5 16 15" fill="none" stroke="$c" stroke-width="2" stroke-linecap="round"/>`),
  // 파스텔 핑크 / 화난 눈썹 + 점 눈 / 물결 입
  stressed: E('#F8C0C8','#A03050',
    `<line x1="7" y1="8.5" x2="10.5" y2="10" stroke="$c" stroke-width="2.4" stroke-linecap="round"/>
     <line x1="17" y1="8.5" x2="13.5" y2="10" stroke="$c" stroke-width="2.4" stroke-linecap="round"/>
     <circle cx="9" cy="11.5" r="1.5" fill="$c"/>
     <circle cx="15" cy="11.5" r="1.5" fill="$c"/>
     <path d="M8 16 Q9.5 14 11 16 Q12.5 18 14 16 Q15.5 14 16 15.5" fill="none" stroke="$c" stroke-width="2" stroke-linecap="round"/>`)
}

export const calendarData = {
  1: 'good', 2: 'great', 3: 'neutral', 4: 'good', 5: 'great', 6: 'great', 7: 'happy',
  8: 'tired', 9: 'bad', 10: 'good', 11: 'great', 12: 'excited', 13: 'happy', 14: 'stressed',
  15: 'neutral', 16: 'good', 17: 'bad', 18: 'neutral', 19: 'great', 20: 'happy', 21: 'excited',
  22: 'tired', 23: 'neutral', 24: 'good', 25: 'great', 26: 'happy', 27: 'neutral', 28: 'good',
  29: 'great', 30: 'excited'
}

export const initialFeedItems = [
  {
    id: 1, title: '고단백 닭가슴살 샐러드', calories: 320, protein: 42, carbs: 15, fat: 8,
    aiTag: 'AI: 오늘 단백질 목표 달성에 한 걸음!', img: '🥗', time: '오전 8:30'
  },
  {
    id: 2, title: '현미밥 + 된장국', calories: 480, protein: 18, carbs: 72, fat: 6,
    aiTag: 'AI: 균형 잡힌 한식 조합이네요', img: '🍚', time: '오후 12:15'
  },
  {
    id: 3, title: '오트밀 프로틴 볼', calories: 290, protein: 22, carbs: 38, fat: 9,
    aiTag: 'AI: 간식으로 훌륭한 선택!', img: '🥣', time: '오후 3:00'
  },
  {
    id: 4, title: '저녁: 연어 스테이크', calories: 520, protein: 48, carbs: 12, fat: 24,
    aiTag: 'AI: 오메가3 풍부, 완벽한 저녁!', img: '🐟', time: '오후 7:00'
  }
]

export const initialGroups = [
  { id: 1, name: '다이어트 챌린지', members: 12 },
  { id: 2, name: '헬스장 친구들', members: 5 },
  { id: 3, name: '직장인 건강관리', members: 8 }
]

export const groupMembers = [
  {
    id: 1, name: '나', avatar: '🙋', isMine: true,
    meals: {
      breakfast: { uploaded: true, emoji: '🥣', title: '프로틴 오트밀',    calories: 290, video: '/videos/mine_breakfast.mp4' },
      lunch:     { uploaded: true, emoji: '🥗', title: '닭가슴살 샐러드', calories: 320, video: '/videos/mine_lunch.mp4' },
      dinner:    { uploaded: true, emoji: '🍝', title: '파스타',           calories: 410, video: '/videos/mine_dinner.mp4' }
    }
  },
  {
    id: 2, name: '김민지', avatar: '😊',
    meals: {
      breakfast: { uploaded: true, emoji: '🍳', title: '계란 토스트',      calories: 210, video: '/videos/minji_breakfast.mp4' },
      lunch:     { uploaded: true, emoji: '🍱', title: '도시락 한식',      calories: 480, video: '/videos/minji_lunch.mp4' },
      dinner:    { uploaded: true, emoji: '🥦', title: '닭볶음 & 채소',    calories: 390, video: '/videos/minji_dinner.mp4' }
    }
  },
  {
    id: 3, name: '박지훈', avatar: '😎',
    meals: {
      breakfast: { uploaded: true, emoji: '🥤', title: '단백질 쉐이크',    calories: 180, video: '/videos/jihun_breakfast.mp4' },
      lunch:     { uploaded: true, emoji: '🍱', title: '비빔밥',           calories: 520, video: '/videos/jihun_lunch.mp4' },
      dinner:    { uploaded: true, emoji: '🐟', title: '연어 스테이크',    calories: 520, video: '/videos/jihun_dinner.mp4' }
    }
  },
  {
    id: 4, name: '이수현', avatar: '🤗',
    meals: {
      breakfast: { uploaded: true, emoji: '🍞', title: '토스트',           calories: 230, video: '/videos/suhyun_breakfast.mp4' },
      lunch:     { uploaded: true, emoji: '🍙', title: '김밥',             calories: 380, video: '/videos/suhyun_lunch.mp4' },
      dinner:    { uploaded: true, emoji: '🥩', title: '갈비',             calories: 560, video: '/videos/suhyun_dinner.mp4' }
    }
  },
  {
    id: 5, name: '최유나', avatar: '😄',
    meals: {
      breakfast: { uploaded: true, emoji: '🫙', title: '요거트볼',         calories: 200, video: '/videos/yuna_breakfast.mp4' },
      lunch:     { uploaded: true, emoji: '🍜', title: '라면',             calories: 490, video: '/videos/yuna_lunch.mp4' },
      dinner:    { uploaded: true, emoji: '🍣', title: '스시',             calories: 420, video: '/videos/yuna_dinner.mp4' }
    }
  }
]

// 날짜별 식습관 표정 (식단 질 & 목표 달성도)
const { great, happy, neutral, bad, excited, tired, stressed } = emojis
export const groupDayExpressions = {
  1:great, 2:happy, 3:neutral, 4:happy, 5:great,
  6:great, 7:excited, 8:tired, 9:bad, 10:happy,
  11:great, 12:excited, 13:happy, 14:stressed, 15:neutral,
  16:happy, 17:bad, 18:neutral, 19:great, 20:happy,
  21:excited, 22:tired, 23:neutral, 24:happy, 25:great,
  26:happy, 27:neutral, 28:happy, 29:great, 30:excited
}

// 날짜별 간단 기록
export const groupDayRecords = {
  default: {
    meals: [
      { type: '아침', name: '프로틴 오트밀', calories: 290, done: true },
      { type: '점심', name: '닭가슴살 샐러드', calories: 320, done: true },
      { type: '저녁', name: null, done: false }
    ],
    totalCalories: 610, targetCalories: 1800,
    protein: 64, targetProtein: 150,
    aiComment: '오늘 단백질 섭취가 목표의 43%예요. 저녁을 기록하면 더 정확한 분석이 가능해요! 💪'
  },
  5: {
    meals: [
      { type: '아침', name: '베리 스무디볼', calories: 260, done: true },
      { type: '점심', name: '현미밥 + 된장국', calories: 480, done: true },
      { type: '저녁', name: '연어 스테이크', calories: 520, done: true }
    ],
    totalCalories: 1260, targetCalories: 1800,
    protein: 112, targetProtein: 150,
    aiComment: '세 끼 모두 기록 완료! 단백질 목표의 75%를 달성했어요. 훌륭한 하루였어요 😄'
  },
  12: {
    meals: [
      { type: '아침', name: '계란 토스트', calories: 210, done: true },
      { type: '점심', name: '치킨 랩', calories: 430, done: true },
      { type: '저녁', name: '된장찌개 정식', calories: 450, done: true }
    ],
    totalCalories: 1090, targetCalories: 1800,
    protein: 98, targetProtein: 150,
    aiComment: '균형 잡힌 식단이에요! 탄수화물과 단백질 비율이 이상적이에요. 내일도 파이팅 🤩'
  }
}

export const aiMonthlyAnalysis = {
  summary: '이번 달 그룹 평균 단백질 섭취량이 지난달 대비 18% 증가했어요! 특히 아침 식사 참여율이 높아졌고, 저녁 기록은 조금 아쉬워요.',
  stats: [
    { label: '평균 칼로리', value: '1,680 kcal', trend: '↓ 목표 달성' },
    { label: '단백질 목표', value: '87%', trend: '↑ 18% 향상' },
    { label: '기록 참여율', value: '74%', trend: '↑ 꾸준히 성장' }
  ],
  tip: '저녁 식사 기록을 조금 더 채워보세요. 그룹 전체 달성률이 90%에 가까워질 것 같아요! 💪'
}

export const initialMessages = [
  { id: 1, sender: '김민지', text: '오늘 점심 뭐 먹었어요? 🍱', time: '오후 1:23', isMine: false },
  { id: 2, sender: '나', text: '닭가슴살 샐러드 먹었어요! 단백질 42g!', time: '오후 1:25', isMine: true },
  { id: 3, sender: '박지훈', text: '대박 👏 저는 오늘 현미밥 먹었는데', time: '오후 1:28', isMine: false },
  { id: 4, sender: '나', text: '좋아요~ 탄수화물 잘 챙기셨네요', time: '오후 1:30', isMine: true },
  { id: 5, sender: '김민지', text: '나도 내일부터 샐러드 도전!', time: '오후 1:32', isMine: false, reaction: '🔥' }
]

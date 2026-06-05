export const emojis = {
  great: '😄', good: '🙂', neutral: '😐', bad: '😔', terrible: '😣',
  excited: '🤩', tired: '😴', sick: '🤢', happy: '😊', stressed: '😤'
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

export const initialMessages = [
  { id: 1, sender: '김민지', text: '오늘 점심 뭐 먹었어요? 🍱', time: '오후 1:23', isMine: false },
  { id: 2, sender: '나', text: '닭가슴살 샐러드 먹었어요! 단백질 42g!', time: '오후 1:25', isMine: true },
  { id: 3, sender: '박지훈', text: '대박 👏 저는 오늘 현미밥 먹었는데', time: '오후 1:28', isMine: false },
  { id: 4, sender: '나', text: '좋아요~ 탄수화물 잘 챙기셨네요', time: '오후 1:30', isMine: true },
  { id: 5, sender: '김민지', text: '나도 내일부터 샐러드 도전!', time: '오후 1:32', isMine: false, reaction: '🔥' }
]

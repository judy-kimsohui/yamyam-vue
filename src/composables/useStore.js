import { ref, computed } from 'vue'
import { initialFeedItems, initialGroups, initialMessages } from '../data/mockData.js'

const feedItems = ref([...initialFeedItems])
const groups = ref([...initialGroups])
const messages = ref([...initialMessages])
const proteinGoal = ref(150)

const totalProtein = computed(() => feedItems.value.reduce((a, b) => a + b.protein, 0))
const totalCalories = computed(() => feedItems.value.reduce((a, b) => a + b.calories, 0))

export function useStore() {
  return { feedItems, groups, messages, proteinGoal, totalProtein, totalCalories }
}

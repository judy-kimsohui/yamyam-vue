<template>
  <div class="chart-card">
    <div class="card-title">지정 기간 영양 추이</div>
    <div class="chart-holder">
      <LineChart :chartData="computedChartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { LineChart } from 'vue-chart-3'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  trendData: { type: Array, default: () => [] }
})

const computedChartData = computed(() => {
  return {
    labels: props.trendData.map(item => item.date),
    datasets: [
      {
        label: '칼로리',
        data: props.trendData.map(item => item.dailyCalories),
        borderColor: '#E8909E', // 메인 핑크 감성 일치
        backgroundColor: 'rgba(232, 144, 158, 0.05)',
        fill: true, // 칼로리 라인 밑에 은은한 핑크 그라데이션 베이스 채우기
        yAxisID: 'y-left', tension: 0.3, borderWidth: 3, pointRadius: 3, pointHoverRadius: 6
      },
      {
        label: '탄수화물',
        data: props.trendData.map(item => item.dailyCarbs),
        borderColor: '#2F80ED', backgroundColor: 'transparent',
        yAxisID: 'y-right', tension: 0.25, borderWidth: 2, pointRadius: 2
      },
      {
        label: '단백질',
        data: props.trendData.map(item => item.dailyProtein),
        borderColor: '#22C55E', backgroundColor: 'transparent',
        yAxisID: 'y-right', tension: 0.25, borderWidth: 2, pointRadius: 2
      },
      {
        label: '지방',
        data: props.trendData.map(item => item.dailyFat),
        borderColor: '#F2C94C', backgroundColor: 'transparent',
        yAxisID: 'y-right', tension: 0.25, borderWidth: 2, pointRadius: 2
      }
    ]
  }
})

// 🌟 고급 대시보드 옵션 디자인 명세
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      align: 'end', // 오른쪽 상단 정렬로 고급스럽게 변환
      labels: {
        boxWidth: 6, boxHeight: 6, usePointStyle: true, pointStyle: 'circle', // 범례 사각형 대신 동그라미 칩
        font: { size: 11, weight: '600', family: 'system-ui' },
        padding: 15
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      padding: 12, cornerRadius: 10,
      titleFont: { size: 12, weight: '700' },
      bodyFont: { size: 12 },
      boxWidth: 8, boxHeight: 8, usePointStyle: true
    }
  },
  scales: {
    'y-left': {
      type: 'linear', position: 'left',
      grid: { color: '#f0f0f0', drawTicks: false }, // 연한 회색 실선 처리
      ticks: { font: { size: 10, weight: '500' }, color: '#999', padding: 8 }
    },
    'y-right': {
      type: 'linear', position: 'right',
      grid: { drawOnChartArea: false }, // 축선 중첩으로 지저분해지는 것 방지
      ticks: { font: { size: 10, weight: '500' }, color: '#999', padding: 8 }
    },
    x: {
      grid: { drawOnChartArea: false }, // X축 세로선 제거하여 깔끔함 극대화
      ticks: { font: { size: 10, weight: '500' }, color: '#888', padding: 6 }
    }
  }
}
</script>

<style scoped>
.chart-card { 
  background: #fff; padding: 24px; border-radius: 16px; 
  border: 1px solid #e5e5e5; margin-bottom: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02); /* 미세한 그림자로 고급감 연출 */
}
.card-title { font-size: 13px; font-weight: 700; color: #222; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px; }
.chart-holder { width: 100%; height: 230px; position: relative; }
</style>
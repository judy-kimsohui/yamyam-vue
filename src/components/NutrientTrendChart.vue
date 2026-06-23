<template>
  <div class="chart-card">
    <div class="card-title">지정 기간 영양 추이</div>
    <div class="chart-holder-wrapper">
      <LineChart :chartData="computedChartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { LineChart } from "vue-chart-3";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const props = defineProps({
  trendData: { type: Array, default: () => [] },
});

const computedChartData = computed(() => {
  return {
    labels: props.trendData.map((item) => item.date),
    datasets: [
      {
        label: "칼로리",
        data: props.trendData.map((item) => item.dailyCalories),
        borderColor: "#E8909E",
        backgroundColor: "rgba(232, 144, 158, 0.05)",
        fill: true,
        yAxisID: "y-left",
        tension: 0.3,
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: "탄수화물",
        data: props.trendData.map((item) => item.dailyCarbs),
        borderColor: "#2F80ED",
        backgroundColor: "transparent",
        yAxisID: "y-right",
        tension: 0.25,
        borderWidth: 1.5,
        pointRadius: 1.5,
      },
      {
        label: "단백질",
        data: props.trendData.map((item) => item.dailyProtein),
        borderColor: "#22C55E",
        backgroundColor: "transparent",
        yAxisID: "y-right",
        tension: 0.25,
        borderWidth: 1.5,
        pointRadius: 1.5,
      },
      {
        label: "지방",
        data: props.trendData.map((item) => item.dailyFat),
        borderColor: "#F2C94C",
        backgroundColor: "transparent",
        yAxisID: "y-right",
        tension: 0.25,
        borderWidth: 1.5,
        pointRadius: 1.5,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false, // 🌟 래퍼 박스의 높이에 그래프가 완벽히 맞춰지도록 선언
  layout: {
    // 🌟 차트 축 선이나 레이블 글씨가 박스 바깥 경계선에 걸려 짤리지 않게 보장하는 내부 패딩
    padding: { top: 5, bottom: 5, left: 5, right: 5 },
  },
  plugins: {
    legend: {
      position: "top",
      align: "end",
      labels: {
        boxWidth: 6,
        boxHeight: 6,
        usePointStyle: true,
        pointStyle: "circle",
        font: { size: 10, weight: "600" },
        padding: 8,
      },
    },
  },
  scales: {
    "y-left": {
      type: "linear",
      position: "left",
      grid: { color: "#f5f5f5", drawTicks: false },
      ticks: { font: { size: 9 }, color: "#999", padding: 4 },
    },
    "y-right": {
      type: "linear",
      position: "right",
      grid: { drawOnChartArea: false },
      ticks: { font: { size: 9 }, color: "#999", padding: 4 },
    },
    x: {
      grid: { drawOnChartArea: false },
      ticks: { font: { size: 9 }, color: "#888", padding: 4 },
    },
  },
};
</script>

<style scoped>
/* 🌟 차트를 감싼 전체 흰색 블록 스타일 - 유동적이고 조화로운 핏(Fit) 구현 */
.chart-card {
  background: #fff;
  padding: 16px 20px 20px; /* 상하좌우 조화로운 인셋 확보 */
  border-radius: 16px;
  border: 1px solid #e5e5e5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  box-sizing: border-box;
  width: 100% !important;
  height: auto !important; /* 🌟 뚱뚱하게 벌어지지 않고 내부 콘텐츠 높이에 맞춰 딱 고정되도록 유동화 */
  display: flex !important;
  flex-direction: column !important;
}

.card-title {
  font-size: 13px;
  font-weight: 700;
  color: #222;
  margin-bottom: 12px;
  flex-shrink: 0;
}

/* 🌟 차트의 캔버스가 그려질 실제 물리 영역 - 높이를 200px로 정형화하여 컴포넌트 핏 완성 */
.chart-holder-wrapper {
  width: 100% !important;
  height: 200px !important; /* 🌟 차트 그래픽이 가장 예쁘게 보이면서도 뚫고 나오지 않는 최적의 높이 가드 */
  position: relative !important;
  display: block !important;
}
</style>

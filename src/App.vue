<template>
  <div class="app-container">
    <TopBar
      :fetched-at="fetchedAt"
      @view-odds="openOddsModal"
      @view-pushes="openPushesModal"
    />

    <ConfigPanel
      ref="configPanelRef"
      :matches-data="matchesData"
      :parlay-items="parlayItems"
      @update:parlay-items="onParlayUpdate"
      @calculate="handleCalculate"
    />

    <ResultPanel
      :data="calcResult"
      :parlay-items="parlayItems"
      :rows="lastCalcRows"
      @open-pushes="openPushesModal"
    />

    <OddsModal
      v-if="showOddsModal"
      :matches-data="matchesData"
      :fetched-at="fetchedAt"
      @close="closeOddsModal"
    />

    <PushesModal
      v-if="showPushesModal"
      :matches-data="matchesData"
      @close="closePushesModal"
      @apply="onApplyPush"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import TopBar from './components/TopBar.vue'
import ConfigPanel from './components/ConfigPanel.vue'
import OddsModal from './components/OddsModal.vue'
import ResultPanel from './components/ResultPanel.vue'
import PushesModal from './components/PushesModal.vue'
import { initializeOddsData } from './data/oddsInitializer.js'

/* ========== 状态 ========== */
const matchesData = ref([])
const fetchedAt = ref(null)

const showOddsModal = ref(false)
const showPushesModal = ref(false)

const calcResult = ref(null)
const parlayItems = ref([])
const lastCalcRows = ref([])

const configPanelRef = ref(null)

/* ========== 初始化 ========== */
onMounted(async () => {
  const { matches, fetchedAt: t } = await initializeOddsData()
  matchesData.value = matches
  fetchedAt.value = t
})

/* ========== 弹窗控制 ========== */
const openOddsModal = () => { showOddsModal.value = true }
const closeOddsModal = () => { showOddsModal.value = false }

const openPushesModal = () => { showPushesModal.value = true }
const closePushesModal = () => { showPushesModal.value = false }

/* ========== 计算 ========== */
const handleCalculate = ({ result, errorMsg, rows, parlayItems: pItems }) => {
  console.log('计算参数：', { result, errorMsg, rows, pItems })

  if (errorMsg) {
    alert('计算失败：' + errorMsg)
    calcResult.value = null
    return
  }

  calcResult.value = result
  parlayItems.value = pItems || []
  lastCalcRows.value = rows || []
}

/* ========== 串买实时同步 ========== */
function onParlayUpdate(items) {
  // ★ 只保留完整选好的项（有场次 + 有赔率）
  parlayItems.value = items.filter(it => it.matchId && it.selectedOdds)
}

/* ========== 应用推单方案 ========== */
function onApplyPush(push) {
  showPushesModal.value = false

  if (!configPanelRef.value) {
    alert('界面未就绪，请稍后重试')
    return
  }

  // 1. 恢复比赛
  configPanelRef.value.applyPush(push)

  // 2. 设置总额范围 = M × 0.8 ~ M × 1.2
  const M = push.result?.result?.M || 100
  const min = Math.round(M * 0.8)
  const max = Math.round(M * 1.2)
  configPanelRef.value.setAmountRange(min, max)

  // 3. 延迟计算（等 UI 更新）
  setTimeout(() => {
    configPanelRef.value?.calculate()
  }, 100)
}
</script>

<style scoped>
.app-container {
  width: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 20, 40, 0.06);
  padding: 12px 10px 18px;
}
</style>
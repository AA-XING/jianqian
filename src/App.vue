<template>
  <div class="app-container">
    <TopBar
      :fetched-at="fetchedAt"
      :has-active-filter="hasActiveFilter"
      :total-count="totalGroupCount"
      :filtered-count="filteredGroupCount"
      @view-odds="openOddsModal"
      @view-pushes="openPushesModal"
      @open-filter="showFilterPanel = true"
      @reset-filter="resetFilter"
    />

    <ConfigPanel
      ref="configPanelRef"
      :matches-data="filteredMatches"
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
      :matches-data="filteredMatches"
      :fetched-at="fetchedAt"
      @close="closeOddsModal"
    />

    <PushesModal
      v-if="showPushesModal"
      :matches-data="matchesData"
      @close="closePushesModal"
      @apply="onApplyPush"
    />

    <!-- ★ 筛选弹窗 -->
    <FilterPanel
      ref="filterPanelRef"
      :matches-data="matchesData"
      :visible="showFilterPanel"
      @close="showFilterPanel = false"
      @filter-change="onFilterChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import TopBar from './components/TopBar.vue'
import ConfigPanel from './components/ConfigPanel.vue'
import OddsModal from './components/OddsModal.vue'
import ResultPanel from './components/ResultPanel.vue'
import PushesModal from './components/PushesModal.vue'
import FilterPanel from './components/FilterPanel.vue'
import { initializeOddsData } from './data/oddsInitializer.js'


/* ========== 状态 ========== */
const matchesData = ref([])            // 原始数据
const filteredMatches = ref([])        // 过滤后数据
const hasActiveFilter = ref(false)     // 是否有筛选生效
const fetchedAt = ref(null)

const showOddsModal = ref(false)
const showPushesModal = ref(false)
const showFilterPanel = ref(false)

const calcResult = ref(null)
const parlayItems = ref([])
const lastCalcRows = ref([])

const configPanelRef = ref(null)
const filterPanelRef = ref(null)

/* ========== 初始化 ========== */
onMounted(async () => {
  const { matches, fetchedAt: t } = await initializeOddsData()
  matchesData.value = matches
  filteredMatches.value = matches
  fetchedAt.value = t
})

/* ========== 弹窗控制 ========== */
const openOddsModal = () => { showOddsModal.value = true }
const closeOddsModal = () => { showOddsModal.value = false }

const openPushesModal = () => { showPushesModal.value = true }
const closePushesModal = () => { showPushesModal.value = false }

/* ========== 筛选变化 ========== */
function onFilterChange({ matches, hasActiveFilter: active }) {
  filteredMatches.value = matches
  hasActiveFilter.value = active
}

/* ========== 重置筛选 ========== */
function resetFilter() {
  filteredMatches.value = matchesData.value
  hasActiveFilter.value = false
  filterPanelRef.value?.resetFilter()
}

/* ========== 计算 ========== */
const handleCalculate = ({ result, errorMsg, rows, parlayItems: pItems }) => {
  if (errorMsg) {
    alert('计算失败：' + errorMsg)
    calcResult.value = null
    return
  }
  calcResult.value = result
  parlayItems.value = pItems || []
  lastCalcRows.value = rows || []
}

function onParlayUpdate(items) {
  parlayItems.value = items
}

/* ========== 应用推单方案 ========== */
function onApplyPush(push) {
  showPushesModal.value = false
  if (!configPanelRef.value) return

  configPanelRef.value.applyPush(push)

  const M = push.result?.result?.M || 100
  configPanelRef.value.setAmountRange(Math.round(M * 0.8), Math.round(M * 1.2))

  setTimeout(() => {
    configPanelRef.value?.calculate()
  }, 100)
}

/* ★ 总比赛数（按 groupId 去重） */
const totalGroupCount = computed(() => {
  const set = new Set()
  for (const m of matchesData.value) {
    if (m.groupId) set.add(m.groupId)
  }
  return set.size
})

/* ★ 筛选后比赛数 */
const filteredGroupCount = computed(() => {
  const set = new Set()
  for (const m of filteredMatches.value) {
    if (m.groupId) set.add(m.groupId)
  }
  return set.size
})
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
<template>
  <div class="app-container">
    <TopBar
      :fetched-at="fetchedAt"
      @view-odds="openOddsModal"
    />

    <ConfigPanel
      :matches-data="matchesData"
      @calculate="handleCalculate"
    />

    <ResultPanel :data="calcResult" :parlay-items="parlayItems" />

    <OddsModal
      v-if="showOddsModal"
      :matches-data="matchesData"
      :fetched-at="fetchedAt"
      @close="closeOddsModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import TopBar from './components/TopBar.vue'
import ConfigPanel from './components/ConfigPanel.vue'
import OddsModal from './components/OddsModal.vue'
import ResultPanel from './components/ResultPanel.vue'
import { initializeOddsData } from './data/oddsInitializer.js'

const matchesData = ref([])
const fetchedAt = ref(null)
const showOddsModal = ref(false)
const calcResult = ref(null)
const parlayItems = ref([])   // ★ 串买数据

onMounted(async () => {
  const { matches, fetchedAt: t } = await initializeOddsData()
  matchesData.value = matches
  fetchedAt.value = t
})

const openOddsModal = () => { showOddsModal.value = true }
const closeOddsModal = () => { showOddsModal.value = false }

const handleCalculate = ({ result, errorMsg, parlayItems: pItems }) => {
  console.log('计算参数：', { result, errorMsg, pItems })
  if (errorMsg) {
    alert('计算失败：' + errorMsg)
    calcResult.value = null
    parlayItems.value = []
    return
  }
  calcResult.value = result
  parlayItems.value = pItems || []   // ★ 保存串买数据
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
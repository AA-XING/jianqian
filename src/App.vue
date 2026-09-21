<script setup>
import { ref, onMounted } from 'vue'
import TopBar from './components/TopBar.vue'
import ConfigPanel from './components/ConfigPanel.vue'
import OddsModal from './components/OddsModal.vue'
import ResultPanel from './components/ResultPanel.vue'
import { initializeOddsData } from './data/oddsInitializer.js'

const matchesData = ref([])
const fetchedAt = ref(null)        // ★ 新增
const showOddsModal = ref(false)
const calcResult = ref(null)

onMounted(async () => {
  const { matches, fetchedAt: t } = await initializeOddsData()
  matchesData.value = matches
  fetchedAt.value = t              // ★ 保存时间
})

const openOddsModal = () => { showOddsModal.value = true }
const closeOddsModal = () => { showOddsModal.value = false }

const handleCalculate = ({ result, errorMsg, rows, amountMin, amountMax }) => {
  console.log('计算参数：', { rows, amountMin, amountMax })
  if (errorMsg) {
    alert('计算失败：' + errorMsg)
    calcResult.value = null
    return
  }
  calcResult.value = result
}
</script>

<template>
  <div class="app-container">
    <TopBar @view-odds="openOddsModal" />
    <ConfigPanel :matches-data="matchesData" @calculate="handleCalculate" />
    <ResultPanel :data="calcResult" />
    <OddsModal
      v-if="showOddsModal"
      :matches-data="matchesData"
      :fetched-at="fetchedAt"
      @close="closeOddsModal"
    />
  </div>
</template>
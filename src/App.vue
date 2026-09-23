<template>
  <div class="app-container">
    <TopBar
      :refreshing="refreshing"
      :cooldown="cooldown"
      :fetched-at="fetchedAt"
      @view-odds="openOddsModal"
      @refresh="refreshOdds"
    />

    <ConfigPanel
      :matches-data="matchesData"
      @calculate="handleCalculate"
    />

    <ResultPanel :data="calcResult" />

    <OddsModal
      v-if="showOddsModal"
      :matches-data="matchesData"
      :fetched-at="fetchedAt"
      :refreshing="refreshing"
      :cooldown="cooldown"
      @close="closeOddsModal"
      @refresh="refreshOdds"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import TopBar from './components/TopBar.vue'
import ConfigPanel from './components/ConfigPanel.vue'
import OddsModal from './components/OddsModal.vue'
import ResultPanel from './components/ResultPanel.vue'
import { initializeOddsData } from './data/oddsInitializer.js'

/** 冷却时长（秒） */
const COOLDOWN_SEC = 60

const matchesData = ref([])
const fetchedAt = ref(null)
const showOddsModal = ref(false)
const calcResult = ref(null)

const refreshing = ref(false)
const cooldown = ref(0)         // 剩余冷却秒数
let cooldownTimer = null

// 启动冷却
function startCooldown(seconds = COOLDOWN_SEC) {
  cooldown.value = seconds
  clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0) {
      cooldown.value = 0
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

onMounted(async () => {
  const { matches, fetchedAt: t } = await initializeOddsData()
  matchesData.value = matches
  fetchedAt.value = t
  startCooldown(60)
})

onUnmounted(() => {
  clearInterval(cooldownTimer)
})

const openOddsModal = () => { showOddsModal.value = true }
const closeOddsModal = () => { showOddsModal.value = false }

/** 刷新赔率数据 */
const refreshOdds = async () => {
  if (refreshing.value) return
  if (cooldown.value > 0) return

  refreshing.value = true
  try {
    const { matches, fetchedAt: t } = await initializeOddsData({ force: true })
    matchesData.value = matches
    fetchedAt.value = t
    startCooldown(60)
  } catch (e) {
    console.error('[refresh] 异常:', e)
  } finally {
    refreshing.value = false
  }
}

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

<style scoped>
.app-container {
  width: 100%;
  max-width: 800px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 20, 40, 0.1);
  padding: 24px 28px 32px;
}
</style>
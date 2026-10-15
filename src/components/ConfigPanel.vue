<template>
  <div class="config-panel">
    <MatchCountSelector v-model="matchCount" @update:modelValue="onMatchCountChange" />

    <MatchRow
      v-for="(row, index) in rows"
      :key="index"
      :row="row"
      :index="index"
      :matches-data="matchesData"
      :all-rows="rows"
      @update:row="onRowUpdate(index, $event)"
    />

    <AmountRange v-model:min="amountMin" v-model:max="amountMax" />

    <button class="btn-calc" @click="onCalculate">计算</button>

    <div v-if="singleMatchWarning" class="warning-tip">
      ⚠️ {{ singleMatchWarning }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import MatchCountSelector from './MatchCountSelector.vue'
import MatchRow from './MatchRow.vue'
import AmountRange from './AmountRange.vue'
import { computeAll } from '../utils/calculator.js'

const props = defineProps({
  matchesData: { type: Array, default: () => [] }
})

const emit = defineEmits(['calculate'])

const matchCount = ref(1)
const rows = reactive([createEmptyRow()])

function createEmptyRow() {
  return {
    matchId: null,
    groupId: null,
    poolType: null,
    poolLabel: '',
    matchName: '',
    bettingSingle: false,
    goalLine: 0,
    odds: null,
    comboType: 'wp',
    odds1: null,
    odds2: null
  }
}

const onMatchCountChange = (num) => {
  const len = rows.length
  if (num > len) {
    for (let i = len; i < num; i++) rows.push(createEmptyRow())
  } else if (num < len) {
    rows.splice(num)
  }
}

const onRowUpdate = (index, newRow) => {
  rows[index] = { ...newRow }
}

const amountMin = ref(0)
const amountMax = ref(1000)

const singleMatchWarning = computed(() => {
  if (rows.length !== 1) return ''
  const r = rows[0]
  if (!r.matchId) return ''
  if (r.bettingSingle) return ''
  return `只选 1 场（${r.matchName}），该场不可投单关`
})

/**
 * ★ 刷新后同步已选比赛
 * @param {Array} newMatches 新抓取的 matchesData
 */
function syncWithMatches(newMatches) {
  const map = new Map(newMatches.map(m => [m.id, m]))

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    if (!r.matchId) continue

    const fresh = map.get(r.matchId)
    if (!fresh) {
      // ★ 已选比赛不在新列表里 → 清空该行
      console.log(`[sync] 已选比赛 ${r.matchId}（${r.matchName}）已下架，清空该行`)
      rows[i] = createEmptyRow()
      continue
    }

    // 比赛还在 → 更新赔率、单关标记等
    const oldWin = r.odds?.win
    const oldDraw = r.odds?.draw
    const oldLose = r.odds?.lose

    const newOdds = { ...fresh.odds }

    const changed =
      oldWin !== newOdds.win ||
      oldDraw !== newOdds.draw ||
      oldLose !== newOdds.lose

    if (changed) {
      console.log(`[sync] 比赛 ${r.matchId} 赔率变化：`, {
        old: { win: oldWin, draw: oldDraw, lose: oldLose },
        new: newOdds
      })
    }

    // 更新字段
    rows[i] = {
      ...r,
      matchName: fresh.name,
      bettingSingle: !!fresh.bettingSingle,
      goalLine: fresh.goalLine ?? 0,
      odds: newOdds
    }

    // 重新应用当前组合（赔率变了要刷新 odds1/odds2）
    applyComboToRow(i, r.comboType || 'wp')
  }
}

/** 根据 comboType 重新计算某行的 odds1 / odds2 */
function applyComboToRow(index, type) {
  const row = rows[index]
  if (!row.odds) {
    rows[index] = { ...row, odds1: null, odds2: null }
    return
  }

  let odds1 = null
  let odds2 = null
  if (type === 'wp') {
    odds1 = { label: '胜', value: row.odds.win }
    odds2 = { label: '平', value: row.odds.draw }
  } else if (type === 'pl') {
    odds1 = { label: '平', value: row.odds.draw }
    odds2 = { label: '负', value: row.odds.lose }
  } else if (type === 'wl') {
    odds1 = { label: '胜', value: row.odds.win }
    odds2 = { label: '负', value: row.odds.lose }
  }

  rows[index] = { ...row, odds1, odds2 }
}

// ★ 暴露给父组件
defineExpose({
  syncWithMatches
})

const onCalculate = () => {
  if (rows.some(r => !r.matchId || !r.odds1 || !r.odds2)) {
    alert('请完整选择场次和赔率组合')
    return
  }
  if (amountMin.value < 0 || amountMax.value < 0) {
    alert('金额不能为负数')
    return
  }
  if (amountMin.value > amountMax.value) {
    alert('下界不能大于上界')
    return
  }

  let result = null
  let errorMsg = null
  try {
    result = computeAll(JSON.parse(JSON.stringify(rows)), {
      x: 0.01,
      m_: amountMin.value,
      M_: amountMax.value
    })
    if (result.errorMsg) errorMsg = result.errorMsg
  } catch (e) {
    errorMsg = e.message
  }

  emit('calculate', {
    rows: JSON.parse(JSON.stringify(rows)),
    amountMin: amountMin.value,
    amountMax: amountMax.value,
    matchesData: props.matchesData,
    result,
    errorMsg
  })
}
</script>

<style scoped>
.config-panel {
  margin-bottom: 12px;
}

.btn-calc {
  background: #0f3b5e;
  border: none;
  color: white;
  font-weight: 700;
  padding: 14px;
  border-radius: 12px;
  font-size: 1.05rem;
  width: 100%;
  cursor: pointer;
  margin-top: 14px;
}

.btn-calc:active {
  background: #1b5580;
}

.warning-tip {
  margin-top: 10px;
  padding: 8px 12px;
  background: #fff7e6;
  border-left: 3px solid #e6a23c;
  color: #b88230;
  border-radius: 8px;
  font-size: 0.8rem;
  line-height: 1.4;
}
</style>
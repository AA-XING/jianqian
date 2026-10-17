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
      :parlay-group-ids="parlayGroupIds"
      @update:row="onRowUpdate(index, $event)"
    />

    <!-- 串买单项赔率区域 -->
    <ParlayPanel
      ref="parlayPanelRef"
      :matches-data="matchesData"
      :used-group-ids="usedGroupIds"
      :match-count="matchCount"
      :max-total="8"
      @update:parlay="onParlayUpdate"
    />

    <AmountRange v-model:min="amountMin" v-model:max="amountMax" />

    <button class="btn-calc" @click="onCalculate">捡</button>

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
import ParlayPanel from './ParlayPanel.vue'
import { computeAll } from '../utils/calculator.js'

const props = defineProps({
  matchesData: { type: Array, default: () => [] },
  parlayItems: { type: Array, default: () => [] }
})

const emit = defineEmits(['calculate', 'update:parlayItems'])

const matchCount = ref(1)
const rows = reactive([createEmptyRow()])
const parlayItems = ref([])
const parlayPanelRef = ref(null)

function createEmptyRow() {
  return {
    matchId: null,
    groupId: null,
    poolType: null,
    poolLabel: '',
    matchName: '',
    matchNo: '',
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

const usedGroupIds = computed(() => {
  const set = new Set()
  rows.forEach(r => {
    if (r.groupId) set.add(String(r.groupId))
  })
  return set
})

const parlayGroupIds = computed(() => {
  const set = new Set()
  props.parlayItems.forEach(it => {
    if (it.groupId) set.add(String(it.groupId))
  })
  return set
})

function onParlayUpdate(items) {
  parlayItems.value = items
  emit('update:parlayItems', items)
}

const amountMin = ref(0)
const amountMax = ref(1000)

const singleMatchWarning = computed(() => {
  if (rows.length !== 1) return ''
  const r = rows[0]
  if (!r.matchId) return ''
  if (r.bettingSingle) return ''

  const validParlay = parlayItems.value.filter(it => it.matchId && it.selectedOdds)
  if (validParlay.length > 0) return ''

  return `只选 1 场（${r.matchName}），该场不可投单关`
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
    errorMsg,
    parlayItems: parlayItems.value.filter(it => it.matchId && it.selectedOdds)
  })
}

/* ============================================================
 *  ★ 应用推单方案
 * ============================================================ */

function applyPush(push) {
  if (!push) return

  // 1. 优先用 comboRows（精确恢复）
  if (push.comboRows?.length) {
    matchCount.value = push.comboRows.length
    onMatchCountChange(push.comboRows.length)

    for (let i = 0; i < push.comboRows.length; i++) {
      const saved = push.comboRows[i]
      const newRow = createEmptyRow()
      newRow.matchId = saved.matchId
      newRow.groupId = saved.groupId
      newRow.poolType = saved.poolType
      newRow.poolLabel = saved.poolLabel
      newRow.matchName = saved.matchName
      newRow.matchNo = saved.matchNo
      newRow.bettingSingle = saved.bettingSingle
      newRow.goalLine = saved.goalLine
      newRow.odds = saved.odds
      newRow.comboType = saved.comboType || 'wp'

      // ★ 兜底：从 matchesData 查最新 odds
      if (!newRow.odds) {
        const match = props.matchesData.find(m => m.id === saved.matchId)
        if (match) {
          newRow.odds = { ...match.odds }
        }
      }

      // ★ 强制重算 odds1/odds2
      if (newRow.odds) {
        const ct = newRow.comboType
        if (ct === 'wp') {
          newRow.odds1 = { label: '胜', value: newRow.odds.win }
          newRow.odds2 = { label: '平', value: newRow.odds.draw }
        } else if (ct === 'pl') {
          newRow.odds1 = { label: '平', value: newRow.odds.draw }
          newRow.odds2 = { label: '负', value: newRow.odds.lose }
        } else if (ct === 'wl') {
          newRow.odds1 = { label: '胜', value: newRow.odds.win }
          newRow.odds2 = { label: '负', value: newRow.odds.lose }
        }
      }

      rows[i] = newRow
    }
  } else {
    // 2. 兜底：从 result.details[0].combo 恢复（旧数据）
    const combo = push.result?.details?.[0]?.combo || []
    if (!combo.length) return

    matchCount.value = combo.length
    onMatchCountChange(combo.length)

    for (let i = 0; i < combo.length; i++) {
      const c = combo[i]
      const match = props.matchesData.find(
        m => m.matchNo === c.matchNo && m.poolType === c.poolType
      )
      if (!match) continue

      const newRow = createEmptyRow()
      newRow.matchId = match.id
      newRow.groupId = match.groupId
      newRow.poolType = match.poolType
      newRow.poolLabel = match.poolLabel
      newRow.matchName = match.name
      newRow.matchNo = match.matchNo
      newRow.bettingSingle = match.bettingSingle
      newRow.goalLine = match.goalLine ?? 0
      newRow.odds = { ...match.odds }

      let comboType = 'wp'
      if (c.label === '负') comboType = 'pl'
      newRow.comboType = comboType

      // ★ 强制算 odds1/odds2
      if (comboType === 'wp') {
        newRow.odds1 = { label: '胜', value: match.odds.win }
        newRow.odds2 = { label: '平', value: match.odds.draw }
      } else if (comboType === 'pl') {
        newRow.odds1 = { label: '平', value: match.odds.draw }
        newRow.odds2 = { label: '负', value: match.odds.lose }
      } else if (comboType === 'wl') {
        newRow.odds1 = { label: '胜', value: match.odds.win }
        newRow.odds2 = { label: '负', value: match.odds.lose }
      }

      rows[i] = newRow
    }
  }

  // 3. 恢复串买
  if (push.parlayItems?.length && parlayPanelRef.value?.setItems) {
    parlayPanelRef.value.setItems(push.parlayItems)
  }
}

/**
 * 根据 comboType 重新计算某行的 odds1 / odds2
 */
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

/**
 * 设置金额范围
 */
function setAmountRange(min, max) {
  amountMin.value = min
  amountMax.value = max
}

/**
 * 触发计算
 */
function calculate() {
  onCalculate()
}

defineExpose({
  applyPush,
  setAmountRange,
  calculate
})
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
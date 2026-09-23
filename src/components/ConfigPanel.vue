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

    <button class="btn-calc" @click="onCalculate">
      捡
    </button>

    <!-- ★ 单场不可单关提示（非阻断） -->
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

/**
 * ★ 单场不可单关提示（非阻断）
 * 仅当：
 *   - 场次数量 === 1
 *   - 已选中比赛（有 matchId）
 *   - 该场不可单关（bettingSingle === false）
 * 时显示，但不阻止计算
 */
const singleMatchWarning = computed(() => {
  if (rows.length !== 1) return ''
  const r = rows[0]
  if (!r.matchId) return ''
  if (r.bettingSingle) return ''
  return `当前只选了 1 场（${r.matchName}），该场不可投单关`
})

const onCalculate = () => {
  // 只做必要校验（提示放在按钮下方，不弹窗）
  if (rows.some(r => !r.matchId || !r.odds1 || !r.odds2)) {
    alert('请完整选择场次和两个赔率')
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

  const m_ = amountMin.value
  const M_ = amountMax.value

  let result = null
  let errorMsg = null
  try {
    result = computeAll(JSON.parse(JSON.stringify(rows)), {
      x: 0.01,
      m_,
      M_
    })
    if (result.errorMsg) {
      errorMsg = result.errorMsg
    }
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
  background: #f9fcff;
  border-radius: 20px;
  padding: 20px 20px 24px;
  border: 1px solid #d9e6f2;
}

.btn-calc {
  background: #0f3b5e;
  border: none;
  color: white;
  font-weight: 600;
  padding: 16px 28px;
  border-radius: 50px;
  font-size: 1.1rem;
  width: 100%;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 0.3px;
  margin-top: 14px;
  box-shadow: 0 8px 18px rgba(15, 59, 94, 0.25);
}

.btn-calc:hover {
  background: #1b5580;
  transform: scale(1.01);
}

/* ★ 提示文字样式 */
.warning-tip {
  margin-top: 10px;
  padding: 10px 16px;
  background: #fff7e6;
  border-left: 4px solid #e6a23c;
  color: #b88230;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1.5;
}
</style>
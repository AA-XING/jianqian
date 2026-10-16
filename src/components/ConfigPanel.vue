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

    <!-- ★ 串买单项赔率区域 -->
    <ParlayPanel
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
import ParlayPanel from './ParlayPanel.vue'    // ★ 新增
import { computeAll } from '../utils/calculator.js'

const props = defineProps({
  matchesData: { type: Array, default: () => [] }
})

const emit = defineEmits(['calculate'])

const matchCount = ref(1)
const rows = reactive([createEmptyRow()])

// 串买数据
const parlayItems = ref([])

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

// ★ 上方已选场次的 groupId 集合
const usedGroupIds = computed(() => {
  const set = new Set()
  rows.forEach(r => {
    if (r.groupId) set.add(String(r.groupId))
  })
  return set
})

// ★ 串买更新
function onParlayUpdate(items) {
  parlayItems.value = items
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
    // ★ 传递串买数据
    parlayItems: parlayItems.value.filter(it => it.matchId && it.selectedOdds)
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
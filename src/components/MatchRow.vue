<template>
  <div class="match-row">
    <!-- 场次选择 -->
    <button class="btn-match-select" @click="showMatchSelectModal = true">
      <span v-if="localRow.bettingSingle" class="single-badge-sm">单</span>
      <span class="btn-match-text">{{ localRow.matchName || '选择比赛' }}</span>

      <!-- ★ 让球徽章：让字黄底 + 数字红/绿底 -->
      <span
        v-if="localRow.poolType === 'hhad'"
        class="pool-badge hhad"
      >
        <span class="goal-label">让</span>
        <span class="goal-num" :class="goalClass(localRow.goalLine)">
          {{ formatGoalLine(localRow.goalLine) }}
        </span>
      </span>
      <span v-else-if="localRow.poolType === 'had'" class="pool-badge had">
        胜平负
      </span>

      <i>▼</i>
    </button>

    <!-- 组合选择：一行显示当前选中，点击弹窗 -->
    <button
      class="btn-combo"
      :disabled="!localRow.odds"
      @click="showComboModal = true"
    >
      <template v-if="localRow.odds && localRow.odds1 && localRow.odds2">
        <span class="combo-label" :class="labelClass(localRow.odds1.label)">
          {{ localRow.odds1.label }}
        </span>
        <span class="combo-odds">{{ localRow.odds1.value.toFixed(2) }}</span>
        <span class="combo-plus">+</span>
        <span class="combo-label" :class="labelClass(localRow.odds2.label)">
          {{ localRow.odds2.label }}
        </span>
        <span class="combo-odds">{{ localRow.odds2.value.toFixed(2) }}</span>
      </template>
      <template v-else>选择赔率</template>
      <i>▼</i>
    </button>

    <!-- 场次选择弹窗 -->
    <MatchSelectModal
      v-if="showMatchSelectModal"
      :matches-data="matchesData"
      :used-group-ids="usedGroupIds"
      @select="selectMatch"
      @close="showMatchSelectModal = false"
    />

    <!-- 组合三选一弹窗 -->
    <ComboSelectModal
      v-if="showComboModal"
      :odds="localRow.odds"
      :current="localRow.comboType"
      @select="selectCombo"
      @close="showComboModal = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import MatchSelectModal from './MatchSelectModal.vue'
import ComboSelectModal from './ComboSelectModal.vue'

const props = defineProps({
  row: { type: Object, required: true },
  index: { type: Number, required: true },
  matchesData: { type: Array, default: () => [] },
  allRows: { type: Array, default: () => [] },
  parlayGroupIds: { type: Set, default: () => new Set() }   // ★ 新增
})

const emit = defineEmits(['update:row'])

const localRow = reactive({
  matchId: null,
  groupId: null,
  poolType: null,
  poolLabel: '',
  matchName: '',
  matchNo: '',        // ★ 新增
  bettingSingle: false,
  goalLine: 0,
  odds: null,
  comboType: 'wp',
  odds1: null,
  odds2: null
})

watch(() => props.row, (val) => {
  Object.assign(localRow, val)
}, { immediate: true, deep: true })

const usedGroupIds = computed(() => {
  const set = new Set()

  // 上方其他行
  props.allRows.forEach((r, i) => {
    if (i !== props.index && r.groupId) set.add(String(r.groupId))
  })

  // ★ 串买项
  props.parlayGroupIds.forEach(gid => set.add(String(gid)))

  return set
})

const showMatchSelectModal = ref(false)
const showComboModal = ref(false)

const selectMatch = (match) => {
  localRow.matchId = match.id
  localRow.groupId = match.groupId
  localRow.poolType = match.poolType
  localRow.poolLabel = match.poolLabel
  localRow.goalLine = match.goalLine ?? 0
  localRow.matchName = match.name
  localRow.matchNo = match.matchNo          // ★ 新增
  localRow.bettingSingle = !!match.bettingSingle
  localRow.odds = { ...match.odds }

  localRow.comboType = 'wp'
  applyCombo('wp')
  emitUpdate()
  showMatchSelectModal.value = false
}

const selectCombo = (type) => {
  if (!localRow.odds) return
  localRow.comboType = type
  applyCombo(type)
  emitUpdate()
  showComboModal.value = false
}

function applyCombo(type) {
  if (!localRow.odds) {
    localRow.odds1 = null
    localRow.odds2 = null
    return
  }
  if (type === 'wp') {
    localRow.odds1 = { label: '胜', value: localRow.odds.win }
    localRow.odds2 = { label: '平', value: localRow.odds.draw }
  } else if (type === 'pl') {
    localRow.odds1 = { label: '平', value: localRow.odds.draw }
    localRow.odds2 = { label: '负', value: localRow.odds.lose }
  } else if (type === 'wl') {
    localRow.odds1 = { label: '胜', value: localRow.odds.win }
    localRow.odds2 = { label: '负', value: localRow.odds.lose }
  }
}

function labelClass(label) {
  if (label === '胜') return 'win'
  if (label === '平') return 'draw'
  return 'lose'
}

/* ★ 让球数格式化：正数带 +，负数带 - */
function formatGoalLine(gl) {
  const n = Number(gl)
  if (Number.isNaN(n)) return '—'
  return n >= 0 ? `+${n}` : `${n}`
}

/* ★ 让球数颜色类 */
function goalClass(gl) {
  const n = Number(gl)
  if (Number.isNaN(n)) return ''
  if (n > 0) return 'goal-pos'
  if (n < 0) return 'goal-neg'
  return ''
}

const emitUpdate = () => emit('update:row', { ...localRow })
</script>

<style scoped>
.match-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
  padding: 8px;
  background: #f9fcff;
  border-radius: 12px;
}

/* 场次选择按钮 */
.btn-match-select {
  background: #eef5fc;
  border: none;
  padding: 10px 12px;
  border-radius: 10px;
  font-weight: 500;
  color: #0b2b4a;
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 0.88rem;
}

.btn-match-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-match-select i {
  font-style: normal;
  font-size: 0.7rem;
  opacity: 0.6;
}

.single-badge-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #e74c3c;
  color: white;
  font-size: 0.65rem;
  font-weight: 800;
  flex-shrink: 0;
}

/* ★ 徽章容器 */
.pool-badge {
  font-size: 0.66rem;
  border-radius: 6px;
  font-weight: 700;
  display: inline-flex;
  align-items: stretch;
  overflow: hidden;
  flex-shrink: 0;
}
.pool-badge.had {
  background: #2e8b57;
  color: white;
  padding: 1px 7px;
  align-items: center;
}
.pool-badge.hhad {
  background: transparent;
  padding: 0;
}

/* ★「让」字块：黄底白字 */
.goal-label {
  background: #b8860b;
  color: white;
  padding: 1px 6px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
}

/* ★ 数字块：加粗 */
.goal-num {
  padding: 1px 7px;
  font-weight: 900;
  font-family: ui-monospace, monospace;
  display: inline-flex;
  align-items: center;
  letter-spacing: 0.3px;
  text-shadow: 0.4px 0 0 currentColor, -0.4px 0 0 currentColor;
}

/* ★ 正数：红底白字 */
.goal-num.goal-pos {
  background: #e74c3c;
  color: #ffffff;
}

/* ★ 负数：绿底白字 */
.goal-num.goal-neg {
  background: #27ae60;
  color: #ffffff;
}

/* 组合按钮 */
.btn-combo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  background: white;
  border: 1px solid #cbdae9;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 1rem;
  font-weight: 700;
  color: #0e3a5c;
  font-family: ui-monospace, monospace;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-combo:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f8fc;
  color: #9fb3c8;
}

.btn-combo:not(:disabled):active {
  background: #eef5fc;
}

.btn-combo i {
  font-style: normal;
  font-size: 0.7rem;
  opacity: 0.6;
  margin-left: 2px;
}

.combo-label {
  display: inline-block;
  font-size: 0.78rem;
  padding: 2px 8px;
  border-radius: 8px;
  color: white;
  font-weight: 700;
}
.combo-label.win { background: #2e8b57; }
.combo-label.draw { background: #b8860b; }
.combo-label.lose { background: #c0392b; }

.combo-odds {
  font-weight: 700;
  font-size: 1rem;
}

.combo-plus {
  font-size: 0.85rem;
  color: #7e94aa;
  font-weight: 400;
  margin: 0 2px;
}
</style>
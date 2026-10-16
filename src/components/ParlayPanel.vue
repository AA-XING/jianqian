<template>
  <div class="parlay-panel">
    <div class="parlay-title">
      串单项
      <span class="parlay-hint">
        （不影响投注额计算，总上限8场）
      </span>
    </div>

    <div
      v-for="(item, idx) in items"
      :key="idx"
      class="parlay-row"
    >
      <!-- 场次选择 -->
      <button
        class="parlay-btn match-btn"
        @click="openMatchSelect(idx)"
      >
        <span class="match-text">{{ item.matchName || '选择场次' }}</span>
        <span
          v-if="item.poolType === 'hhad'"
          class="goal-badge"
          :class="goalClass(item.goalLine)"
        >
          {{ formatGoalLine(item.goalLine) }}
        </span>
        <i>▼</i>
      </button>

      <!-- 单项赔率选择 -->
      <button
        class="parlay-btn odds-btn"
        :disabled="!item.odds"
        @click="openOddsSelect(idx)"
      >
        <template v-if="item.selectedOdds">
          <span class="odds-label" :class="labelClass(item.selectedOdds.label)">
            {{ item.selectedOdds.label }}
          </span>
          <span class="odds-value">{{ item.selectedOdds.value.toFixed(2) }}</span>
        </template>
        <template v-else>选择赔率</template>
        <i>▼</i>
      </button>

      <!-- ★ 叉按钮：除最后一行都有；最后一行达到上限且已选场次时也有 -->
      <button
        v-if="showRemoveButton(idx)"
        class="btn-remove"
        @click="removeRow(idx)"
        title="删除此行"
      >
        ×
      </button>
    </div>

    <!-- 场次选择弹窗 -->
    <MatchSelectModal
      v-if="showMatchSelect"
      :matches-data="matchesData"
      :used-group-ids="allUsedGroupIds"
      @select="onSelectMatch"
      @close="showMatchSelect = false"
    />

    <!-- 单项赔率弹窗 -->
    <div v-if="showOddsSelect" class="modal-mask" @click.self="showOddsSelect = false">
      <div class="modal-content-small">
        <div class="modal-header-small">
          <h3>选择单项赔率</h3>
          <button class="close-btn" @click="showOddsSelect = false">&times;</button>
        </div>
        <div class="odds-options">
          <button
            v-for="opt in currentOddsOptions"
            :key="opt.label"
            class="odds-option"
            @click="onSelectOdds(opt)"
          >
            <span class="odds-label" :class="labelClass(opt.label)">{{ opt.label }}</span>
            <span class="odds-value">{{ opt.value.toFixed(2) }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import MatchSelectModal from './MatchSelectModal.vue'

const props = defineProps({
  matchesData: { type: Array, default: () => [] },
  usedGroupIds: { type: Set, default: () => new Set() },   // 上方已选
  matchCount: { type: Number, default: 1 },                 // 上方场次数
  maxTotal: { type: Number, default: 8 }                    // 总上限
})

const emit = defineEmits(['update:parlay'])

function emptyRow() {
  return {
    matchId: null,
    matchNo: '',
    matchName: '',
    groupId: null,
    poolType: null,
    goalLine: 0,
    odds: null,
    selectedOdds: null
  }
}

const items = ref([emptyRow()])

const showMatchSelect = ref(false)
const showOddsSelect = ref(false)
const currentIdx = ref(0)
const currentOddsOptions = ref([])

/**
 * ★ 串买行数上限 = 8 - 上方场次数
 */
const maxRows = computed(() => {
  return Math.max(1, props.maxTotal - props.matchCount)
})

/**
 * ★ 所有已占用 groupId = 上方场次 + 其他串买行（排除正在编辑的行）
 */
const allUsedGroupIds = computed(() => {
  const set = new Set()
  // 上方场次
  for (const gid of props.usedGroupIds) {
    set.add(String(gid))
  }
  // 其他串买行（排除当前编辑行）
  items.value.forEach((it, i) => {
    if (i !== currentIdx.value && it.groupId) {
      set.add(String(it.groupId))
    }
  })
  return set
})

/**
 * ★ 是否显示叉按钮
 *   - 不是最后一行 → 显示
 *   - 是最后一行 → 达到上限且已选场次时才显示
 */
function showRemoveButton(idx) {
  const isLast = idx === items.value.length - 1
  if (!isLast) return true

  // 最后一行
  const reachedMax = items.value.length >= maxRows.value
  const hasData = !!items.value[idx].matchId
  return reachedMax && hasData
}

/**
 * ★ 删除行
 */
function removeRow(idx) {
  // 至少保留 1 行
  if (items.value.length <= 1) return

  items.value.splice(idx, 1)
  emitUpdate()
}

/**
 * 自动增加行：
 *   - 当前行数 < 上限
 *   - 最后一行已选场次
 */
function maybeAddRow() {
  if (items.value.length >= maxRows.value) return
  const last = items.value[items.value.length - 1]
  if (last && last.matchId) {
    items.value.push(emptyRow())
  }
}

// 监听行数上限变化（上方场次数变了）
watch(maxRows, () => {
  // 如果超出上限，截断
  while (items.value.length > maxRows.value) {
    items.value.pop()
  }
  maybeAddRow()
})

// 监听串买行数变化
watch(() => items.value.length, () => {
  maybeAddRow()
})

function openMatchSelect(idx) {
  currentIdx.value = idx
  showMatchSelect.value = true
}

function openOddsSelect(idx) {
  currentIdx.value = idx
  const item = items.value[idx]
  if (!item.odds) return
  currentOddsOptions.value = [
    { label: '胜', value: item.odds.win },
    { label: '平', value: item.odds.draw },
    { label: '负', value: item.odds.lose }
  ]
  showOddsSelect.value = true
}

function onSelectMatch(match) {
  const item = items.value[currentIdx.value]
  item.matchId = match.id
  item.matchNo = match.matchNo || ''
  item.matchName = match.name
  item.groupId = match.groupId
  item.poolType = match.poolType || 'had'
  item.goalLine = match.goalLine ?? 0
  item.odds = { ...match.odds }
  item.selectedOdds = null
  showMatchSelect.value = false
  emitUpdate()
  setTimeout(maybeAddRow, 0)
}

function onSelectOdds(opt) {
  const item = items.value[currentIdx.value]
  item.selectedOdds = { ...opt }
  showOddsSelect.value = false
  emitUpdate()
}

function labelClass(label) {
  if (label === '胜') return 'win'
  if (label === '平') return 'draw'
  return 'lose'
}

function formatGoalLine(gl) {
  const n = Number(gl)
  if (Number.isNaN(n)) return '—'
  return n >= 0 ? `+${n}` : `${n}`
}

function goalClass(gl) {
  const n = Number(gl)
  if (Number.isNaN(n)) return ''
  if (n > 0) return 'goal-pos'
  if (n < 0) return 'goal-neg'
  return ''
}

function emitUpdate() {
  emit('update:parlay', JSON.parse(JSON.stringify(items.value)))
}

defineExpose({ items })
</script>

<style scoped>
.parlay-panel {
  background: #f9fcff;
  border-radius: 12px;
  padding: 10px;
  margin-bottom: 12px;
}

.parlay-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e3f5c;
  margin-bottom: 8px;
}

.parlay-hint {
  font-size: 0.7rem;
  color: #9fb3c8;
  font-weight: 400;
  margin-left: 4px;
}

.parlay-row {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
  align-items: stretch;
}

.parlay-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: white;
  border: 1px solid #cbdae9;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #0e3a5c;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  text-align: left;
  min-height: 38px;
}

.parlay-btn:hover:not(:disabled) {
  border-color: #6f9bc1;
  background: #f2f9ff;
}

.parlay-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f8fc;
}

.match-btn {
  flex: 1;
  min-width: 0;
  justify-content: flex-start;
}

.match-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pool-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(46, 139, 87, 0.15);
}
.pool-dot.had {
  background: #2e8b57;
}

.goal-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 16px;
  border-radius: 8px;
  font-size: 0.64rem;
  font-weight: 800;
  font-family: ui-monospace, monospace;
  color: white;
  flex-shrink: 0;
  padding: 0 5px;
}
.goal-badge.goal-pos {
  background: #e74c3c;
}
.goal-badge.goal-neg {
  background: #27ae60;
}

.odds-btn {
  flex: 0 0 auto;
  min-width: 90px;
  justify-content: space-between;
}

.parlay-btn i {
  font-style: normal;
  font-size: 0.65rem;
  opacity: 0.6;
}

.odds-label {
  display: inline-block;
  font-size: 0.68rem;
  padding: 1px 6px;
  border-radius: 6px;
  color: white;
  font-weight: 700;
}
.odds-label.win { background: #2e8b57; }
.odds-label.draw { background: #b8860b; }
.odds-label.lose { background: #c0392b; }

.odds-value {
  font-family: ui-monospace, monospace;
  font-weight: 700;
  color: #0f3b5e;
  font-size: 0.85rem;
}

.btn-remove {
  flex-shrink: 0;
  width: 32px;
  background: #fdecea;
  border: none;
  border-radius: 10px;
  color: #c0392b;
  font-size: 1.2rem;
  cursor: pointer;
  font-weight: 700;
}

.btn-remove:hover {
  background: #fbd6d1;
}

/* 单项赔率弹窗 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 20, 30, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content-small {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 340px;
  padding: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
}

.modal-header-small {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.modal-header-small h3 {
  margin: 0;
  font-size: 1rem;
  color: #0b2b4a;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.4rem;
  color: #6c7e92;
  cursor: pointer;
  line-height: 1;
  padding: 0 6px;
}

.odds-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.odds-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: white;
  border: 1px solid #cbdae9;
  border-radius: 10px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.odds-option:hover {
  background: #eef5fc;
  border-color: #6f9bc1;
}
</style>
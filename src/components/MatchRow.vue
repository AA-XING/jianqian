<template>
  <div class="match-row">
    <!-- 场次选择 -->
    <button class="btn-match-select" @click="showMatchSelectModal = true">
      <span v-if="localRow.bettingSingle" class="single-badge-sm" title="可投单关">单</span>
      <span class="btn-match-text">
        {{ localRow.matchName || '选择场次' }}
      </span>
      <span v-if="localRow.poolType" class="pool-mini" :class="localRow.poolType">
        {{ localRow.poolLabel }}
      </span>
      <i>▼</i>
    </button>

    <!-- 组合三选一按钮 -->
    <div class="combo-group" :class="{ disabled: !localRow.odds }">
      <!-- 胜 + 平 -->
      <button
        class="combo-btn"
        :class="{ active: localRow.comboType === 'wp' }"
        :disabled="!localRow.odds"
        @click="selectCombo('wp')"
      >
        <span class="combo-label win">胜</span>
        <span class="combo-odds" v-if="localRow.odds">{{ localRow.odds.win.toFixed(2) }}</span>
        <span class="combo-plus">+</span>
        <span class="combo-label draw">平</span>
        <span class="combo-odds" v-if="localRow.odds">{{ localRow.odds.draw.toFixed(2) }}</span>
      </button>

      <!-- 平 + 负 -->
      <button
        class="combo-btn"
        :class="{ active: localRow.comboType === 'pl' }"
        :disabled="!localRow.odds"
        @click="selectCombo('pl')"
      >
        <span class="combo-label draw">平</span>
        <span class="combo-odds" v-if="localRow.odds">{{ localRow.odds.draw.toFixed(2) }}</span>
        <span class="combo-plus">+</span>
        <span class="combo-label lose">负</span>
        <span class="combo-odds" v-if="localRow.odds">{{ localRow.odds.lose.toFixed(2) }}</span>
      </button>

      <!-- 胜 + 负 -->
      <button
        class="combo-btn"
        :class="{ active: localRow.comboType === 'wl' }"
        :disabled="!localRow.odds"
        @click="selectCombo('wl')"
      >
        <span class="combo-label win">胜</span>
        <span class="combo-odds" v-if="localRow.odds">{{ localRow.odds.win.toFixed(2) }}</span>
        <span class="combo-plus">+</span>
        <span class="combo-label lose">负</span>
        <span class="combo-odds" v-if="localRow.odds">{{ localRow.odds.lose.toFixed(2) }}</span>
      </button>
    </div>

    <!-- 场次选择弹窗 -->
    <MatchSelectModal
      v-if="showMatchSelectModal"
      :matches-data="matchesData"
      :used-group-ids="usedGroupIds"
      @select="selectMatch"
      @close="showMatchSelectModal = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import MatchSelectModal from './MatchSelectModal.vue'

const props = defineProps({
  row: { type: Object, required: true },
  index: { type: Number, required: true },
  matchesData: { type: Array, default: () => [] },
  allRows: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:row'])

const localRow = reactive({
  matchId: null,
  groupId: null,
  poolType: null,
  poolLabel: '',
  matchName: '',
  bettingSingle: false,
  odds: null,
  comboType: 'wp',   // 'wp' | 'pl' | 'wl'
  odds1: null,
  odds2: null
})

watch(() => props.row, (val) => {
  Object.assign(localRow, val)
}, { immediate: true, deep: true })

const usedGroupIds = computed(() => {
  const set = new Set()
  props.allRows.forEach((r, i) => {
    if (i !== props.index && r.groupId) set.add(r.groupId)
  })
  return set
})

const showMatchSelectModal = ref(false)

const selectMatch = (match) => {
  localRow.matchId = match.id
  localRow.groupId = match.groupId
  localRow.poolType = match.poolType
  localRow.poolLabel = match.poolLabel
  localRow.matchName = match.name
  localRow.bettingSingle = !!match.bettingSingle
  localRow.odds = { ...match.odds }

  // 默认胜&平
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

const emitUpdate = () => {
  emit('update:row', { ...localRow })
}
</script>

<style scoped>
.match-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  background: white;
  padding: 6px 8px;
  border-radius: 18px;
  border: 1px solid #e2eef9;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
  flex-wrap: wrap;
}

.btn-match-select {
  background: #e9f0f8;
  border: none;
  padding: 10px 10px;
  border-radius: 30px;
  font-weight: 500;
  color: #0b2b4a;
  min-width: 200px;
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 0.9rem;
  border: 1px solid transparent;
}

.btn-match-select:hover {
  background: #dae6f2;
  border-color: #b6cee6;
}

.single-badge-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 20px;
  border-radius: 50%;
  background: #e74c3c;
  color: white;
  font-size: 0.68rem;
  font-weight: 800;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(231, 76, 60, 0.4);
}

.btn-match-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pool-mini {
  font-size: 0.68rem;
  padding: 1px 8px;
  border-radius: 8px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.pool-mini.had { background: #2e8b57; }
.pool-mini.hhad { background: #b8860b; }

/* 三个按钮并排 */
.combo-group {
  display: flex;
  gap: 2px;
  flex: 1;
  min-width: 400px;
}

.combo-group.disabled { opacity: 0.5; }

.combo-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: white;
  border: 1px solid #cbdae9;
  border-radius: 32px;
  padding: 8px 10px;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 0.85rem;
  font-weight: 600;
  color: #0e3a5c;
  font-family: ui-monospace, monospace;
  white-space: nowrap;
}

.combo-btn:hover:not(:disabled) {
  border-color: #6f9bc1;
  background: #f2f9ff;
}

.combo-btn:disabled {
  cursor: not-allowed;
  background: #f5f8fc;
}

.combo-btn.active {
  background: #0f3b5e;
  border-color: #0f3b5e;
  color: white;
  box-shadow: 0 4px 12px rgba(15, 59, 94, 0.25);
}

.combo-label {
  display: inline-block;
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 10px;
  color: white;
  font-weight: 700;
}

.combo-label.win { background: #2e8b57; }
.combo-label.draw { background: #b8860b; }
.combo-label.lose { background: #c0392b; }

.combo-plus {
  font-size: 0.85rem;
  color: #7e94aa;
  font-weight: 400;
}

.combo-odds {
  font-weight: 700;
  font-size: 0.9rem;
}

.combo-btn.active .combo-odds { color: #ffffff; }
.combo-btn.active .combo-plus { color: #b6d6f0; }

.btn-match-select i {
  font-style: normal;
  font-size: 0.7rem;
  opacity: 0.7;
}
</style>
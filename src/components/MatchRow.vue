<template>
  <div class="match-row">
    <!-- 场次选择 -->
    <button class="btn-match-select" @click="showMatchSelectModal = true">
      {{ localRow.matchName || '选择场次' }}
      <i>▼</i>
    </button>

    <!-- 组合二选一按钮 -->
    <div class="combo-group" :class="{ disabled: !localRow.odds }">
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
    </div>

    <!-- 场次选择弹窗 -->
    <MatchSelectModal
      v-if="showMatchSelectModal"
      :matches-data="matchesData"
      :used-match-ids="usedMatchIds"
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

// 本地镜像
const localRow = reactive({
  matchId: null,
  matchName: '',
  odds: null,
  comboType: 'wp',   // 'wp' = 胜&平, 'pl' = 平&负
  odds1: null,
  odds2: null
})

watch(() => props.row, (val) => {
  Object.assign(localRow, val)
}, { immediate: true, deep: true })

// 其他行已占用的场次
const usedMatchIds = computed(() => {
  const set = new Set()
  props.allRows.forEach((r, i) => {
    if (i !== props.index && r.matchId) set.add(r.matchId)
  })
  return set
})

// ---------- 场次选择 ----------
const showMatchSelectModal = ref(false)

const selectMatch = (match) => {
  localRow.matchId = match.id
  localRow.matchName = match.name
  localRow.odds = { ...match.odds }
  // 默认选中胜&平
  localRow.comboType = 'wp'
  applyCombo('wp')
  emitUpdate()
  showMatchSelectModal.value = false
}

// ---------- 组合选择 ----------
const selectCombo = (type) => {
  if (!localRow.odds) return
  localRow.comboType = type
  applyCombo(type)
  emitUpdate()
}

// 根据组合类型，把 odds1 / odds2 写入
function applyCombo(type) {
  if (!localRow.odds) {
    localRow.odds1 = null
    localRow.odds2 = null
    return
  }
  if (type === 'wp') {
    localRow.odds1 = { label: '胜', value: localRow.odds.win }
    localRow.odds2 = { label: '平', value: localRow.odds.draw }
  } else {
    localRow.odds1 = { label: '平', value: localRow.odds.draw }
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
  gap: 12px;
  margin-bottom: 12px;
  background: white;
  padding: 8px 12px;
  border-radius: 18px;
  border: 1px solid #e2eef9;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
  flex-wrap: wrap;
}

.btn-match-select {
  background: #e9f0f8;
  border: none;
  padding: 10px 16px;
  border-radius: 30px;
  font-weight: 500;
  color: #0b2b4a;
  min-width: 160px;
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 0.9rem;
  border: 1px solid transparent;
}

.btn-match-select:hover {
  background: #dae6f2;
  border-color: #b6cee6;
}

/* ★ 组合按钮组 */
.combo-group {
  display: flex;
  gap: 8px;
  flex: 1;
  min-width: 260px;
}

.combo-group.disabled {
  opacity: 0.5;
}

.combo-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: white;
  border: 1px solid #cbdae9;
  border-radius: 30px;
  padding: 12px 18px;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 1.05rem;
  font-weight: 600;
  color: #0e3a5c;
  font-family: ui-monospace, monospace;
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

/* 标签配色 */
.combo-label {
  display: inline-block;
  font-size: 0.9rem;
  padding: 3px 10px;
  border-radius: 10px;
  color: white;
  font-weight: 700;
}

.combo-label.win { background: #2e8b57; }
.combo-label.draw { background: #b8860b; }
.combo-label.lose { background: #c0392b; }

.combo-plus {
  font-size: 0.95rem;
  color: #7e94aa;
  font-weight: 400;
}

.combo-odds {
  font-weight: 700;
  font-size: 1.1rem;
}

.combo-btn.active .combo-odds {
  color: #ffffff;
}

.combo-btn.active .combo-plus {
  color: #b6d6f0;
}
</style>
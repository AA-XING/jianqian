<template>
  <div class="fullscreen-page">
    <!-- 固定标题栏 -->
    <div class="page-header">
      <div class="header-row-1">
        <h2>选择比赛</h2>
        <div class="header-actions">
          <button
            v-if="hasActiveFilter"
            class="btn-reset"
            @click="resetFilter"
          >
            ↺ 重置
          </button>
          <button class="btn-filter" @click="showFilterModal = true">
            🔍 筛选
          </button>
          <button class="btn-close" @click="$emit('close')">&times;</button>
        </div>
      </div>
      <div class="header-row-2">
        <span class="meta-count">
          {{ groups.length }} 场比赛<template v-if="hasActiveFilter">，筛选后 {{ filteredGroups.length }} 场</template>
        </span>
      </div>
    </div>

    <!-- 可滚动主体 -->
    <div class="page-body">
      <div class="options-list">
        <div
          v-for="g in filteredGroups"
          :key="g.groupId"
          class="match-group"
          :class="{ 'group-disabled': isGroupUsed(g) }"
        >
          <div class="match-head">
            <span class="match-no">{{ g.matchNo }}</span>
            <span class="match-name">{{ g.name }}</span>
            <span class="match-league">{{ g.league }}</span>
          </div>

          <button
            v-if="g.had"
            class="odds-line"
            :class="{ used: usedGroupIds.has(String(g.groupId)) }"
            :disabled="usedGroupIds.has(String(g.groupId))"
            @click="$emit('select', g.had)"
          >
            <span v-if="g.had.bettingSingle" class="single-badge">单</span>
            <div class="odds-row">
              <span class="odds-tag win"><em>胜</em>{{ fmt(g.had.odds.win) }}</span>
              <span class="odds-tag draw"><em>平</em>{{ fmt(g.had.odds.draw) }}</span>
              <span class="odds-tag lose"><em>负</em>{{ fmt(g.had.odds.lose) }}</span>
            </div>
          </button>

          <button
            v-if="g.hhad"
            class="odds-line"
            :class="{ used: usedGroupIds.has(String(g.groupId)) }"
            :disabled="usedGroupIds.has(String(g.groupId))"
            @click="$emit('select', g.hhad)"
          >
            <span v-if="g.hhad.bettingSingle" class="single-badge">单</span>
            <div class="odds-row">
              <span class="odds-tag win"><em>胜</em>{{ fmt(g.hhad.odds.win) }}</span>
              <span class="odds-tag draw"><em>平</em>{{ fmt(g.hhad.odds.draw) }}</span>
              <span class="odds-tag lose"><em>负</em>{{ fmt(g.hhad.odds.lose) }}</span>
            </div>
            <span class="goal-badge" :class="goalClass(g.hhad.goalLine)">
              {{ formatGoalLine(g.hhad.goalLine) }}
            </span>
          </button>

          <span v-if="usedGroupIds.has(String(g.groupId))" class="used-tip">已选</span>
        </div>

        <div v-if="!filteredGroups.length" class="empty-list">
          没有符合条件的比赛
        </div>
      </div>
    </div>

    <!-- 筛选弹窗 -->
    <div v-if="showFilterModal" class="modal-mask" @click.self="showFilterModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>筛选</h3>
          <button class="close-btn" @click="showFilterModal = false">&times;</button>
        </div>

        <div class="filter-body">
          <!-- 条件 1 -->
          <div class="filter-item">
            <div class="filter-item-head">
              <div class="filter-title">赔率</div>
              <label class="filter-enable">
                <input type="checkbox" v-model="filter1.enabled" />
              </label>
            </div>
            <div class="filter-desc">
              筛选弱势方获胜赔率范围
              <div class="filter-subdesc">大于约7.8时组合为负收益</div>
            </div>

            <label class="filter-checkbox">
              <input type="checkbox" v-model="filter1.includeHhad" />
              <span>包含让球赔率</span>
            </label>

            <div class="filter-inputs">
              <input
                type="number"
                step="0.1"
                v-model.number="filter1.min"
                placeholder="最小值"
              />
              <span class="sep">~</span>
              <input
                type="number"
                step="0.1"
                v-model.number="filter1.max"
                placeholder="最大值"
              />
            </div>
          </div>

          <!-- 条件 2：赛制 -->
          <div class="filter-item">
            <div class="filter-item-head">
              <div class="filter-title">赛制</div>
              <label class="filter-enable">
                <input type="checkbox" v-model="filter2.enabled" />
              </label>
            </div>
            <div class="filter-desc">可多选</div>
            <div class="league-list">
              <label
                v-for="lg in allLeagues"
                :key="lg"
                class="league-option"
                :class="{ active: filter2.leagues.includes(lg) }"
              >
                <input
                  type="checkbox"
                  :value="lg"
                  v-model="filter2.leagues"
                />
                <span>{{ lg }}</span>
              </label>
            </div>
          </div>

          <!-- 条件 3（占位） -->
          <div class="filter-item placeholder">
            <div class="filter-item-head">
              <div class="filter-title">占位</div>
              <label class="filter-enable">
                <input type="checkbox" disabled />
              </label>
            </div>
            <div class="filter-desc">肖</div>
          </div>
        </div>

        <div class="filter-footer">
          <button class="btn-apply" @click="applyFilter">筛选</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'

const props = defineProps({
  matchesData: { type: Array, default: () => [] },
  usedGroupIds: { type: Set, default: () => new Set() }
})
defineEmits(['select', 'close'])

/* ========== 筛选状态 ========== */
const showFilterModal = ref(false)

const filter1 = reactive({
  enabled: false,
  includeHhad: false,
  min: 3.6,
  max: 6.4
})

const filter2 = reactive({
  enabled: false,
  leagues: []
})

const appliedFilter1 = reactive({
  enabled: false,
  includeHhad: false,
  min: 3.6,
  max: 6.4
})

const appliedFilter2 = reactive({
  enabled: false,
  leagues: []
})

const hasActiveFilter = computed(() => {
  return appliedFilter1.enabled || appliedFilter2.enabled
})

function applyFilter() {
  appliedFilter1.enabled = filter1.enabled
  appliedFilter1.includeHhad = filter1.includeHhad
  appliedFilter1.min = filter1.min
  appliedFilter1.max = filter1.max

  appliedFilter2.enabled = filter2.enabled
  appliedFilter2.leagues = filter2.enabled ? [...filter2.leagues] : []

  showFilterModal.value = false
}

function resetFilter() {
  appliedFilter1.enabled = false
  appliedFilter1.includeHhad = false
  appliedFilter1.min = 3.6
  appliedFilter1.max = 6.4
  filter1.enabled = false
  filter1.includeHhad = false
  filter1.min = 3.6
  filter1.max = 6.4

  appliedFilter2.enabled = false
  appliedFilter2.leagues = []
  filter2.enabled = false
  filter2.leagues = []
}

/* ========== 所有赛制 ========== */
const allLeagues = computed(() => {
  const set = new Set()
  for (const m of props.matchesData) {
    if (m.league) set.add(m.league)
  }
  return Array.from(set).sort()
})

/* ========== 分组 ========== */
const groups = computed(() => {
  const map = new Map()
  for (const m of props.matchesData) {
    const gid = m.groupId
    if (!map.has(gid)) {
      map.set(gid, {
        groupId: gid,
        matchNo: m.matchNo,
        name: m.name,
        league: m.league,
        had: null,
        hhad: null
      })
    }
    const g = map.get(gid)
    if (m.poolType === 'had') g.had = m
    else if (m.poolType === 'hhad') g.hhad = m
  }
  return Array.from(map.values())
})

/* ========== 筛选后 ========== */
const filteredGroups = computed(() => {
  let result = groups.value

  if (appliedFilter1.enabled) {
    const min = appliedFilter1.min
    const max = appliedFilter1.max
    const includeHhad = appliedFilter1.includeHhad

    result = result.filter(g => {
      const checkOdds = (odds) => {
        if (!odds) return false
        const maxWL = Math.max(odds.win, odds.lose)
        return maxWL >= min && maxWL <= max
      }

      const hadOk = checkOdds(g.had?.odds)
      if (hadOk) return true

      if (includeHhad) {
        return checkOdds(g.hhad?.odds)
      }
      return false
    })
  }

  if (appliedFilter2.enabled && appliedFilter2.leagues.length > 0) {
    const set = new Set(appliedFilter2.leagues)
    result = result.filter(g => set.has(g.league))
  }

  return result
})

/* ========== 工具 ========== */
function isGroupUsed(g) {
  return props.usedGroupIds.has(String(g.groupId))
}

function fmt(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  return Number(v).toFixed(2)
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
</script>

<style scoped>
/* 全屏容器 */
.fullscreen-page {
  position: fixed;
  inset: 0;
  background: #f3f6fc;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
  padding: 12px 14px 10px;
  box-shadow: 0 1px 8px rgba(0, 20, 40, 0.06);
  flex-shrink: 0;
  width: 100%;
  max-width: 520px;
  box-sizing: border-box;
}

.header-row-1 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.header-row-1 h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #0b2b4a;
  flex: 1;
  min-width: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-reset {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #fff7e6;
  color: #b88230;
  border: none;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-reset:hover { background: #fdebc8; }

.btn-filter {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #eef5fc;
  color: #0f3b5e;
  border: none;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-filter:hover { background: #dae6f2; }

.btn-close {
  background: none;
  border: none;
  font-size: 1.6rem;
  line-height: 1;
  color: #6c7e92;
  cursor: pointer;
  padding: 0 6px;
}
.btn-close:hover { color: #0b2b4a; }

.header-row-2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.72rem;
  color: #9fb3c8;
  font-family: ui-monospace, monospace;
  flex-wrap: wrap;
}
.meta-count { font-weight: 600; color: #5a7188; }

.page-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 10px 10px 20px;
  width: 100%;
  max-width: 520px;
  box-sizing: border-box;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-list {
  text-align: center;
  color: #9fb3c8;
  font-size: 0.85rem;
  padding: 40px 0;
}

.match-group {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 10px 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 1px 4px rgba(0, 20, 40, 0.04);
}

.match-group.group-disabled {
  opacity: 0.55;
  background: #f5f8fc;
}

.match-head {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding-bottom: 8px;
  border-bottom: 1px dashed #eef5fc;
}

.match-no {
  font-size: 0.68rem;
  background: #eef5fc;
  color: #1e3f5c;
  padding: 1px 6px;
  border-radius: 6px;
  font-weight: 700;
  flex-shrink: 0;
}

.match-name {
  font-weight: 700;
  color: #0b2b4a;
  font-size: 0.9rem;
  flex: 1;
  min-width: 0;
}

.match-league {
  font-size: 0.68rem;
  color: #9fb3c8;
  flex-shrink: 0;
}

.odds-line {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  background: white;
  border: 1px solid #e2eef9;
  border-radius: 10px;
  padding: 10px 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
  font-family: inherit;
  min-height: 46px;
  flex-wrap: nowrap;
  overflow: hidden;
}
.odds-line:hover:not(:disabled) {
  background: #eef5fc;
  border-color: #b6cee6;
}
.odds-line:active:not(:disabled) {
  background: #e2eef9;
}
.odds-line:disabled {
  cursor: not-allowed;
  background: #f5f8fc;
}
.odds-line.used { opacity: 0.55; }

.single-badge {
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

.odds-row {
  display: flex;
  gap: 4px;
  flex: 1;
  min-width: 0;
  flex-wrap: nowrap;
}

.odds-tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: #f9fcff;
  padding: 3px 6px;
  border-radius: 12px;
  font-weight: 600;
  color: #0f3b5e;
  font-size: 0.78rem;
  font-family: ui-monospace, monospace;
  flex-shrink: 0;
  white-space: nowrap;
}
.odds-tag em {
  font-style: normal;
  font-size: 0.62rem;
  color: #7e94aa;
  font-weight: 500;
}
.odds-tag.win em { color: #2e8b57; }
.odds-tag.draw em { color: #b8860b; }
.odds-tag.lose em { color: #c0392b; }

.goal-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 18px;
  border-radius: 9px;
  font-size: 0.68rem;
  font-weight: 800;
  font-family: ui-monospace, monospace;
  color: white;
  flex-shrink: 0;
  margin-left: auto;
  padding: 0 5px;
}
.goal-badge.goal-pos { background: #e74c3c; }
.goal-badge.goal-neg { background: #27ae60; }

.used-tip {
  position: absolute;
  top: 10px;
  right: 12px;
  font-size: 0.66rem;
  color: #c0392b;
  background: #fdecea;
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 600;
}

/* 筛选弹窗 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 20, 30, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 16px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #eef5fc;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.05rem;
  color: #0b2b4a;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6c7e92;
  cursor: pointer;
  line-height: 1;
  padding: 0 6px;
}

.filter-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-item {
  background: #f9fcff;
  border-radius: 12px;
  padding: 12px 14px;
  border: 1px solid #e2eef9;
}

.filter-item.placeholder {
  opacity: 0.6;
  background: #f5f8fc;
  border-style: dashed;
}

.filter-item-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.filter-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0b2b4a;
}

/* ★ 加大启用勾选框 */
.filter-enable {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}
.filter-enable input[type="checkbox"] {
  width: 26px;                  /* ★ 18px → 26px */
  height: 26px;
  accent-color: #0f3b5e;
  cursor: pointer;
}

.filter-desc {
  font-size: 0.78rem;
  color: #5a7188;
  margin-bottom: 10px;
  line-height: 1.4;
}

.filter-subdesc {
  font-size: 0.7rem;
  color: #9fb3c8;
  margin-top: 2px;
}

.filter-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 0.82rem;
  color: #1e3f5c;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
}
.filter-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #0f3b5e;
  cursor: pointer;
}

.filter-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-inputs input {
  flex: 1;
  min-width: 0;
  border: 1px solid #d9e6f2;
  border-radius: 10px;
  padding: 9px 10px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a2f44;
  outline: none;
  background: white;
  text-align: center;
  font-family: ui-monospace, monospace;
}
.filter-inputs input:focus {
  border-color: #6f9bc1;
}
.filter-inputs .sep {
  color: #9fb3c8;
  font-weight: 600;
}

.league-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.league-option {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: white;
  border: 1px solid #d9e6f2;
  border-radius: 20px;
  padding: 5px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e3f5c;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s;
}
.league-option:hover {
  border-color: #6f9bc1;
}
.league-option.active {
  background: #0f3b5e;
  border-color: #0f3b5e;
  color: white;
}
.league-option input[type="checkbox"] {
  display: none;
}

.filter-footer {
  padding: 12px 16px 16px;
  border-top: 1px solid #eef5fc;
  flex-shrink: 0;
}

.btn-apply {
  width: 100%;
  background: #0f3b5e;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-apply:hover {
  background: #1e537d;
}

@media (max-width: 380px) {
  .odds-line {
    padding: 8px 6px;
    gap: 4px;
  }
  .odds-tag {
    padding: 2px 5px;
    font-size: 0.72rem;
    gap: 1px;
  }
  .odds-tag em {
    font-size: 0.58rem;
  }
}
</style>
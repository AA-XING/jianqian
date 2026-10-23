<template>
  <div v-if="visible" class="modal-mask" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>筛选条件</h3>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <div class="filter-body">
        <!-- 条件 1：赔率 -->
        <div class="filter-item">
          <div class="filter-item-head title-only">
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
            <input type="number" step="0.1" v-model.number="filter1.min" placeholder="最小值" />
            <span class="sep">~</span>
            <input type="number" step="0.1" v-model.number="filter1.max" placeholder="最大值" />
          </div>
        </div>

        <!-- 条件 2：赛制 -->
        <div class="filter-item">
          <div class="filter-item-head">
            <div class="filter-title">赛制</div>
            <button class="btn-quick" @click="pickTop5Leagues">
              五大联赛
            </button>
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
              <input type="checkbox" :value="lg" v-model="filter2.leagues" />
              <span>{{ lg }}</span>
            </label>
          </div>
        </div>
      </div>

      <div class="filter-footer">
        <button class="btn-apply" @click="applyFilter">筛选</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

const props = defineProps({
  matchesData: { type: Array, default: () => [] },   // 原始数据
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'filter-change'])

/* ========== 筛选状态 ========== */
const filter1 = reactive({ enabled: false, includeHhad: false, min: 3.6, max: 6.4 })
const filter2 = reactive({ enabled: false, leagues: [] })

const appliedFilter1 = reactive({ enabled: false, includeHhad: false, min: 3.6, max: 6.4 })
const appliedFilter2 = reactive({ enabled: false, leagues: [] })

const hasActiveFilter = computed(() => appliedFilter1.enabled || appliedFilter2.enabled)

/* ========== 赛制选项 ========== */
const allLeagues = computed(() => {
  const set = new Set()
  for (const m of props.matchesData) {
    if (m.league) set.add(m.league)
  }
  return Array.from(set).sort()
})

/* ========== 应用筛选 ========== */
function applyFilter() {
  appliedFilter1.enabled = filter1.enabled
  appliedFilter1.includeHhad = filter1.includeHhad
  appliedFilter1.min = filter1.min
  appliedFilter1.max = filter1.max

  appliedFilter2.enabled = filter2.enabled
  appliedFilter2.leagues = filter2.enabled ? [...filter2.leagues] : []

  // ★ 过滤后数据
  const filtered = props.matchesData.filter(m => {
    // 条件 1
    if (appliedFilter1.enabled) {
      const checkOdds = (odds) => {
        if (!odds) return false
        const maxWL = Math.max(odds.win, odds.lose)
        return maxWL >= appliedFilter1.min && maxWL <= appliedFilter1.max
      }
      if (m.poolType === 'had' && !checkOdds(m.odds)) {
        if (!appliedFilter1.includeHhad) return false
        // 如果 includeHhad 允许，但要 hhad 满足——简化：先当 had 必须满足
        // 实际上一个比赛的两个 pool 是一组，这里必须整场比赛判断
      }
    }
    return true
  })

  // 简化：按 groupId 分组判断
  const groupMap = new Map()
  for (const m of props.matchesData) {
    const gid = m.groupId
    if (!groupMap.has(gid)) {
      groupMap.set(gid, { had: null, hhad: null })
    }
    if (m.poolType === 'had') groupMap.get(gid).had = m
    else if (m.poolType === 'hhad') groupMap.get(gid).hhad = m
  }

  const passedGids = new Set()
  for (const [gid, g] of groupMap) {
    let pass = true

    // 条件 1
    if (appliedFilter1.enabled) {
      const checkOdds = (odds) => {
        if (!odds) return false
        const maxWL = Math.max(odds.win, odds.lose)
        return maxWL >= appliedFilter1.min && maxWL <= appliedFilter1.max
      }
      const hadOk = checkOdds(g.had?.odds)
      const hhadOk = appliedFilter1.includeHhad ? checkOdds(g.hhad?.odds) : false
      if (!hadOk && !hhadOk) pass = false
    }

    // 条件 2
    if (pass && appliedFilter2.enabled && appliedFilter2.leagues.length > 0) {
      const league = (g.had || g.hhad)?.league
      if (!appliedFilter2.leagues.includes(league)) pass = false
    }

    if (pass) passedGids.add(gid)
  }

  const filteredFinal = props.matchesData.filter(m => passedGids.has(m.groupId))
  emit('filter-change', {
    matches: filteredFinal,
    hasActiveFilter: hasActiveFilter.value
  })
  emit('close')
}

/* ========== 重置 ========== */
function resetFilter() {
  filter1.enabled = false
  filter1.includeHhad = false
  filter1.min = 3.6
  filter1.max = 6.4
  filter2.enabled = false
  filter2.leagues = []

  appliedFilter1.enabled = false
  appliedFilter1.includeHhad = false
  appliedFilter1.min = 3.6
  appliedFilter1.max = 6.4
  appliedFilter2.enabled = false
  appliedFilter2.leagues = []

  emit('filter-change', { matches: props.matchesData, hasActiveFilter: false })
}

defineExpose({ resetFilter, hasActiveFilter })

/* ========== 五大联赛快捷选择 ========== */
const TOP5_LEAGUES = [
  '英超',
  '西甲',
  '意甲',
  '德甲',
  '法甲'
]

function pickTop5Leagues() {
  // 1. 启用赛制筛选
  filter2.enabled = true

  // 2. 从 allLeagues 里挑出属于五大联赛的（兼容实际名称）
  const matched = allLeagues.value.filter(lg => {
    return TOP5_LEAGUES.some(t5 => {
      // 兼容「英超」「英格兰超级联赛」等不同命名
      return lg.includes(t5) || t5.includes(lg)
    })
  })

  // 3. 直接选中（替换，不是追加）
  filter2.leagues = matched
}
</script>

<style scoped>
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

.filter-item-head {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  gap: 8px;
}

/* ★ 条件 1 专用：标题 + 勾选两端对齐 */
.filter-item-head.title-only {
  justify-content: space-between;
  gap: 0;
}

.filter-item-head.title-only .filter-enable {
  flex: 0 0 auto;
}

/* 标题靠左 */
.filter-item-head .filter-title {
  flex: 0 0 auto;
}

/* ★ 五大联赛按钮：居中 */
.btn-quick {
  flex: 1;
  display: flex;
  justify-content: center;
  background: #e6a23c;
  color: white;
  border: none;
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 2px 6px rgba(230, 162, 60, 0.25);
  max-width: 120px;
  margin: 0 auto;
}

.btn-quick:hover {
  background: #b88230;
}

.btn-quick:active {
  transform: scale(0.97);
}

/* 勾选框靠右 */
.filter-item-head .filter-enable {
  flex: 0 0 auto;
}

.filter-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0b2b4a;
}

.filter-enable input[type="checkbox"] {
  width: 26px;
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

.btn-quick {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #e6a23c;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 5px 14px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 2px 6px rgba(230, 162, 60, 0.3);
}

.btn-quick:hover {
  background: #b88230;
}

.btn-quick:active {
  transform: scale(0.97);
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
}
.filter-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #0f3b5e;
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
</style>
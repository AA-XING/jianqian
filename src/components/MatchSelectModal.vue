<template>
  <div class="fullscreen-page">
    <!-- 固定标题栏 -->
    <div class="page-header">
      <div class="header-row-1">
        <h2>选择比赛</h2>
        <div class="header-actions">
          <button class="btn-close" @click="$emit('close')">&times;</button>
        </div>
      </div>
      <div class="header-row-2">
        <span class="meta-count">
          {{ groups.length }} 场比赛
        </span>
      </div>
    </div>

    <!-- 可滚动主体 -->
    <div class="page-body">
      <div class="options-list">
        <div
          v-for="g in groups"
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
              <span class="odds-tag win">
                <em>胜</em>{{ fmt(g.had.odds.win) }}
                <span v-if="g.had.trend?.win" class="trend-arrow" :class="g.had.trend.win">
                  {{ g.had.trend.win === 'up' ? '▲' : '▼' }}
                </span>
              </span>
              <span class="odds-tag draw">
                <em>平</em>{{ fmt(g.had.odds.draw) }}
                <span v-if="g.had.trend?.draw" class="trend-arrow" :class="g.had.trend.draw">
                  {{ g.had.trend.draw === 'up' ? '▲' : '▼' }}
                </span>
              </span>
              <span class="odds-tag lose">
                <em>负</em>{{ fmt(g.had.odds.lose) }}
                <span v-if="g.had.trend?.lose" class="trend-arrow" :class="g.had.trend.lose">
                  {{ g.had.trend.lose === 'up' ? '▲' : '▼' }}
                </span>
              </span>
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
              <span class="odds-tag win">
                <em>胜</em>{{ fmt(g.hhad.odds.win) }}
                <span v-if="g.hhad.trend?.win" class="trend-arrow" :class="g.hhad.trend.win">
                  {{ g.hhad.trend.win === 'up' ? '▲' : '▼' }}
                </span>
              </span>
              <span class="odds-tag draw">
                <em>平</em>{{ fmt(g.hhad.odds.draw) }}
                <span v-if="g.hhad.trend?.draw" class="trend-arrow" :class="g.hhad.trend.draw">
                  {{ g.hhad.trend.draw === 'up' ? '▲' : '▼' }}
                </span>
              </span>
              <span class="odds-tag lose">
                <em>负</em>{{ fmt(g.hhad.odds.lose) }}
                <span v-if="g.hhad.trend?.lose" class="trend-arrow" :class="g.hhad.trend.lose">
                  {{ g.hhad.trend.lose === 'up' ? '▲' : '▼' }}
                </span>
              </span>
            </div>
            <span class="goal-badge" :class="goalClass(g.hhad.goalLine)">
              {{ formatGoalLine(g.hhad.goalLine) }}
            </span>
          </button>

          <span v-if="usedGroupIds.has(String(g.groupId))" class="used-tip">已选</span>
        </div>

        <div v-if="!groups.length" class="empty-list">
          没有符合条件的比赛
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  matchesData: { type: Array, default: () => [] },
  usedGroupIds: { type: Set, default: () => new Set() }
})
defineEmits(['select', 'close'])

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
  font-weight: 900;
  color: #0f3b5e;
  font-size: 0.94rem;
  font-family: ui-monospace, monospace;
  flex-shrink: 0;
  white-space: nowrap;
}
.odds-tag em {
  font-style: normal;
  font-size: 0.82rem;
  color: #7e94aa;
  font-weight: 500;
}
.odds-tag.win em { color: #2e8b57; }
.odds-tag.draw em { color: #b8860b; }
.odds-tag.lose em { color: #c0392b; }

/* 涨跌箭头 */
.trend-arrow {
  display: inline-block;
  font-size: 0.6rem;
  line-height: 1;
  margin-left: 1px;
  font-weight: 900;
  position: relative;
  top: -2px;
}
.trend-arrow.up {
  color: #e74c3c;
  opacity: 0.85;
}
.trend-arrow.down {
  color: #27ae60;
  opacity: 0.85;
}

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

@media (max-width: 380px) {
  .odds-line {
    padding: 8px 6px;
    gap: 4px;
  }
  .odds-tag {
    padding: 2px 5px;
    font-size: 0.8rem;
    gap: 1px;
  }
  .odds-tag em {
    font-size: 0.7rem;
  }
}
</style>
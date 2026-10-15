<template>
  <div class="fullscreen-page">
    <!-- 固定顶部栏 -->
    <div class="page-header">
      <div class="header-row-1">
        <h2>所有比赛赔率</h2>
        <div class="header-actions">
          <button
            class="btn-refresh"
            :disabled="refreshing || cooldown > 0"
            @click="$emit('refresh')"
          >
            <span class="refresh-icon" :class="{ spinning: refreshing }">🔄</span>
            <template v-if="refreshing">刷新中</template>
            <template v-else-if="cooldown > 0"> {{ cooldown }}s</template>
            <template v-else>刷新</template>
          </button>
          <button class="btn-close" @click="$emit('close')">&times;</button>
        </div>
      </div>
      <div class="header-row-2">
        <span class="meta-count">{{ groups.length }} 场比赛</span>
        <span v-if="fetchedAt" class="meta-time">
          最后更新: {{ formatTime(fetchedAt) }}
        </span>
      </div>
    </div>

    <!-- 可滚动的比赛列表 -->
    <div class="page-body">
      <div class="match-list">
        <div
          v-for="g in groups"
          :key="g.groupId"
          class="match-group"
        >
          <!-- 比赛对阵等信息 -->
          <div class="match-head">
            <span class="match-no">{{ g.matchNo }}</span>
            <span class="match-name">{{ g.name }}</span>
            <span class="match-league">{{ g.league }}</span>
          </div>

          <!-- 胜平负行（如有） -->
          <div v-if="g.had" class="odds-line">
            <span v-if="g.had.bettingSingle" class="single-badge">单</span>
            <div class="odds-row">
              <span class="odds-tag win"><em>胜</em>{{ fmt(g.had.odds.win) }}</span>
              <span class="odds-tag draw"><em>平</em>{{ fmt(g.had.odds.draw) }}</span>
              <span class="odds-tag lose"><em>负</em>{{ fmt(g.had.odds.lose) }}</span>
            </div>
            <span class="pool-badge had">胜平负</span>
          </div>

          <!-- 让球行（如有） -->
          <div v-if="g.hhad" class="odds-line">
            <span v-if="g.hhad.bettingSingle" class="single-badge">单</span>
            <div class="odds-row">
              <span class="odds-tag win"><em>胜</em>{{ fmt(g.hhad.odds.win) }}</span>
              <span class="odds-tag draw"><em>平</em>{{ fmt(g.hhad.odds.draw) }}</span>
              <span class="odds-tag lose"><em>负</em>{{ fmt(g.hhad.odds.lose) }}</span>
            </div>
            <span class="pool-badge hhad">
              <span class="goal-label">让</span>
              <span class="goal-num" :class="goalClass(g.hhad.goalLine)">
                {{ formatGoalLine(g.hhad.goalLine) }}
              </span>
            </span>
          </div>

          <!-- 都没有 -->
          <div v-if="!g.had && !g.hhad" class="odds-line empty">
            <span class="empty-text">暂无赔率</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  matchesData: { type: Array, default: () => [] },
  fetchedAt: { type: Number, default: null },
  refreshing: { type: Boolean, default: false },
  cooldown: { type: Number, default: 0 }
})
defineEmits(['close', 'refresh'])

/**
 * ★ 按 groupId 分组，把 had / hhad 合并到一个对象里
 */
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
        kickoff: m.kickoff,
        had: null,
        hhad: null
      })
    }
    const g = map.get(gid)
    if (m.poolType === 'had') {
      g.had = m
    } else if (m.poolType === 'hhad') {
      g.hhad = m
    }
  }

  return Array.from(map.values())
})

function fmt(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  return Number(v).toFixed(2)
}

function formatTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
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
  flex-shrink: 0;
}

.btn-refresh {
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
  transition: all 0.15s;
}
.btn-refresh:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.refresh-icon { display: inline-block; font-size: 0.82rem; }
.refresh-icon.spinning { animation: spin 0.9s linear infinite; }
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
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
.meta-time { color: #9fb3c8; }

.page-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 10px 10px 20px;
  width: 100%;
  max-width: 520px;
  box-sizing: border-box;
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ★ 每场比赛：一个卡片 */
.match-group {
  background: white;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 1px 4px rgba(0, 20, 40, 0.04);
}

/* 比赛头部 */
.match-head {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding-bottom: 6px;
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
  font-size: 0.92rem;
  flex: 1;
  min-width: 0;
}

.match-league {
  font-size: 0.68rem;
  color: #9fb3c8;
  flex-shrink: 0;
}

/* ★ 赔率行：单关 + 赔率 + 标记 */
.odds-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.odds-line.empty {
  justify-content: center;
  color: #9fb3c8;
  font-size: 0.78rem;
  font-style: italic;
}

/* 单关徽章 */
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

/* 赔率 */
.odds-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.odds-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f9fcff;
  padding: 3px 10px;
  border-radius: 14px;
  font-weight: 600;
  color: #0f3b5e;
  font-size: 0.82rem;
  font-family: ui-monospace, monospace;
}
.odds-tag em {
  font-style: normal;
  font-size: 0.68rem;
  color: #7e94aa;
  font-weight: 500;
}
.odds-tag.win em { color: #2e8b57; }
.odds-tag.draw em { color: #b8860b; }
.odds-tag.lose em { color: #c0392b; }

/* ★ 标记徽章 */
.pool-badge {
  font-size: 0.66rem;
  border-radius: 6px;
  font-weight: 700;
  display: inline-flex;
  align-items: stretch;
  overflow: hidden;
  flex-shrink: 0;
  margin-left: auto;
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

.goal-label {
  background: #b8860b;
  color: white;
  padding: 1px 6px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
}

.goal-num {
  padding: 1px 7px;
  font-weight: 900;
  font-family: ui-monospace, monospace;
  display: inline-flex;
  align-items: center;
  letter-spacing: 0.2px;
}
.goal-num.goal-pos {
  background: #e74c3c;
  color: #ffffff;
}
.goal-num.goal-neg {
  background: #27ae60;
  color: #ffffff;
}

.empty-text {
  font-size: 0.78rem;
}
</style>
<template>
  <div class="fullscreen-page">
    <div class="page-header">
      <div class="header-row-1">
        <h2>所有比赛赔率</h2>
        <button class="btn-close" @click="$emit('close')">&times;</button>
      </div>
      <div class="header-row-2">
        <span class="meta-count">{{ groups.length }} 场比赛</span>
        <span v-if="fetchedAt" class="meta-time">
          最后更新: {{ formatTime(fetchedAt) }}
        </span>
      </div>
    </div>

    <div class="page-body">
      <div class="match-list">
        <div
          v-for="g in groups"
          :key="g.groupId"
          class="match-group"
        >
          <div class="match-head">
            <span class="match-no">{{ g.matchNo }}</span>
            <span class="match-name">{{ g.name }}</span>
            <span class="match-league">{{ g.league }}</span>
          </div>

          <!-- 胜平负行 -->
          <div v-if="g.had" class="odds-line">
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
            <span class="pool-badge had">胜平负</span>
          </div>

          <!-- 让球行 -->
          <div v-if="g.hhad" class="odds-line">
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
            <span class="pool-badge hhad">
              <span class="goal-label">让</span>
              <span class="goal-num" :class="goalClass(g.hhad.goalLine)">
                {{ formatGoalLine(g.hhad.goalLine) }}
              </span>
            </span>
          </div>

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
  fetchedAt: { type: Number, default: null }
})
defineEmits(['close'])

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
    if (m.poolType === 'had') g.had = m
    else if (m.poolType === 'hhad') g.hhad = m
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

.match-group {
  background: white;
  border-radius: 12px;
  padding: 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 1px 4px rgba(0, 20, 40, 0.04);
}

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
  font-size: 0.9rem;
  flex: 1;
  min-width: 0;
}

.match-league {
  font-size: 0.68rem;
  color: #9fb3c8;
  flex-shrink: 0;
}

/* ★ 赔率行：不换行 */
.odds-line {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: nowrap;               /* ★ 不换行 */
  overflow: hidden;                 /* ★ 超出隐藏 */
  min-height: 28px;
}

.odds-line.empty {
  justify-content: center;
  color: #9fb3c8;
  font-size: 0.78rem;
  font-style: italic;
}

.single-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;                      /* ★ 18px → 16px */
  height: 16px;
  border-radius: 50%;
  background: #e74c3c;
  color: white;
  font-size: 0.6rem;
  font-weight: 800;
  flex-shrink: 0;
}

/* ★ 赔率行：不换行 + 收紧间距 */
.odds-row {
  display: flex;
  gap: 3px;                         /* ★ 4px → 3px */
  flex: 1;
  min-width: 0;
  flex-wrap: nowrap;                /* ★ 不换行 */
  overflow: hidden;
}

.odds-tag {
  display: inline-flex;
  align-items: center;
  gap: 1px;                         /* ★ 2px → 1px */
  background: #f9fcff;
  padding: 2px 5px;                 /* ★ 3px 6px → 2px 5px */
  border-radius: 10px;
  font-weight: 800;
  color: #0f3b5e;
  font-size: 0.94rem;               /* ★ 0.78rem → 0.74rem */
  font-family: ui-monospace, monospace;
  flex-shrink: 0;
  white-space: nowrap;
}
.odds-tag em {
  font-style: normal;
  font-size: 0.82rem;               /* ★ 0.62rem → 0.58rem */
  color: #7e94aa;
  font-weight: 500;
}
.odds-tag.win em { color: #2e8b57; }
.odds-tag.draw em { color: #b8860b; }
.odds-tag.lose em { color: #c0392b; }

/* 涨跌箭头 */
.trend-arrow {
  display: inline-block;
  font-size: 0.55rem;               /* ★ 0.65rem → 0.55rem */
  line-height: 1;
  margin-left: 1px;
  font-weight: 700;
}
.trend-arrow.up {
  color: #e74c3c;
  opacity: 0.75;
}
.trend-arrow.down {
  color: #27ae60;
  opacity: 0.75;
}

/* 标记徽章 */
.pool-badge {
  font-size: 0.62rem;               /* ★ 0.66rem → 0.62rem */
  border-radius: 5px;
  font-weight: 700;
  display: inline-flex;
  align-items: stretch;
  overflow: hidden;
  flex-shrink: 0;                   /* ★ 不收缩 */
  margin-left: auto;
}
.pool-badge.had {
  background: #2e8b57;
  color: white;
  padding: 1px 6px;                 /* ★ 1px 7px → 1px 6px */
  align-items: center;
  white-space: nowrap;
}
.pool-badge.hhad {
  background: transparent;
  padding: 0;
}

.goal-label {
  background: #b8860b;
  color: white;
  padding: 1px 5px;                 /* ★ 1px 6px → 1px 5px */
  font-weight: 700;
  display: inline-flex;
  align-items: center;
}

.goal-num {
  padding: 1px 6px;                 /* ★ 1px 7px → 1px 6px */
  font-weight: 900;
  font-family: ui-monospace, monospace;
  display: inline-flex;
  align-items: center;
  letter-spacing: 0.2px;
  white-space: nowrap;
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

/* ★ 窄屏进一步缩小 */
@media (max-width: 400px) {
  .odds-tag {
    padding: 2px 4px;
    font-size: 0.84rem;
    gap: 0;
  }
  .odds-tag em {
    font-size: 0.65rem;
  }
  .single-badge {
    width: 14px;
    height: 14px;
    font-size: 0.55rem;
  }
  .pool-badge {
    font-size: 0.58rem;
  }
  .pool-badge.had {
    padding: 1px 5px;
  }
  .goal-label {
    padding: 1px 4px;
  }
  .goal-num {
    padding: 1px 5px;
  }
  .trend-arrow {
    font-size: 0.5rem;
  }
}
</style>
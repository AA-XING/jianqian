<template>
  <div class="modal-mask" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>选择场次</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      <div class="options-list">
        <div
          v-for="g in groups"
          :key="g.groupId"
          class="match-group"
          :class="{ 'group-disabled': isGroupUsed(g) }"
        >
          <!-- 比赛对阵等信息 -->
          <div class="match-head">
            <span class="match-no">{{ g.matchNo }}</span>
            <span class="match-name">{{ g.name }}</span>
            <span class="match-league">{{ g.league }}</span>
          </div>

          <!-- ★ 胜平负行（可点选） -->
          <button
            v-if="g.had"
            class="odds-line"
            :class="{ used: usedGroupIds.has(g.groupId) }"
            :disabled="usedGroupIds.has(g.groupId)"
            @click="$emit('select', g.had)"
          >
            <span v-if="g.had.bettingSingle" class="single-badge">单</span>
            <div class="odds-row">
              <span class="odds-tag win"><em>胜</em>{{ fmt(g.had.odds.win) }}</span>
              <span class="odds-tag draw"><em>平</em>{{ fmt(g.had.odds.draw) }}</span>
              <span class="odds-tag lose"><em>负</em>{{ fmt(g.had.odds.lose) }}</span>
            </div>
            <span class="pool-badge had">胜平负</span>
          </button>

          <!-- ★ 让球行（可点选） -->
          <button
            v-if="g.hhad"
            class="odds-line"
            :class="{ used: usedGroupIds.has(g.groupId) }"
            :disabled="usedGroupIds.has(g.groupId)"
            @click="$emit('select', g.hhad)"
          >
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
          </button>

          <!-- 都没有 -->
          <div v-if="!g.had && !g.hhad" class="odds-line empty">
            <span class="empty-text">暂无赔率</span>
          </div>

          <!-- 「已选」提示 -->
          <span v-if="usedGroupIds.has(g.groupId)" class="used-tip">已选</span>
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

/* ★ 按 groupId 分组：把 had / hhad 合并到一个对象 */
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

/* 该场比赛是否已被其他行占用 */
function isGroupUsed(g) {
  return props.usedGroupIds.has(g.groupId)
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

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 460px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 16px 14px 18px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.modal-header h2 {
  margin: 0;
  font-size: 1.1rem;
  color: #0b2b4a;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.6rem;
  color: #6c7e92;
  cursor: pointer;
  line-height: 1;
  padding: 0 6px;
}

/* 列表 */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ★ 每场比赛：一个卡片 */
.match-group {
  position: relative;
  background: #f9fcff;
  border: 1px solid #e2eef9;
  border-radius: 12px;
  padding: 10px 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;                /* ★ 行间距加大 */
}

.match-group.group-disabled {
  opacity: 0.55;
  background: #f5f8fc;
}

/* 比赛头部 */
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

/* ★ 赔率行：整行可点击 */
.odds-line {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: white;
  border: 1px solid #e2eef9;
  border-radius: 10px;
  padding: 12px 10px;         /* ★ 内边距加大，方便点选 */
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
  font-family: inherit;
  min-height: 46px;           /* ★ 保证最小高度，触控友好 */
  flex-wrap: wrap;
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

.odds-line.used {
  opacity: 0.55;
}

.odds-line.empty {
  justify-content: center;
  color: #9fb3c8;
  font-size: 0.78rem;
  font-style: italic;
  cursor: default;
  min-height: 36px;
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

/* 标记徽章 */
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
  letter-spacing: 0.3px;
  text-shadow: 0.4px 0 0 currentColor, -0.4px 0 0 currentColor;
}
.goal-num.goal-pos {
  background: #e74c3c;
  color: #ffffff;
}
.goal-num.goal-neg {
  background: #27ae60;
  color: #ffffff;
}

/* 「已选」提示 */
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
</style>
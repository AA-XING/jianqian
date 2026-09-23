<template>
  <div class="modal-mask" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <div class="header-left">
          <h2>📊 所有比赛赔率</h2>
          <button
            class="refresh-btn"
            :disabled="refreshing || cooldown > 0"
            @click="$emit('refresh')"
            :title="refreshTitle"
          >
            <span class="refresh-icon" :class="{ spinning: refreshing }">🔄</span>
            <template v-if="refreshing">刷新中</template>
            <template v-else-if="cooldown > 0"> {{ cooldown }}s</template>
            <template v-else>刷新</template>
          </button>
        </div>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <!-- 顶部元信息：比赛场次 + 抓取时间 -->
      <div class="modal-meta">
        <span class="meta-count">{{ matchesData.length }} 场比赛</span>
        <span v-if="fetchedAt" class="meta-time">
          · 最后更新 {{ formatTime(fetchedAt) }}
        </span>
      </div>

      <div class="odds-list">
        <div
          v-for="match in matchesData"
          :key="match.id"
          class="match-item"
          :class="{ 'is-hhad': match.poolType === 'hhad' }"
        >
          <div class="match-head">
            <span class="match-no">{{ match.matchNo }}</span>
            <span v-if="match.bettingSingle" class="single-badge" title="可投单关">单</span>
            <span class="match-name">{{ match.name }}</span>
            <span
              class="pool-badge"
              :class="match.poolType === 'hhad' ? 'hhad' : 'had'"
            >
              {{ match.poolLabel }}
            </span>
          </div>

          <div class="odds-row">
            <span class="odds-tag win"><em>胜</em>{{ fmt(match.odds.win) }}</span>
            <span class="odds-tag draw"><em>平</em>{{ fmt(match.odds.draw) }}</span>
            <span class="odds-tag lose"><em>负</em>{{ fmt(match.odds.lose) }}</span>
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

const refreshTitle = computed(() => {
  if (props.refreshing) return '刷新中...'
  if (props.cooldown > 0) return `冷却中，还剩 ${props.cooldown} 秒`
  return '重新抓取赔率'
})

function fmt(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  return Number(v).toFixed(2)
}

function formatTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 20, 30, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 28px;
  max-width: 680px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  padding: 24px 26px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.modal-header h2 { margin: 0; font-size: 1.5rem; color: #0b2b4a; }

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #e9f0f8;
  color: #0f3b5e;
  border: 1px solid #cbdae9;
  border-radius: 30px;
  padding: 6px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  min-width: 100px;
  justify-content: center;
}

.refresh-btn:hover:not(:disabled) {
  background: #dae6f2;
  border-color: #6f9bc1;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  display: inline-block;
  font-size: 0.9rem;
}

.refresh-icon.spinning {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.modal-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: #7e94aa;
  padding-bottom: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid #eef5fc;
  flex-wrap: wrap;
}

.meta-count { font-weight: 600; color: #5a7188; }
.meta-time {
  color: #7e94aa;
  font-family: ui-monospace, monospace;
  font-size: 0.78rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: #6c7e92;
  line-height: 1;
  padding: 0 8px;
}
.close-btn:hover { color: #0b2b4a; }

.odds-list { display: flex; flex-direction: column; gap: 12px; }

.match-item {
  background: #f0f7ff;
  border-radius: 16px;
  padding: 14px 18px;
  border: 1px solid #d9e9fc;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.match-item.is-hhad { border-left: 4px solid #b8860b; }

.match-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.match-no {
  font-size: 0.72rem;
  background: #e9f0f8;
  color: #1e3f5c;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 600;
}

.single-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #e74c3c;
  color: white;
  font-size: 0.72rem;
  font-weight: 800;
  box-shadow: 0 2px 6px rgba(231, 76, 60, 0.4);
  flex-shrink: 0;
}

.match-name {
  font-weight: 600;
  color: #1e3f5c;
  font-size: 0.95rem;
  flex: 1;
  min-width: 180px;
}

.pool-badge {
  font-size: 0.7rem;
  padding: 2px 10px;
  border-radius: 8px;
  font-weight: 700;
}

.pool-badge.had { background: #2e8b57; color: white; }
.pool-badge.hhad { background: #b8860b; color: white; }

.odds-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.odds-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: white;
  padding: 5px 12px;
  border-radius: 30px;
  font-weight: 600;
  color: #0f3b5e;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border: 1px solid #e2eef9;
}

.odds-tag em {
  font-style: normal;
  font-size: 0.75rem;
  color: #7e94aa;
  font-weight: 500;
}

.odds-tag.win em { color: #2e8b57; }
.odds-tag.draw em { color: #b8860b; }
.odds-tag.lose em { color: #c0392b; }
</style>
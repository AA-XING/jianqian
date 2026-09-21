<template>
  <div class="modal-mask" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>📊 所有比赛赔率</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      <div class="odds-list">
        <div v-for="match in matchesData" :key="match.id" class="match-item">
          <div class="match-name">{{ match.name }}</div>
          <div class="odds-values">
            <span class="odds-tag win">
              <em>胜</em>{{ match.odds.win.toFixed(2) }}
            </span>
            <span class="odds-tag draw">
              <em>平</em>{{ match.odds.draw.toFixed(2) }}
            </span>
            <span class="odds-tag lose">
              <em>负</em>{{ match.odds.lose.toFixed(2) }}
            </span>
          </div>
        </div>
      </div>
      <div class="modal-small">
        {{ matchesData.length }} 场比赛
        <span v-if="fetchedAt" class="fetched-time">
          · 抓取时间 {{ formatTime(fetchedAt) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  matchesData: { type: Array, default: () => [] },
  fetchedAt: { type: Number, default: null }   // ★ 新增
})
defineEmits(['close'])

function formatTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
</script>

<style scoped>
/* 原有样式保留 */
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
  max-width: 620px;
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
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #0b2b4a;
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

.odds-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.match-item {
  background: #f0f7ff;
  border-radius: 16px;
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #d9e9fc;
  gap: 12px;
  flex-wrap: wrap;
}

.match-name {
  font-weight: 600;
  color: #1e3f5c;
  font-size: 0.95rem;
  flex: 1;
  min-width: 180px;
}

.odds-values {
  display: flex;
  gap: 8px;
}

.odds-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: white;
  padding: 6px 12px;
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

.modal-small {
  font-size: 0.85rem;
  color: #7e94aa;
  margin-top: 16px;
  text-align: center;
}

/* ★ 抓取时间样式 */
.fetched-time {
  color: #5a7188;
  font-family: ui-monospace, monospace;
  font-size: 0.8rem;
  margin-left: 4px;
}
</style>
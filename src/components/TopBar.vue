<template>
  <div class="top-bar">
    <!-- ★ 第一行：标题 -->
    <h1>jianqian</h1>

    <!-- ★ 第二行：时间 + 按钮 -->
    <div class="top-actions">
      <span v-if="fetchedAt" class="fetch-time">
        最后更新: {{ formatTime(fetchedAt) }}
      </span>

      <button
        class="btn-refresh"
        :disabled="refreshing || cooldown > 0"
        @click="$emit('refresh')"
      >
        <span class="refresh-icon" :class="{ spinning: refreshing }">🔄</span>
        <template v-if="refreshing">刷新中</template>
        <template v-else-if="cooldown > 0">{{ cooldown }}s</template>
        <template v-else>刷新</template>
      </button>

      <button class="btn-odds-view" @click="$emit('view-odds')">
        所有比赛
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  refreshing: { type: Boolean, default: false },
  cooldown: { type: Number, default: 0 },
  fetchedAt: { type: Number, default: null }
})
defineEmits(['view-odds', 'refresh'])

function formatTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style scoped>
/* ★ 改为纵向布局 */
.top-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef5fc;
}

.top-bar h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0b2b4a;
  margin: 0;
  letter-spacing: -0.5px;
}

/* ★ 第二行：时间和按钮排成一行 */
.top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.fetch-time {
  flex: 1;
  font-size: 0.72rem;
  color: #9fb3c8;
  font-family: ui-monospace, monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #eef5fc;
  color: #0f3b5e;
  border: none;
  border-radius: 20px;
  padding: 7px 12px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  min-width: 74px;
  justify-content: center;
  flex-shrink: 0;
}

.btn-refresh:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.refresh-icon {
  display: inline-block;
  font-size: 0.82rem;
}
.refresh-icon.spinning {
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.btn-odds-view {
  background: #0f3b5e;
  border: none;
  color: white;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 20px;
  font-size: 0.82rem;
  cursor: pointer;
  flex-shrink: 0;
}
.btn-odds-view:hover { background: #1e537d; }
</style>
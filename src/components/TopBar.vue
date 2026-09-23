<template>
  <div class="top-bar">
    <h1>jianqian</h1>

    <!-- ★ 中间：上次抓取时间 -->
    <div class="fetch-time">
      <template v-if="fetchedAt">
        最后更新 {{ formatTime(fetchedAt) }}
      </template>
    </div>

    <div class="top-actions">
      <!-- 刷新赔率 -->
      <button
        class="btn-refresh"
        :disabled="refreshing || cooldown > 0"
        @click="$emit('refresh')"
        :title="refreshTitle"
      >
        <span class="refresh-icon" :class="{ spinning: refreshing }">🔄</span>
        <template v-if="refreshing">刷新中</template>
        <template v-else-if="cooldown > 0"> {{ cooldown }}s</template>
        <template v-else>刷新</template>
      </button>

      <!-- 所有比赛 -->
      <button class="btn-odds-view" @click="$emit('view-odds')">
        📋 所有比赛
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  refreshing: { type: Boolean, default: false },
  cooldown: { type: Number, default: 0 },
  fetchedAt: { type: Number, default: null }   // ★ 新增
})
defineEmits(['view-odds', 'refresh'])

const refreshTitle = computed(() => {
  if (props.refreshing) return '刷新中...'
  if (props.cooldown > 0) return `冷却中，还剩 ${props.cooldown} 秒`
  return '重新抓取赔率'
})

function formatTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
</script>

<style scoped>
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  gap: 12px;
  flex-wrap: wrap;
}

.top-bar h1 {
  font-size: 1.8rem;
  font-weight: 600;
  color: #0b2b4a;
  margin: 0;
  letter-spacing: -0.5px;
}

/* ★ 中间：上次抓取时间 */
.fetch-time {
  flex: 1;
  text-align: center;
  font-size: 0.78rem;
  color: #8ba0b8;
  font-family: ui-monospace, monospace;
  letter-spacing: 0.2px;
  white-space: nowrap;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 刷新按钮 */
.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #e9f0f8;
  color: #0f3b5e;
  border: 1px solid #cbdae9;
  border-radius: 40px;
  padding: 10px 18px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  min-width: 110px;
  justify-content: center;
}

.btn-refresh:hover:not(:disabled) {
  background: #dae6f2;
  border-color: #6f9bc1;
}

.btn-refresh:disabled {
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

/* 所有比赛按钮 */
.btn-odds-view {
  background: #0f3b5e;
  border: none;
  color: white;
  font-weight: 500;
  padding: 10px 20px;
  border-radius: 40px;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s;
  box-shadow: 0 4px 10px rgba(0, 40, 80, 0.2);
}

.btn-odds-view:hover {
  background: #1e537d;
}

/* 窄屏时隐藏中间时间 */
@media (max-width: 560px) {
  .fetch-time {
    display: none;
  }
}
</style>
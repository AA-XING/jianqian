<template>
  <div class="top-bar">
    <button class="logo-btn" @click="$emit('view-pushes')">
      jianqian
    </button>

    <div class="top-actions">
      <span v-if="fetchedAt" class="fetch-time">
        {{ formatTime(fetchedAt) }}
      </span>

      <button class="btn-odds-view" @click="$emit('view-odds')">
        所有比赛
      </button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['view-odds', 'view-pushes', 'refresh'])
const props = defineProps({
  fetchedAt: { type: Number, default: null }
})

function formatTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style scoped>
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef5fc;
}

.logo-btn {
  background: #cc6464;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 6px 14px;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}
.logo-btn:hover {
  background: #d98a8a;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.fetch-time {
  font-size: 0.7rem;
  color: #9fb3c8;
  font-family: ui-monospace, monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
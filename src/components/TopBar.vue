<template>
  <div class="top-bar">
    <button class="logo-btn" @click="$emit('view-pushes')">
      jianqian
    </button>

    <div class="top-actions">
      <span v-if="fetchedAt" class="fetch-time">
        {{ formatTime(fetchedAt) }}
      </span>

      <!-- ★ 筛选按钮 -->
      <button
        class="btn-filter"
        :class="{ active: hasActiveFilter }"
        @click="$emit('open-filter')"
      >
        🔍 {{ hasActiveFilter ? '已筛选' : '筛选' }}
      </button>

      <!-- ★ 重置按钮（有筛选时显示） -->
      <button
        v-if="hasActiveFilter"
        class="btn-reset-filter"
        @click="$emit('reset-filter')"
      >
        ↺
      </button>

      <button
        class="btn-odds-view"
        :class="{ 'filter-active': hasActiveFilter }"
        @click="$emit('view-odds')"
      >
        {{ hasActiveFilter ? `${filteredCount} 场比赛` : `${totalCount} 场比赛` }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['view-odds', 'view-pushes', 'refresh'])
const props = defineProps({
  fetchedAt: { type: Number, default: null },
  hasActiveFilter: { type: Boolean, default: false },
  totalCount: { type: Number, default: 0 },      // ★ 总数
  filteredCount: { type: Number, default: 0 }    // ★ 筛选后数量
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

/* ★ 筛选按钮 */
.btn-filter {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: #eef5fc;
  color: #0f3b5e;
  border: none;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}
.btn-filter:hover {
  background: #dae6f2;
}
.btn-filter.active {
  background: #e74c3c;
  color: white;
}

/* ★ 重置按钮 */
.btn-reset-filter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #fff7e6;
  color: #b88230;
  border: none;
  border-radius: 50%;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
}
.btn-reset-filter:hover {
  background: #fdebc8;
}

.btn-odds-view {
  background: #0f3b5e;
  border: none;
  color: white;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}
.btn-odds-view:hover {
  background: #1e537d;
}

/* ★ 筛选生效时醒目提示 */
.btn-odds-view.filter-active {
  background: #e74c3c;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.2);
  font-weight: 800;
  animation: pulse 2s infinite;
}

.btn-odds-view.filter-active:hover {
  background: #c0392b;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.2); }
  50% { box-shadow: 0 0 0 6px rgba(231, 76, 60, 0.1); }
}

/* ★ 零结果时灰色 */
.btn-odds-view.zero {
  background: #b6c6d6;
  cursor: not-allowed;
}
</style>
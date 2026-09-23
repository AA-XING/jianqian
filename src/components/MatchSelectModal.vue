<template>
  <div class="modal-mask" @click.self="$emit('close')">
    <div class="modal-content" style="max-width: 560px;">
      <div class="modal-header">
        <h2>🏟️ 选择场次</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      <div class="options-list">
        <button
          v-for="match in matchesData"
          :key="match.id"
          class="option-btn"
          :class="{
            disabled: usedGroupIds.has(match.groupId),
            'is-hhad': match.poolType === 'hhad'
          }"
          :disabled="usedGroupIds.has(match.groupId)"
          @click="$emit('select', match)"
        >
          <div class="match-head">
            <span class="match-no">{{ match.matchNo }}</span>

            <!-- ★ 可单关徽章 -->
            <span v-if="match.bettingSingle" class="single-badge" title="可投单关">单</span>

            <span class="match-name">{{ match.name }}</span>
            <span
              class="pool-badge"
              :class="match.poolType === 'hhad' ? 'hhad' : 'had'"
            >
              {{ match.poolLabel }}
            </span>
          </div>

          <div class="match-odds">
            <em>胜</em>{{ fmt(match.odds.win) }}
            <em>平</em>{{ fmt(match.odds.draw) }}
            <em>负</em>{{ fmt(match.odds.lose) }}
          </div>

          <span v-if="usedGroupIds.has(match.groupId)" class="used-tip">已选</span>
        </button>
      </div>
      <div class="modal-small">同一场比赛的胜平负 / 让球只能选一条</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  matchesData: { type: Array, default: () => [] },
  usedGroupIds: { type: Set, default: () => new Set() }
})
defineEmits(['select', 'close'])

function fmt(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  return Number(v).toFixed(2)
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
  max-width: 600px;
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

.modal-header h2 { margin: 0; font-size: 1.5rem; color: #0b2b4a; }

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

.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-btn {
  background: #e9f0f8;
  border: 1px solid transparent;
  padding: 12px 16px;
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
  position: relative;
}

.option-btn:hover:not(:disabled) {
  background: #dae6f2;
  border-color: #b6cee6;
}

.option-btn.disabled {
  opacity: 0.45;
  cursor: not-allowed;
  background: #f5f8fc;
}

.option-btn.is-hhad:not(.disabled) {
  border-left: 4px solid #b8860b;
}

.match-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.match-no {
  font-size: 0.72rem;
  background: #d6e7f7;
  color: #1e3f5c;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 600;
}

/* ★ 可单关徽章 */
.single-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
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
  color: #0b2b4a;
  font-size: 0.92rem;
  flex: 1;
  min-width: 140px;
}

.pool-badge {
  font-size: 0.7rem;
  padding: 2px 10px;
  border-radius: 8px;
  font-weight: 700;
}

.pool-badge.had { background: #2e8b57; color: white; }
.pool-badge.hhad { background: #b8860b; color: white; }

.match-odds {
  display: inline-flex;
  gap: 12px;
  font-weight: 600;
  color: #0f3b5e;
  font-size: 0.9rem;
}

.match-odds em {
  font-style: normal;
  color: #7e94aa;
  font-weight: 500;
  margin-right: 2px;
}

.used-tip {
  position: absolute;
  top: 12px;
  right: 16px;
  font-size: 0.7rem;
  color: #c0392b;
  background: #fdecea;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.modal-small {
  font-size: 0.85rem;
  color: #7e94aa;
  margin-top: 16px;
  text-align: center;
}
</style>
<template>
  <div class="modal-mask" @click.self="$emit('close')">
    <div class="modal-content" style="max-width: 480px;">
      <div class="modal-header">
        <h2>🏟️ 选择场次</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      <div class="options-list">
        <button
          v-for="match in matchesData"
          :key="match.id"
          class="option-btn"
          :class="{ disabled: usedMatchIds.has(match.id) }"
          :disabled="usedMatchIds.has(match.id)"
          @click="$emit('select', match)"
        >
          <span class="match-name">{{ match.name }}</span>
          <span class="match-odds">
            <em>胜</em>{{ match.odds.win.toFixed(2) }}
            <em>平</em>{{ match.odds.draw.toFixed(2) }}
            <em>负</em>{{ match.odds.lose.toFixed(2) }}
          </span>
          <span v-if="usedMatchIds.has(match.id)" class="used-tip">已选</span>
        </button>
      </div>
      <div class="modal-small">与「所有比赛」数据一致 · 不同场次不能重复</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  matchesData: { type: Array, default: () => [] },
  // ★ 已被其他行占用的 matchId 集合
  usedMatchIds: { type: Set, default: () => new Set() }
})
defineEmits(['select', 'close'])
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
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  text-align: left;
  flex-wrap: wrap;
  position: relative;
}

.option-btn:hover:not(:disabled) {
  background: #dae6f2;
  border-color: #b6cee6;
}

/* ★ 已选状态 */
.option-btn.disabled {
  opacity: 0.45;
  cursor: not-allowed;
  background: #f5f8fc;
}

.match-name {
  font-weight: 600;
  color: #0b2b4a;
  font-size: 0.92rem;
  flex: 1;
  min-width: 160px;
}

.match-odds {
  display: inline-flex;
  gap: 8px;
  font-weight: 600;
  color: #0f3b5e;
  font-size: 0.82rem;
}

.match-odds em {
  font-style: normal;
  color: #7e94aa;
  font-weight: 500;
  margin-right: 2px;
}

/* ★ 「已选」标签 */
.used-tip {
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
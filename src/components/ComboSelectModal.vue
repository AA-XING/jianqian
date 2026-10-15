<template>
  <div class="modal-mask" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>选择赔率组合</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      <div class="options-list">
        <button
          v-for="opt in options"
          :key="opt.type"
          class="option-btn"
          :class="{ active: current === opt.type }"
          @click="$emit('select', opt.type)"
        >
          <span class="combo-label" :class="labelClass(opt.a.label)">{{ opt.a.label }}</span>
          <span class="combo-odds">{{ opt.a.value.toFixed(2) }}</span>
          <span class="combo-plus">+</span>
          <span class="combo-label" :class="labelClass(opt.b.label)">{{ opt.b.label }}</span>
          <span class="combo-odds">{{ opt.b.value.toFixed(2) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  odds: { type: Object, default: null },
  current: { type: String, default: 'wp' }
})
defineEmits(['select', 'close'])

const options = computed(() => {
  if (!props.odds) return []
  return [
    {
      type: 'wp',
      a: { label: '胜', value: props.odds.win },
      b: { label: '平', value: props.odds.draw }
    },
    {
      type: 'pl',
      a: { label: '平', value: props.odds.draw },
      b: { label: '负', value: props.odds.lose }
    },
    {
      type: 'wl',
      a: { label: '胜', value: props.odds.win },
      b: { label: '负', value: props.odds.lose }
    }
  ]
})

function labelClass(label) {
  if (label === '胜') return 'win'
  if (label === '平') return 'draw'
  return 'lose'
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
  max-width: 380px;
  padding: 16px 16px 20px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
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

.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: white;
  border: 1px solid #cbdae9;
  border-radius: 12px;
  padding: 14px;
  cursor: pointer;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0e3a5c;
  font-family: ui-monospace, monospace;
  transition: all 0.15s;
}

.option-btn.active {
  background: #0f3b5e;
  border-color: #0f3b5e;
  color: white;
}

.option-btn.active .combo-plus {
  color: #b6d6f0;
}

.combo-label {
  display: inline-block;
  font-size: 0.78rem;
  padding: 2px 8px;
  border-radius: 8px;
  color: white;
  font-weight: 700;
}
.combo-label.win { background: #2e8b57; }
.combo-label.draw { background: #b8860b; }
.combo-label.lose { background: #c0392b; }

.combo-odds { font-weight: 700; font-size: 1.05rem; }
.combo-plus { color: #7e94aa; font-weight: 400; margin: 0 2px; font-size: 0.85rem; }
</style>
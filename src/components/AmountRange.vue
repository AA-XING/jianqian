<template>
  <div class="amount-block">
    <div class="label">总额范围</div>
    <div class="inputs">
      <input
        type="number"
        :value="min"
        placeholder="下界"
        min="0"
        step="1"
        :class="{ error: isInvalid }"
        @input="$emit('update:min', Number($event.target.value))"
      />
      <span class="sep">~</span>
      <input
        type="number"
        :value="max"
        placeholder="上界"
        min="0"
        step="1"
        :class="{ error: isInvalid }"
        @input="$emit('update:max', Number($event.target.value))"
      />
    </div>
    <div v-if="isInvalid" class="error-tip">⚠️ 下界不能大于上界</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  min: { type: Number, default: 0 },
  max: { type: Number, default: 1000 }
})
defineEmits(['update:min', 'update:max'])

const isInvalid = computed(() => Number(props.min) > Number(props.max))
</script>

<style scoped>
/* ★ 改为纵向布局 */
.amount-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
}

.label {
  font-weight: 600;
  color: #1e3f5c;
  font-size: 0.85rem;
}

.inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.inputs input {
  flex: 1;
  min-width: 0;
  border: 1px solid #d9e6f2;
  border-radius: 10px;
  padding: 9px 10px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a2f44;
  outline: none;
  background: white;
  text-align: center;
  /* 隐藏数字输入框上下箭头 */
  -moz-appearance: textfield;
}
.inputs input::-webkit-outer-spin-button,
.inputs input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.inputs input:focus {
  border-color: #6f9bc1;
}
.inputs input.error {
  border-color: #e74c3c;
  background: #fff5f5;
}

.sep {
  color: #9fb3c8;
  font-weight: 600;
}

.error-tip {
  color: #e74c3c;
  font-size: 0.78rem;
  margin-top: 2px;
}
</style>
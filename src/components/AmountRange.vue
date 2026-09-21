<template>
  <div class="row">
    <div class="label">总金额范围</div>
    <div class="amount-range">
      <div class="amount-input" :class="{ error: isInvalid }">
        <span>下界</span>
        <input
          type="number"
          :value="min"
          placeholder="0"
          min="0"
          step="1"
          @input="$emit('update:min', Number($event.target.value))"
        />
      </div>
      <div class="amount-input" :class="{ error: isInvalid }">
        <span>上界</span>
        <input
          type="number"
          :value="max"
          placeholder="1000"
          min="0"
          step="1"
          @input="$emit('update:max', Number($event.target.value))"
        />
      </div>
    </div>
  </div>
  <!-- 错误提示 -->
  <div v-if="isInvalid" class="error-tip">
    ⚠️ 下界不能大于上界
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  min: { type: Number, default: 0 },
  max: { type: Number, default: 1000 }
})
defineEmits(['update:min', 'update:max'])

// 实时校验：下界 > 上界 即为非法
const isInvalid = computed(() => {
  return Number(props.min) > Number(props.max)
})
</script>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
}

.label {
  font-weight: 500;
  color: #1e3f5c;
  min-width: 100px;
  font-size: 0.95rem;
}

.amount-range {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.amount-input {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 4px 12px 4px 16px;
  border-radius: 40px;
  border: 1px solid #d9e6f2;
  transition: border-color 0.2s, box-shadow 0.2s;
}

/* 错误状态：红色边框 + 淡红背景 */
.amount-input.error {
  border-color: #e74c3c;
  background: #fff5f5;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.12);
}

.amount-input span {
  color: #6c7e92;
  font-size: 0.9rem;
}

.amount-input input {
  border: none;
  outline: none;
  width: 110px;
  padding: 10px 0;
  font-size: 1rem;
  font-weight: 500;
  color: #1a2f44;
  background: transparent;
}

.amount-input input::placeholder {
  color: #afc2d6;
}

/* 错误提示文字 */
.error-tip {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 8px;
  margin-left: 112px;
  font-weight: 500;
  animation: shake 0.3s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
</style>
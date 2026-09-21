<template>
  <div class="row">
    <div class="label">场次数量</div>
    <div class="match-count">
      <button
        v-for="num in 3"
        :key="num"
        :class="{ active: modelValue === num }"
        @click="$emit('update:modelValue', num)"
      >
        {{ num }}
      </button>
    </div>
    <span class="placeholder-note">(1~3场)</span>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: Number, default: 1 }
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.label {
  font-weight: 500;
  color: #1e3f5c;
  min-width: 100px;
  font-size: 0.95rem;
}

.match-count {
  display: flex;
  gap: 8px;
}

.match-count button {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  border: 1px solid #bdd3e8;
  background: white;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e3f5c;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.match-count button.active {
  background: #0f3b5e;
  border-color: #0f3b5e;
  color: white;
  box-shadow: 0 8px 14px rgba(15, 59, 94, 0.25);
}

.placeholder-note {
  font-size: 0.8rem;
  color: #8ba0b8;
  margin-left: 12px;
}
</style>
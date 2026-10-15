<template>
  <div class="row">
    <div class="label">场次数</div>
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
  </div>
</template>

<script setup>
defineProps({ modelValue: { type: Number, default: 1 } })
defineEmits(['update:modelValue'])
</script>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.label {
  font-weight: 600;
  color: #1e3f5c;
  font-size: 0.85rem;
  min-width: 36px;
}
.match-count {
  display: flex;
  gap: 6px;
}
.match-count button {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid #d9e6f2;
  background: white;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1e3f5c;
  cursor: pointer;
  transition: all 0.15s;
}
.match-count button.active {
  background: #0f3b5e;
  border-color: #0f3b5e;
  color: white;
}
</style>
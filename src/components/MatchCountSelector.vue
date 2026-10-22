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

    <!-- ★ 随机捡按钮 -->
    <button class="btn-random" @click="$emit('random-pick')">
      <span>随机捡</span>
      <span class="random-hint">单场3%-7.5%</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: Number, default: 1 }
})
defineEmits(['update:modelValue', 'random-pick'])
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

/* ★ 随机捡按钮 */
.btn-random {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  margin-left: auto;
  background: #fff7e6;
  border: 1px solid #f0d78c;
  border-radius: 10px;
  padding: 5px 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-random:hover {
  background: #fdebc8;
  border-color: #e6a23c;
}

.btn-random > span:first-child {
  font-size: 0.82rem;
  font-weight: 700;
  color: #b88230;
}

.random-hint {
  font-size: 0.62rem;
  color: #c9a24a;
  font-weight: 500;
  line-height: 1;
}
</style>
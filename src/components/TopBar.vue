<template>
  <div class="top-bar">
    <h1>jianqian</h1>
    <button class="btn-odds-view" @click="$emit('view-odds')">
      📋 所有比赛
    </button>
  </div>
</template>

<script setup>
defineEmits(['view-odds'])
</script>

<style scoped>
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}

.top-bar h1 {
  font-size: 1.8rem;
  font-weight: 600;
  color: #0b2b4a;
  margin: 0;
  letter-spacing: -0.5px;
}

.btn-odds-view {
  background: #0f3b5e;
  border: none;
  color: white;
  font-weight: 500;
  padding: 10px 20px;
  border-radius: 40px;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s;
  box-shadow: 0 4px 10px rgba(0, 40, 80, 0.2);
}

.btn-odds-view:hover {
  background: #1e537d;
}
</style>
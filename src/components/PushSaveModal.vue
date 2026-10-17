<template>
  <div class="modal-mask" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>推单</h3>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal-body">
        <textarea
          v-model="remark"
          class="remark-input"
          placeholder="备注（可不填）"
          rows="3"
          maxlength="200"
        ></textarea>
      </div>

      <div class="modal-footer">
        <button class="btn-push" :disabled="saving || pushed" @click="handlePush">
          {{ pushed ? '已推' : (saving ? '保存中...' : '推') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  result: { type: Object, required: true },
  copyText: { type: String, default: '' },
  parlayItems: { type: Array, default: () => [] }   // ★ 新增
})
const emit = defineEmits(['close', 'saved', 'open-pushes'])

const remark = ref('')
const saving = ref(false)
const pushed = ref(false)   // ★ 新增

async function handlePush() {
  if (saving.value) return
  saving.value = true

  try {
    const res = await fetch('/api/pushes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        remark: remark.value.trim(),
        result: props.result,
        copyText: props.copyText,
        parlayItems: props.parlayItems || []
      })
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || '保存失败')
    doSuccess()
  } catch (e) {
    if (import.meta.env.DEV) {
      const list = JSON.parse(localStorage.getItem('__pushes_mock') || '[]')
      list.unshift({
        id: Date.now().toString(36),
        savedAt: Date.now(),
        remark: remark.value.trim(),
        result: props.result,
        copyText: props.copyText,
        parlayItems: props.parlayItems || []
      })
      localStorage.setItem('__pushes_mock', JSON.stringify(list))
      doSuccess()
    } else {
      alert('保存失败：' + e.message)
      saving.value = false
    }
  }
}

// 新增：成功处理
function doSuccess() {
  pushed.value = true
  // 1 秒后关闭弹窗并打开已推页面
  setTimeout(() => {
    emit('saved')
    emit('close')
    emit('open-pushes')
  }, 1000)
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
  z-index: 1100;
  padding: 16px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 360px;
  padding: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.05rem;
  color: #0b2b4a;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6c7e92;
  cursor: pointer;
  line-height: 1;
  padding: 0 6px;
}

.modal-body {
  margin-bottom: 12px;
}

.remark-input {
  width: 100%;
  border: 1px solid #d9e6f2;
  border-radius: 10px;
  padding: 10px;
  font-size: 0.88rem;
  color: #1a2f44;
  outline: none;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
  box-sizing: border-box;
}
.remark-input:focus {
  border-color: #6f9bc1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
}

.btn-push {
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 32px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
}
.btn-push:hover:not(:disabled) {
  background: #c0392b;
}
.btn-push:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
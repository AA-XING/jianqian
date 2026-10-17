<template>
  <div class="fullscreen-page">
    <div class="page-header">
      <div class="header-row-1">
        <!-- ★ 标签页替换标题 -->
        <div class="tabs">
          <button
            class="tab"
            :class="{ active: currentTab === 'pushed' }"
            @click="currentTab = 'pushed'"
          >
            已推
          </button>
          <button
            class="tab"
            :class="{ active: currentTab === 'picked' }"
            @click="currentTab = 'picked'"
          >
            已捡
          </button>
        </div>
        <div class="header-actions">
          <button class="btn-refresh" :disabled="loading" @click="load">
            {{ loading ? '加载中' : '刷新' }}
          </button>
          <button class="btn-close" @click="$emit('close')">&times;</button>
        </div>
      </div>
    </div>

    <div class="page-body">
      <!-- 已推标签 -->
      <template v-if="currentTab === 'pushed'">
        <div v-if="loading" class="empty-tip">加载中...</div>
        <div v-else-if="!list.length" class="empty-tip">-</div>

        <div v-else class="push-list">
          <div
            v-for="p in list"
            :key="p.id"
            class="push-card"
            @click="openDetail(p)"
          >
            <div class="push-remark">{{ p.remark || '（无备注）' }}</div>
            <div class="push-time">{{ formatTime(p.savedAt) }}</div>
            <div class="push-matches">
              <div
                v-for="(m, i) in getAllMatches(p)"
                :key="i"
                class="push-match-line"
              >
                <span v-if="m.poolType === 'hhad'" class="goal-tag">
                  {{ formatGoalLine(m.goalLine) }}
                </span>
                <span class="match-name">{{ m.matchName }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 已捡标签（占位） -->
      <template v-else>
        <div class="empty-tip">-</div>
      </template>
    </div>

    <!-- 详情弹窗 -->
    <div v-if="detail" class="detail-mask" @click.self="detail = null">
      <div class="detail-content">
        <div class="detail-header">
          <h3></h3>
          <button class="close-btn" @click="detail = null">&times;</button>
        </div>
        <div class="detail-body">
          <ResultPanel :data="detail.result" hide-push />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ResultPanel from './ResultPanel.vue'

defineEmits(['close'])

const list = ref([])
const loading = ref(false)
const detail = ref(null)
const currentTab = ref('pushed')

async function load() {
  loading.value = true
  try {
    const res = await fetch('/api/pushes')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    list.value = data.list || []
  } catch (e) {
    if (import.meta.env.DEV) {
      const mock = JSON.parse(localStorage.getItem('__pushes_mock') || '[]')
      list.value = mock
    } else {
      list.value = []
    }
  } finally {
    loading.value = false
  }
}

function openDetail(p) {
  detail.value = p
}

/** 从 result 里提取所有比赛 */
function getAllMatches(p) {
  const result = p.result
  if (!result?.details?.length) return []

  // 取第一个组合的 combo 作为代表
  const firstDetail = result.details[0]
  const combo = firstDetail.combo || []

  // ★ 加上串买项
  const parlay = (p.parlayItems || []).map(item => ({
    matchNo: item.matchNo,
    matchName: item.matchName,
    poolType: item.poolType,
    goalLine: item.goalLine,
    label: item.selectedOdds?.label
  }))

  return [...combo, ...parlay]
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatGoalLine(gl) {
  const n = Number(gl)
  if (Number.isNaN(n)) return '—'
  return n >= 0 ? `+${n}` : `${n}`
}

function labelClass(label) {
  if (label === '胜') return 'win'
  if (label === '平') return 'draw'
  return 'lose'
}

onMounted(load)
</script>

<style scoped>
.fullscreen-page {
  position: fixed;
  inset: 0;
  background: #f3f6fc;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
  padding: 12px 14px 10px;
  box-shadow: 0 1px 8px rgba(0, 20, 40, 0.06);
  flex-shrink: 0;
  width: 100%;
  max-width: 520px;
  box-sizing: border-box;
}

.header-row-1 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.tabs {
  display: flex;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.tab {
  background: none;
  border: none;
  padding: 6px 14px;
  font-size: 1.05rem;
  font-weight: 700;
  color: #9fb3c8;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.15s;
}

.tab:hover {
  color: #0f3b5e;
  background: #f5f8fc;
}

.tab.active {
  color: #0b2b4a;
  background: #eef5fc;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-refresh {
  background: #eef5fc;
  color: #0f3b5e;
  border: none;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-refresh:disabled { opacity: 0.5; }

.btn-close {
  background: none;
  border: none;
  font-size: 1.6rem;
  color: #6c7e92;
  cursor: pointer;
  padding: 0 6px;
}

.page-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 10px 10px 20px;
  width: 100%;
  max-width: 520px;
  box-sizing: border-box;
}

.empty-tip {
  text-align: center;
  color: #9fb3c8;
  font-size: 0.85rem;
  padding: 40px 0;
}

.push-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.push-card {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 1px 4px rgba(0, 20, 40, 0.04);
  cursor: pointer;
  transition: box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.push-card:hover {
  box-shadow: 0 2px 12px rgba(0, 20, 40, 0.1);
}

.push-remark {
  font-weight: 700;
  color: #0b2b4a;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.push-time {
  font-size: 0.68rem;
  color: #9fb3c8;
  font-family: ui-monospace, monospace;
}

.push-matches {
  display: grid;
  grid-template-columns: 1fr 1fr;    /* ★ 两列 */
  gap: 4px 8px;                       /* ★ 行/列间距 */
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px dashed #eef5fc;
}

.push-match-line {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.74rem;                 /* ★ 稍小 */
  min-width: 0;
  overflow: hidden;
}

.goal-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #b8860b;
  color: white;
  padding: 0 5px;
  border-radius: 5px;
  font-weight: 800;
  font-size: 0.65rem;
  height: 14px;
  font-family: ui-monospace, monospace;
}

.match-name {
  color: #5a7188;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 详情弹窗 */
.detail-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 20, 30, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 16px;
}

.detail-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 8px;
  border-bottom: 1px solid #eef5fc;
  flex-shrink: 0;
}

.detail-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #0b2b4a;
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px 14px 14px;
}
</style>
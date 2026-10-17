<template>
  <div class="fullscreen-page">
    <div class="page-header">
      <div class="header-row-1">
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
          <button class="btn-close" @click="$emit('close')">&times;</button>
        </div>
      </div>
    </div>

    <div class="page-body">
      <!-- 已推标签 -->
      <template v-if="currentTab === 'pushed'">
        <div v-if="loading" class="empty-tip">加载中...</div>
        <div v-else-if="!pushedList.length" class="empty-tip">-</div>

        <div v-else class="push-list">
          <div
            v-for="p in pushedList"
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

      <!-- 已捡标签 -->
      <template v-else>
        <div v-if="loading" class="empty-tip">加载中...</div>
        <div v-else-if="!pickedList.length" class="empty-tip">-</div>

        <div v-else class="push-list">
          <div
            v-for="p in pickedList"
            :key="p.id"
            class="push-card"
            @click="openDetail(p)"
          >
            <div class="push-remark-row">
              <div class="push-remark">{{ p.remark || '（无备注）' }}</div>
              <div class="push-badge">
                <template v-if="p.loseAll">
                  <span class="badge-loss">-{{ p.result?.result?.M ?? 0 }}</span>
                </template>
                <template v-else-if="p.pickedComboIndex !== null && p.pickedComboIndex !== undefined">
                  <span class="badge-profit">
                    +{{ getComboProfit(p, p.pickedComboIndex) }}
                  </span>
                </template>
              </div>
            </div>
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
    </div>

    <!-- 详情弹窗 -->
    <div v-if="detail" class="detail-mask" @click.self="closeDetail">
      <div class="detail-content">
        <div class="detail-header">
          <div class="detail-remark-wrap">
            <!-- 编辑模式：输入框 -->
            <template v-if="editingRemark">
              <input
                ref="remarkInputRef"
                v-model="remarkDraft"
                class="remark-input"
                maxlength="10"
                @keydown.enter="saveRemark"
                @keydown.esc="cancelEditRemark"
                @blur="saveRemark"
              />
            </template>
            <!-- 展示模式：备注文本 + 编辑符号 -->
            <template v-else>
              <span class="remark-text" :class="{ empty: !detail.remark }">
                {{ detail.remark || '（无备注）' }}
              </span>
              <button class="btn-edit-remark" @click="startEditRemark" title="编辑备注">
                ✎
              </button>
            </template>
          </div>
          <button class="close-btn" @click="closeDetail">&times;</button>
        </div>
        <div class="detail-body">
          <!-- 已捡方案：组合列表，支持点击 -->
          <div
            v-if="detail.status === 'picked'"
            class="combo-list"
          >
            <div
              v-for="(item, idx) in detail.result.details"
              :key="idx"
              class="combo-card"
              :class="{
                'combo-active': pickMode && pickedIndex === idx,
                'combo-dim': loseMode || (pickMode && pickedIndex !== null && pickedIndex !== idx)
              }"
              @click="handleComboClick(idx)"
            >
              <div class="combo-head">
                <span class="combo-bet">{{ item.bet }}</span>
                <span class="combo-profit" :class="getProfitClass(item.adjustedProfit)">
                  {{ item.adjustedProfit >= 0 ? '+' : '' }}{{ fmt(item.adjustedProfit, 2) }}
                </span>
              </div>
              <div class="combo-targets">
                <div
                  v-for="(c, i) in item.combo"
                  :key="i"
                  class="combo-line"
                >
                  <span v-if="c.poolType === 'hhad'" class="goal-badge" :class="goalClass(c.goalLine)">
                    {{ formatGoalLine(c.goalLine) }}
                  </span>
                  <span class="combo-match">{{ c.matchName }}</span>
                  <span class="combo-result" :class="labelClass(c.label)">{{ c.label }}</span>
                  <span class="combo-odds">{{ fmt(c.value, 2) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 已推方案：用 ResultPanel 展示 -->
          <ResultPanel
            v-else
            :data="detail.result"
            :parlay-items="detail.parlayItems || []"
            hide-push
            hide-copy
          />
        </div>

        <div class="detail-footer">
          <!-- 已推方案：应用按钮 -->
          <template v-if="detail.status === 'pushed'">
            <div v-if="showApplyMenu" class="apply-menu">
              <button class="apply-menu-item" @click="moveToPicked">已捡</button>
            </div>
            <button
              class="btn-apply"
              :class="{ expired: isExpired(detail) }"
              :disabled="false"
              @click.stop="toggleApplyMenu"
            >
              {{ isExpired(detail) ? '已过期' : '应用并重新计算' }}
            </button>
          </template>

          <!-- 已捡方案：3 个按钮 / 重新编辑 -->
          <template v-else>
            <template v-if="!editMode && !pickMode && !loseMode">
              <button class="btn-pick" @click="startPick">捡到</button>
              <button class="btn-lose" @click="startLose">iim毛了</button>
              <button class="btn-delete" @click="confirmDelete">删除</button>
            </template>
            <template v-else>
              <button class="btn-reset" @click="resetEdit">编辑</button>
            </template>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import ResultPanel from './ResultPanel.vue'

const props = defineProps({
  matchesData: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'apply'])

/* ========== 列表数据 ========== */
const list = ref([])
const loading = ref(false)

const pushedList = computed(() =>
  list.value.filter(p => p.status === 'pushed' && !p.deleted)
)
const pickedList = computed(() =>
  list.value.filter(p => p.status === 'picked' && !p.deleted)
)

/* ========== 标签页 ========== */
const currentTab = ref('pushed')

/* ========== 详情弹窗 ========== */
const detail = ref(null)

/* ========== 状态 ========== */
const showApplyMenu = ref(false)     // 已推：应用下拉菜单
const editMode = ref(false)           // 已捡：是否在编辑模式
const pickMode = ref(false)           // 已捡：捡到模式
const loseMode = ref(false)           // 已捡：iim毛了模式
const pickedIndex = ref(null)         // 已捡：当前选中的组合

/* ========== 备注编辑 ========== */
const editingRemark = ref(false)
const remarkDraft = ref('')
const remarkInputRef = ref(null)

function startEditRemark() {
  if (!detail.value) return
  remarkDraft.value = detail.value.remark || ''
  editingRemark.value = true
  nextTick(() => {
    remarkInputRef.value?.focus()
    remarkInputRef.value?.select()
  })
}

async function saveRemark() {
  if (!editingRemark.value) return
  editingRemark.value = false
  if (!detail.value) return

  const newRemark = remarkDraft.value.trim().slice(0, 10)
  if (newRemark === detail.value.remark) return

  await updatePush(detail.value.id, { remark: newRemark })
  detail.value.remark = newRemark   // 同步本地 detail
}

function cancelEditRemark() {
  editingRemark.value = false
}

/* ========== 加载数据 ========== */
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
      list.value = mock.map(p => ({
        status: 'pushed',
        pickedComboIndex: null,
        loseAll: false,
        deleted: false,
        ...p
      }))
    } else {
      list.value = []
    }
  } finally {
    loading.value = false
  }
}

/* ========== 更新方案（调用 PUT） ========== */
async function updatePush(id, changes) {
  try {
    const res = await fetch(`/api/pushes?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes)
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (!data.ok) throw new Error(data.error || '更新失败')

    // 更新本地列表
    const idx = list.value.findIndex(p => p.id === id)
    if (idx !== -1) {
      list.value[idx] = { ...list.value[idx], ...changes }
    }
  } catch (e) {
    if (import.meta.env.DEV) {
      // 本地 mock
      const mock = JSON.parse(localStorage.getItem('__pushes_mock') || '[]')
      const idx = mock.findIndex(p => p.id === id)
      if (idx !== -1) {
        mock[idx] = { ...mock[idx], ...changes }
        localStorage.setItem('__pushes_mock', JSON.stringify(mock))
      }
      const idx2 = list.value.findIndex(p => p.id === id)
      if (idx2 !== -1) {
        list.value[idx2] = { ...list.value[idx2], ...changes }
      }
    } else {
      alert('更新失败：' + e.message)
      throw e
    }
  }
}

/* ========== 已推：应用下拉菜单 ========== */
function toggleApplyMenu() {
  showApplyMenu.value = !showApplyMenu.value
}

async function moveToPicked() {
  if (!detail.value) return
  const id = detail.value.id
  await updatePush(id, { status: 'picked' })
  showApplyMenu.value = false
  detail.value = null
  currentTab.value = 'picked'
}

/* ========== 已捡：操作 ========== */
function startPick() {
  pickMode.value = true
  loseMode.value = false
  pickedIndex.value = null
}

async function startLose() {
  if (!detail.value) return
  loseMode.value = true
  pickMode.value = false
  pickedIndex.value = null
  // ★ 持久化到 KV
  await updatePush(detail.value.id, { loseAll: true })
}

async function handleComboClick(idx) {
  if (!pickMode.value) return
  if (pickedIndex.value !== null) return   // 已选，不能再点

  pickedIndex.value = idx

  // 保存到 KV
  await updatePush(detail.value.id, { pickedComboIndex: idx })
}

async function resetEdit() {
  pickMode.value = false
  loseMode.value = false
  pickedIndex.value = null
  if (detail.value) {
    await updatePush(detail.value.id, {
      pickedComboIndex: null,
      loseAll: false
    })
  }
}

/* ========== 删除 ========== */
async function confirmDelete() {
  if (!detail.value) return
  if (!confirm('确认删除？')) return

  await updatePush(detail.value.id, { deleted: true })
  detail.value = null
}

/* ========== 详情打开/关闭 ========== */
function openDetail(p) {
  detail.value = p
  editMode.value = false
  showApplyMenu.value = false
  editingRemark.value = false   // ★ 重置

  if (p.status === 'picked') {
    // 已捡：从已保存状态恢复
    if (p.loseAll) {
      // 之前点过 iim毛了
      loseMode.value = true
      pickMode.value = false
      pickedIndex.value = null
    } else if (p.pickedComboIndex !== null && p.pickedComboIndex !== undefined) {
      // 之前点过捡到 + 选了组合
      pickMode.value = true
      loseMode.value = false
      pickedIndex.value = p.pickedComboIndex
    } else {
      // 未操作
      pickMode.value = false
      loseMode.value = false
      pickedIndex.value = null
    }
  } else {
    // 已推：默认状态
    pickMode.value = false
    loseMode.value = false
    pickedIndex.value = null
  }
}

function closeDetail() {
  detail.value = null
  editMode.value = false
  pickMode.value = false
  loseMode.value = false
  pickedIndex.value = null
  showApplyMenu.value = false
  editingRemark.value = false
  remarkDraft.value = ''
}

/* ========== iim毛了确认 ========== */
async function startLoseApply() {
  if (!detail.value) return
  await updatePush(detail.value.id, { loseAll: true })
}

/* ========== 工具 ========== */
function isExpired(p) {
  if (!props.matchesData?.length) return true
  if (p.comboRows?.length) {
    for (const r of p.comboRows) {
      if (!props.matchesData.find(m => m.id === r.matchId)) return true
    }
  } else {
    const combo = p.result?.details?.[0]?.combo || []
    for (const c of combo) {
      if (!props.matchesData.find(
        m => m.matchNo === c.matchNo && m.poolType === c.poolType
      )) return true
    }
  }
  const idSet = new Set(props.matchesData.map(m => m.id))
  for (const it of (p.parlayItems || [])) {
    if (!idSet.has(it.matchId)) return true
  }
  return false
}

function getAllMatches(p) {
  if (!p.result?.details?.length) return []
  const firstDetail = p.result.details[0]
  const combo = firstDetail.combo || []
  const parlay = (p.parlayItems || []).map(item => ({
    matchNo: item.matchNo,
    matchName: item.matchName,
    poolType: item.poolType,
    goalLine: item.goalLine,
    label: item.selectedOdds?.label
  }))
  return [...combo, ...parlay]
}

function getComboProfit(p, idx) {
  const details = p.result?.details || []
  if (idx < 0 || idx >= details.length) return 0
  return (details[idx].adjustedProfit || 0).toFixed(2)
}

function getProfitClass(v) {
  if (v > 0) return 'profit-pos'
  if (v < 0) return 'profit-neg'
  return ''
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

function goalClass(gl) {
  const n = Number(gl)
  if (Number.isNaN(n)) return ''
  if (n > 0) return 'goal-pos'
  if (n < 0) return 'goal-neg'
  return ''
}

function fmt(v, digits = 4) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  return Number(v).toFixed(digits)
}

onMounted(load)
</script>

<style scoped>
/* 原有样式 + 新增 */
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

.push-remark-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.push-remark {
  font-weight: 700;
  color: #0b2b4a;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.push-badge {
  flex-shrink: 0;
}

.badge-profit {
  font-family: ui-monospace, monospace;
  font-weight: 800;
  font-size: 0.9rem;
  color: #2e8b57;
}

.badge-loss {
  font-family: ui-monospace, monospace;
  font-weight: 800;
  font-size: 0.9rem;
  color: #c0392b;
}

.push-time {
  font-size: 0.68rem;
  color: #9fb3c8;
  font-family: ui-monospace, monospace;
}

.push-matches {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 8px;
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px dashed #eef5fc;
}

.push-match-line {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.74rem;
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
  gap: 8px;
}

.detail-remark-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.remark-text {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0b2b4a;
  max-width: 10em;          /* ★ 限制 10 个字宽度 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remark-text.empty {
  color: #9fb3c8;
  font-weight: 400;
}

.remark-input {
  flex: 1;
  max-width: 10em;
  border: 1px solid #6f9bc1;
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #0b2b4a;
  outline: none;
  background: white;
  font-family: inherit;
}

.btn-edit-remark {
  background: none;
  border: none;
  color: #6f9bc1;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  flex-shrink: 0;
}

.btn-edit-remark:hover {
  color: #0f3b5e;
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px 14px 14px;
}

/* 组合列表（已捡） */
.combo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.combo-card {
  background: #f9fcff;
  border-radius: 12px;
  padding: 10px 12px;
  border-left: 3px solid #0f3b5e;
  transition: all 0.2s;
  cursor: default;
}

.combo-card.combo-active {
  border-left-color: #2e8b57;
  background: #f2fbf5;
  box-shadow: 0 2px 8px rgba(46, 139, 87, 0.15);
}

.combo-card.combo-dim {
  opacity: 0.35;
}

.combo-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: 6px;
  border-bottom: 1px dashed #e2eef9;
  margin-bottom: 6px;
}

.combo-bet {
  font-family: ui-monospace, monospace;
  font-size: 1.1rem;
  font-weight: 800;
  color: #2e8b57;
  background: #eafaf0;
  padding: 1px 10px;
  border-radius: 10px;
}

.combo-profit {
  font-family: ui-monospace, monospace;
  font-weight: 800;
}

.combo-targets {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.combo-line {
  display: flex;
  align-items: baseline;
  gap: 5px;
  font-size: 0.82rem;
}

.goal-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 15px;
  border-radius: 7px;
  font-size: 0.62rem;
  font-weight: 800;
  font-family: ui-monospace, monospace;
  color: white;
  flex-shrink: 0;
  padding: 0 4px;
}
.goal-badge.goal-pos { background: #e74c3c; }
.goal-badge.goal-neg { background: #27ae60; }

.combo-match {
  color: #5a7188;
  flex: 1;
  min-width: 0;
}

.combo-result {
  font-size: 0.95rem;
  font-weight: 800;
}
.combo-result.win { color: #2e8b57; }
.combo-result.draw { color: #b8860b; }
.combo-result.lose { color: #c0392b; }

.combo-odds {
  color: #7e94aa;
  font-size: 0.75rem;
  font-family: ui-monospace, monospace;
}

.profit-pos { color: #2e8b57; }
.profit-neg { color: #c0392b; }

/* 底部按钮 */
.detail-footer {
  padding: 10px 16px 14px;
  border-top: 1px solid #eef5fc;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  position: relative;
  flex-wrap: wrap;
}

.btn-apply {
  background: #0f3b5e;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 28px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
}
.btn-apply:hover:not(:disabled) {
  background: #1e537d;
}

/* ★ 已过期：淡化但仍可点击 */
.btn-apply.expired {
  background: #b6c6d6;
  /* 不设 disabled，仍可点击 */
}

/* 下拉菜单 */
.apply-menu {
  position: absolute;
  bottom: 100%;
  right: 16px;
  margin-bottom: 4px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 4px;
  z-index: 10;
}

.apply-menu-item {
  display: block;
  width: 100%;
  background: none;
  border: none;
  padding: 8px 20px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #0f3b5e;
  cursor: pointer;
  text-align: left;
  border-radius: 6px;
}
.apply-menu-item:hover {
  background: #eef5fc;
}

/* 已捡按钮 */
.btn-pick {
  background: #2e8b57;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
}
.btn-pick:hover { background: #256e46; }

.btn-lose {
  background: #c0392b;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
}
.btn-lose:hover { background: #a03024; }

.btn-delete {
  background: #fdecea;
  color: #c0392b;
  border: 1px solid #f5b7b1;
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
}
.btn-delete:hover { background: #fbd6d1; }

.btn-reset {
  background: #eef5fc;
  color: #0f3b5e;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
}
.btn-reset:hover { background: #dae6f2; }
</style>
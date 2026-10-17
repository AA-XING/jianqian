<template>
  <div class="result-panel" v-if="data">
    <!-- 理论收益率（累乘） -->
    <div class="stat-row">
      <div class="stat-label">理论收益率</div>
      <div class="stat-value green">{{ fmtPercent(adjustedExpect) }}%</div>
    </div>

    <!-- 总额 -->
    <div class="stat-row">
      <div class="stat-label">总额</div>
      <div class="stat-value">{{ data.result ? data.result.M : '—' }}</div>
    </div>

    <template v-if="data.result && data.result.D && data.result.D.length">
      <div class="stat-row">
        <div class="stat-label">收益范围</div>
        <div class="stat-value">
          <span class="min">{{ fmt(adjustedProfitMin, 2) }}</span>
          <span class="sep"> ~ </span>
          <span class="max">{{ fmt(adjustedProfitMax, 2) }}</span>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat-label">极差</div>
        <div class="stat-value small">
          {{ fmt(adjustedProfitRange, 2) }}
          <span class="gap-percent">({{ fmtPercentOfTotal }}%)</span>
        </div>
      </div>
    </template>

    <!-- 报错 -->
    <div v-if="data.errorMsg" class="error-box">
      ⚠️ {{ data.errorMsg }}
    </div>

    <!-- 卡片列表 -->
    <div v-if="data.result" class="card-list">
      <div
        v-for="item in data.details"
        :key="item.index"
        class="bet-card"
      >
        <div class="card-head">
          <span class="card-bet">{{ item.bet }}</span>
        </div>

        <div class="card-targets">
          <!-- 计算用的场次 -->
          <div
            v-for="(c, i) in item.combo"
            :key="i"
            class="target-line"
          >
            <span v-if="c.poolType === 'hhad'" class="goal-badge" :class="goalClass(c.goalLine)">
              {{ formatGoalLine(c.goalLine) }}
            </span>
            <span class="target-match">{{ c.matchName }}</span>
            <span class="target-result" :class="labelClass(c.label)">{{ c.label }}</span>
            <span class="target-odds">{{ fmt(c.value, 2) }}</span>
          </div>

          <!-- ★ 串买项：不带任何标签，和普通项一致 -->
          <div
            v-for="(p, pi) in parlayItems"
            :key="'p' + pi"
            class="target-line"
          >
            <span v-if="p.poolType === 'hhad'" class="goal-badge" :class="goalClass(p.goalLine)">
              {{ formatGoalLine(p.goalLine) }}
            </span>
            <span class="target-match">{{ p.matchName }}</span>
            <span class="target-result" :class="labelClass(p.selectedOdds.label)">
              {{ p.selectedOdds.label }}
            </span>
            <span class="target-odds">{{ fmt(p.selectedOdds.value, 2) }}</span>
          </div>
        </div>

        <div class="card-foot">
          <span class="card-profit" :class="profitClass(item.adjustedProfit)">
            {{ item.adjustedProfit >= 0 ? '+' : '' }}{{ fmt(item.adjustedProfit, 2) }}
          </span>
          <span class="foot-rate">
            回报率
            <span class="rate" :class="profitClass(item.adjustedRate)">
              {{ (item.adjustedRate * 100).toFixed(2) }}%
            </span>
          </span>
        </div>
      </div>
    </div>

    <!-- 复制按钮 -->
    <div v-if="data.result && data.details.length" class="action-bar">
      <button v-if="!hidePush" class="btn-push" @click="openPushModal">推单</button>
      <button class="btn-copy" :class="{ copied }" @click="copyBetsAndTargets">
        {{ copied ? '✅ 已复制' : '📋 复制' }}
      </button>
    </div>

    <PushSaveModal
      v-if="showPushModal"
      :result="data"
      :copy-text="buildCopyText()"
      :parlay-items="parlayItems"
      @close="showPushModal = false"
      @saved="onPushSaved"
      @open-pushes="$emit('open-pushes')"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

import PushSaveModal from './PushSaveModal.vue'

const showPushModal = ref(false)

function openPushModal() {
  showPushModal.value = true
}

function onPushSaved() {
  // 可加提示
}

const props = defineProps({
  data: { type: Object, default: null },
  parlayItems: { type: Array, default: () => [] },
  hidePush: { type: Boolean, default: false }
})

defineEmits(['open-pushes'])   // ★ 新增

/* 复制 */
const copied = ref(false)
let copyTimer = null

// 串买累乘系数
const parlayMultiplier = computed(() => {
  let m = 1
  for (const p of props.parlayItems) {
    if (p.selectedOdds?.value) m *= p.selectedOdds.value
  }
  return m
})

/**
 * 复制文本格式：
 *   投注额 场次编号 (让球) 结果 + 场次编号 (让球) 结果 + ...
 *
 * 示例：
 *   40 周四001 胜 + 周四005 (让-1) 负 + 周四008 胜
 */
function buildCopyText() {
  if (!props.data?.details?.length) return ''

  return props.data.details
    .map(item => {
      const parts = []

      // 计算用的场次
      for (const c of (item.combo || [])) {
        parts.push(formatComboText(c))
      }

      // ★ 串买项：只加场次编号 + 结果，不写「串」
      for (const p of props.parlayItems) {
        const no = p.matchNo || ''
        const label = p.selectedOdds?.label || ''
        const goalPart = p.poolType === 'hhad' ? `(${formatGoalLine(p.goalLine)})` : ''
        parts.push(`${no} ${goalPart}${label}`.replace(/\s+/g, ' ').trim())
      }

      return `${item.bet} ${parts.join(' + ')}`
    })
    .join('\n')
}

/**
 * 格式化单场比赛：场次编号 (让球) 结果
 */
function formatComboText(c) {
  const no = c.matchNo || ''
  const goalPart = c.poolType === 'hhad' ? `(${formatGoalLine(c.goalLine)})` : ''
  return `${no} ${goalPart}${c.label}`.replace(/\s+/g, ' ').trim()
}

async function copyBetsAndTargets() {
  const text = buildCopyText()
  if (!text) return
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 1500)
  } catch (e) {
    alert('复制失败：' + e.message)
  }
}

/* 工具 */
function fmt(v, digits = 4) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  return Number(v).toFixed(digits)
}
function fmtPercent(v, digits = 2) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  return ((Number(v) - 1) * 100).toFixed(digits)
}
function labelClass(label) {
  if (label === '胜') return 'win'
  if (label === '平') return 'draw'
  return 'lose'
}
function profitClass(v) {
  if (v > 0) return 'profit-pos'
  if (v < 0) return 'profit-neg'
  return ''
}
function formatGoalLine(gl) {
  const n = Number(gl)
  if (Number.isNaN(n)) return '—'
  return n >= 0 ? `+${n}` : `${n}`
}
function goalClass(gl) {
  const n = Number(gl)
  if (Number.isNaN(n)) return ''
  if (n > 0) return 'goal-pos'
  if (n < 0) return 'goal-neg'
  return ''
}

/* 累乘后调整 */
const adjustedExpect = computed(() => {
  if (!props.data?.expect) return null
  return props.data.expect * parlayMultiplier.value
})

const adjustedProfitMin = computed(() => {
  const D = props.data?.result?.D
  if (!D || !D.length) return null
  return Math.min(...D) * parlayMultiplier.value
})

const adjustedProfitMax = computed(() => {
  const D = props.data?.result?.D
  if (!D || !D.length) return null
  return Math.max(...D) * parlayMultiplier.value
})

const adjustedProfitRange = computed(() => {
  if (adjustedProfitMin.value === null || adjustedProfitMax.value === null) return null
  return adjustedProfitMax.value - adjustedProfitMin.value
})

const fmtPercentOfTotal = computed(() => {
  if (adjustedProfitRange.value === null) return '—'
  const M = props.data?.result?.M
  if (!M) return '—'
  return ((adjustedProfitRange.value / M) * 100).toFixed(2)
})

// 累乘串买系数到每条详情
const adjustedDetails = computed(() => {
  if (!props.data?.details) return []
  const mult = parlayMultiplier.value
  return props.data.details.map(item => {
    const adjustedProfit = item.profit * mult
    const M = props.data?.result?.M || 1
    return {
      ...item,
      adjustedProfit,
      adjustedRate: adjustedProfit / M
    }
  })
})

const data = computed(() => {
  if (!props.data) return null
  return {
    ...props.data,
    details: adjustedDetails.value
  }
})

</script>

<style scoped>
.result-panel {
  margin-top: 14px;
  padding: 14px 0 0;
  border-top: 1px solid #eef5fc;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 6px 0;
}
.stat-label {
  font-size: 0.85rem;
  color: #5a7188;
  font-weight: 600;
}
.stat-value {
  font-family: ui-monospace, monospace;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0b2b4a;
}
.stat-value.green { color: #2e8b57; }
.stat-value.small { font-size: 0.9rem; color: #5a7188; font-weight: 600; }

.min { color: #2e8b57; }
.max { color: #c0392b; }
.sep { color: #9fb3c8; padding: 0 2px; }
.gap-percent { font-size: 0.8rem; color: #9fb3c8; margin-left: 4px; }

.error-box {
  background: #fdecea;
  border-left: 3px solid #e74c3c;
  color: #c0392b;
  padding: 10px 12px;
  border-radius: 8px;
  margin: 10px 0;
  font-size: 0.82rem;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.bet-card {
  background: #f9fcff;
  border-radius: 12px;
  padding: 10px 12px;
  border-left: 3px solid #0f3b5e;
}

.card-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 1px dashed #e2eef9;
  margin-bottom: 6px;
}

.card-bet {
  font-family: ui-monospace, monospace;
  font-size: 1.15rem;
  font-weight: 800;
  color: #2e8b57;
  background: #eafaf0;
  padding: 1px 10px;
  border-radius: 10px;
}

.card-targets {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.target-line {
  display: flex;
  align-items: baseline;
  gap: 5px;
  font-size: 0.82rem;
  flex-wrap: wrap;
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

.target-match {
  color: #5a7188;
  flex: 1;
  min-width: 0;
}

.target-result {
  font-size: 0.95rem;
  font-weight: 800;
}
.target-result.win { color: #2e8b57; }
.target-result.draw { color: #b8860b; }
.target-result.lose { color: #c0392b; }

.target-odds {
  color: #7e94aa;
  font-size: 0.75rem;
  font-family: ui-monospace, monospace;
}

.card-foot {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed #e2eef9;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.card-profit {
  font-family: ui-monospace, monospace;
  font-size: 1rem;
  font-weight: 800;
}

.foot-rate {
  font-size: 0.78rem;
  color: #5a7188;
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
}

.rate {
  font-family: ui-monospace, monospace;
  font-weight: 700;
  font-size: 0.88rem;
}

.profit-pos { color: #2e8b57; }
.profit-neg { color: #c0392b; }

.action-bar {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.btn-push {
  flex: 0 0 auto;
  min-width: 64px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 11px 16px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
}
.btn-push:hover {
  background: #c0392b;
}

.btn-copy {
  flex: 1;
  background: #eef5fc;
  color: #0f3b5e;
  border: none;
  border-radius: 10px;
  padding: 11px 20px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-copy.copied {
  background: #d4f0e0;
  color: #2e8b57;
}

</style>
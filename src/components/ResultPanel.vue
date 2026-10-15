<template>
  <div class="result-panel" v-if="data">
    <!-- 理论收益率 -->
    <div class="stat-row">
      <div class="stat-label">理论收益率</div>
      <div class="stat-value green">{{ fmtPercent(data.expect) }}%</div>
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
          <span class="min">{{ fmt(profitMin, 2) }}</span>
          <span class="sep"> ~ </span>
          <span class="max">{{ fmt(profitMax, 2) }}</span>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat-label">极差</div>
        <div class="stat-value small">
          {{ fmt(profitRange, 2) }}
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
        <!-- 顶部：投注额 -->
        <div class="card-head">
          <span class="card-bet">{{ item.bet }}</span>
        </div>

        <!-- 目标 -->
        <div class="card-targets">
          <div
            v-for="(c, i) in item.combo"
            :key="i"
            class="target-line"
          >
            <!-- ★ 让球比赛：显示带符号数字（红/绿底） -->
            <span
              v-if="c.poolType === 'hhad'"
              class="goal-tag"
              :class="goalClass(c.goalLine)"
            >
              {{ formatGoalLine(c.goalLine) }}
            </span>
            <span class="target-match">{{ c.matchName }}</span>
            <span class="target-result" :class="labelClass(c.label)">{{ c.label }}</span>
            <span class="target-odds">{{ fmt(c.value, 2) }}</span>
          </div>
        </div>

        <!-- 底部：左收益额，右回报率 -->
        <div class="card-foot">
          <span class="card-profit" :class="profitClass(item.profit)">
            {{ item.profit >= 0 ? '+' : '' }}{{ fmt(item.profit, 2) }}
          </span>
          <span class="foot-rate">
            回报率
            <span class="rate" :class="profitClass(item.rate)">
              {{ (item.rate * 100).toFixed(2) }}%
            </span>
          </span>
        </div>
      </div>
    </div>

    <!-- 复制按钮 -->
    <div v-if="data.result && data.details.length" class="copy-bar">
      <button class="btn-copy" :class="{ copied }" @click="copyBetsAndTargets">
        {{ copied ? '✅ 已复制' : '📋 复制' }}
      </button>
    </div>

    <!-- 权重详情 -->
    <details class="detail-box" v-if="data.result">
      <summary>optimize_weights 完整输出</summary>
      <pre>{{ prettyResult }}</pre>
    </details>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  data: { type: Object, default: null }
})

/* 复制 */
const copied = ref(false)
let copyTimer = null

function buildCopyText() {
  if (!props.data?.details?.length) return ''
  return props.data.details
    .map(item => {
      const target = (item.combo || [])
        .map(c => {
          const prefix = c.poolType === 'hhad' ? `让${formatGoalLine(c.goalLine)} ` : ''
          return `${prefix}${c.matchName} ${c.label} ${fmt(c.value, 2)}`
        })
        .join(' + ')
      return `${item.bet}\t${target}`
    })
    .join('\n')
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

/* ★ 让球数格式化：正数带 +，负数带 - */
function formatGoalLine(gl) {
  const n = Number(gl)
  if (Number.isNaN(n)) return '—'
  return n >= 0 ? `+${n}` : `${n}`
}

/* ★ 让球数颜色类 */
function goalClass(gl) {
  const n = Number(gl)
  if (Number.isNaN(n)) return ''
  if (n > 0) return 'goal-pos'
  if (n < 0) return 'goal-neg'
  return ''
}

const profitMin = computed(() => {
  const D = props.data?.result?.D
  if (!D || !D.length) return null
  return Math.min(...D)
})
const profitMax = computed(() => {
  const D = props.data?.result?.D
  if (!D || !D.length) return null
  return Math.max(...D)
})
const profitRange = computed(() => {
  if (profitMin.value === null || profitMax.value === null) return null
  return profitMax.value - profitMin.value
})
const fmtPercentOfTotal = computed(() => {
  if (profitRange.value === null) return '—'
  const M = props.data?.result?.M
  if (!M) return '—'
  return ((profitRange.value / M) * 100).toFixed(2)
})

const prettyResult = computed(() => {
  if (!props.data || !props.data.result) return ''
  const r = props.data.result
  try {
    return JSON.stringify({
      expect: +fmt(props.data.expect, 6),
      a: props.data.a.map(v => +fmt(v, 4)),
      texts: props.data.texts,
      new_weights: r.newWeights,
      M: r.M,
      D: r.D.map(v => +fmt(v, 2)),
      S: r.S.map(v => +fmt(v, 4)),
      cv: +fmt(r.cv, 6),
      rangeRatio: +fmt(r.rangeRatio, 6),
      bestT: r.bestT
    }, null, 2)
  } catch (e) {
    return '数据不完整'
  }
})
</script>

<style scoped>
.result-panel {
  margin-top: 14px;
  padding: 14px 0 0;
  border-top: 1px solid #eef5fc;
}

/* 状态行 */
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

/* 卡片列表 */
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

/* ★ 让球标签：带符号数字，正红负绿 */
.goal-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 900;
  font-family: ui-monospace, monospace;
  color: #ffffff;
  padding: 1px 6px;
  border-radius: 5px;
  line-height: 1.4;
  flex-shrink: 0;
  letter-spacing: 0.2px;
  text-shadow: 0.3px 0 0 currentColor, -0.3px 0 0 currentColor;
}

.goal-tag.goal-pos {
  background: #e74c3c;
}

.goal-tag.goal-neg {
  background: #27ae60;
}

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

/* 底部 */
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

/* 复制按钮 */
.copy-bar {
  display: flex;
  justify-content: center;
  margin-top: 14px;
}

.btn-copy {
  background: #eef5fc;
  color: #0f3b5e;
  border: none;
  border-radius: 10px;
  padding: 11px 20px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
}

.btn-copy.copied {
  background: #d4f0e0;
  color: #2e8b57;
}

/* 详情 */
.detail-box {
  margin-top: 12px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e2eef9;
  padding: 8px 10px;
}
.detail-box summary {
  cursor: pointer;
  font-weight: 600;
  color: #1e3f5c;
  font-size: 0.82rem;
  padding: 4px 0;
}
.detail-box pre {
  background: #0f3b5e;
  color: #d6e7f7;
  padding: 10px;
  border-radius: 8px;
  font-size: 0.7rem;
  overflow-x: auto;
  margin: 8px 0 4px;
  line-height: 1.4;
}
</style>
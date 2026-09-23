<template>
  <div class="result-panel" v-if="data">
    <!-- 理论收益率 -->
    <div class="expect-row">
      <div class="expect-label">理论收益率</div>
      <div class="expect-value">
        {{ fmtPercent(data.expect) }}%
      </div>
    </div>

    <!-- 总额 + 收益范围 -->
    <div class="total-bet-row">
      <div class="total-bet-label">总额</div>
      <div class="total-bet-value">{{ data.result ? data.result.M : '—' }}</div>

      <template v-if="data.result && data.result.D && data.result.D.length">
        <div class="range-block">
          <div class="range-label">收益范围</div>
          <div class="range-value">
            <span class="profit-min">{{ fmt(profitMin, 2) }}</span>
            <span class="range-sep"> - </span>
            <span class="profit-max">{{ fmt(profitMax, 2) }}</span>
          </div>
          <div class="range-gap">
            <span class="gap-label">极差</span>
            <span class="gap-value">{{ fmt(profitRange, 2) }}</span>
            <span class="gap-percent">({{ fmtPercentOfTotal }}%)</span>
          </div>
        </div>
      </template>
    </div>

    <!-- 报错 -->
    <div v-if="data.errorMsg" class="error-box">
      ⚠️ 计算失败：{{ data.errorMsg }}
    </div>

    <!-- 明细表 -->
    <div v-if="data.result" class="result-table-wrap">
      <table class="result-table">
        <thead>
          <tr>
            <th>#</th>
            <th>投注额</th>
            <th>目标</th>
            <th>收益</th>
            <th>回报率</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in data.details" :key="item.index">
            <td class="col-idx">{{ item.index + 1 }}</td>

            <td class="col-num">
              <span class="bet-amount">{{ item.bet }}</span>
            </td>

            <td class="col-combo">
              <div
                v-for="(c, i) in item.combo"
                :key="i"
                class="combo-line"
              >
                <span v-if="c.poolType === 'hhad'" class="rang-tag">让</span>
                <span class="combo-match">{{ c.matchName }}</span>
                <span class="combo-sep">·</span>
                <span class="combo-result" :class="labelClass(c.label)">
                  {{ c.label }}
                </span>
                <span class="combo-odds">{{ fmt(c.value, 2) }}</span>
              </div>
            </td>

            <td class="col-num" :class="profitClass(item.profit)">
              {{ item.profit >= 0 ? '+' : '' }}{{ fmt(item.profit, 2) }}
            </td>

            <td class="col-num" :class="profitClass(item.rate)">
              {{ (item.rate * 100).toFixed(2) }}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ★ 复制按钮 -->
    <div v-if="data.result && data.details.length" class="copy-bar">
      <button
        class="btn-copy"
        :class="{ copied }"
        @click="copyBetsAndTargets"
      >
        <span class="copy-icon">{{ copied ? '✅' : '📋' }}</span>
        {{ copied ? '已复制' : '复制' }}
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

/* ========== 复制功能 ========== */
const copied = ref(false)
let copyTimer = null

/** 把 details 拼成可复制的文本 */
function buildCopyText() {
  if (!props.data?.details?.length) return ''
  return props.data.details
    .map(item => {
      const target = (item.combo || [])
        .map(c => {
          const prefix = c.poolType === 'hhad' ? '让 ' : ''
          return `${prefix}${c.matchName} ${c.label} ${fmt(c.value, 2)}`
        })
        .join(' + ')
      return `${item.bet}\t${target}`
    })
    .join('\n')
}

/** 点击复制 */
async function copyBetsAndTargets() {
  const text = buildCopyText()
  if (!text) return

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      // 兜底：用 textarea + execCommand
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    // 显示"已复制"
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 1500)
  } catch (e) {
    console.error('复制失败:', e)
    alert('复制失败：' + e.message)
  }
}

/* ========== 原有工具函数 ========== */
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
    return JSON.stringify(
      {
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
      },
      null,
      2
    )
  } catch (e) {
    return '数据不完整'
  }
})
</script>

<style scoped>
.result-panel {
  margin-top: 24px;
  background: #f9fcff;
  border-radius: 20px;
  padding: 20px;
  border: 1px solid #d9e6f2;
}

.result-header {
  margin-bottom: 16px;
}
.result-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #0b2b4a;
}

/* 理论收益率 */
.expect-row {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(90deg, #eafaf0, #f2fbf5);
  border-left: 4px solid #2e8b57;
  border-radius: 14px;
  padding: 14px 20px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.expect-label {
  font-weight: 600;
  color: #1e3f5c;
  font-size: 0.95rem;
}
.expect-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2e8b57;
  font-family: ui-monospace, monospace;
}

/* 总额 + 收益范围 */
.total-bet-row {
  display: flex;
  align-items: baseline;
  gap: 20px;
  background: #eef5fc;
  border-left: 4px solid #0f3b5e;
  border-radius: 14px;
  padding: 12px 20px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.total-bet-label {
  font-weight: 600;
  color: #1e3f5c;
  font-size: 0.95rem;
}
.total-bet-value {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0b2b4a;
  font-family: ui-monospace, monospace;
}

.range-block {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding-left: 16px;
  border-left: 1px dashed #cbdae9;
  flex-wrap: wrap;
}
.range-label {
  font-weight: 600;
  color: #1e3f5c;
  font-size: 0.9rem;
}
.range-value {
  font-size: 1.15rem;
  font-weight: 700;
  font-family: ui-monospace, monospace;
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
}
.profit-min { color: #2e8b57; }
.profit-max { color: #c0392b; }
.range-sep {
  color: #0b2b4a;
  font-weight: 500;
  padding: 0 2px;
}
.range-gap {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  font-family: ui-monospace, monospace;
  padding: 2px 0;
}
.range-gap .gap-label {
  font-size: 1rem;
  font-weight: 600;
  color: #1e3f5c;
}
.range-gap .gap-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #5a7188;
}
.gap-percent {
  font-size: 0.9rem;
  color: #5a7188;
  font-weight: 600;
}

.error-box {
  background: #fdecea;
  border-left: 4px solid #e74c3c;
  color: #c0392b;
  padding: 12px 18px;
  border-radius: 12px;
  margin-bottom: 16px;
  font-size: 0.9rem;
}

.result-table-wrap {
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid #e2eef9;
  background: white;
}
.result-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.result-table thead { background: #eef5fc; }
.result-table th {
  text-align: left;
  padding: 10px 12px;
  color: #1e3f5c;
  font-weight: 600;
  font-size: 0.8rem;
  white-space: nowrap;
}
.result-table td {
  padding: 10px 12px;
  border-top: 1px solid #eef5fc;
  vertical-align: middle;
  color: #1a2f44;
}
.col-idx {
  font-weight: 600;
  color: #0f3b5e;
  white-space: nowrap;
}
.col-num {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  white-space: nowrap;
  font-weight: 600;
  color: #0f3b5e;
}
.col-combo { min-width: 280px; }

.bet-amount {
  display: inline-block;
  background: #eafaf0;
  color: #2e8b57;
  padding: 3px 12px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.95rem;
}

.combo-line {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}
.rang-tag {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 800;
  color: #b8860b;
  background: #fdf6e3;
  border: 1px solid #f0d78c;
  padding: 0 6px;
  border-radius: 6px;
  line-height: 1.4;
  flex-shrink: 0;
}
.combo-match {
  color: #5a7188;
  font-size: 0.82rem;
  font-weight: 500;
}
.combo-sep {
  color: #b6c6d6;
  font-size: 0.8rem;
}
.combo-result {
  font-size: 1.05rem;
  font-weight: 800;
  padding: 0 4px;
  letter-spacing: 0.5px;
}
.combo-result.win { color: #2e8b57; }
.combo-result.draw { color: #b8860b; }
.combo-result.lose { color: #c0392b; }
.combo-odds {
  color: #7e94aa;
  font-size: 0.78rem;
  font-family: ui-monospace, monospace;
  margin-left: 2px;
}
.profit-pos { color: #2e8b57; }
.profit-neg { color: #c0392b; }

/* ★ 复制按钮 */
.copy-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #e9f0f8;
  color: #0f3b5e;
  border: 1px solid #cbdae9;
  border-radius: 30px;
  padding: 8px 18px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-copy:hover {
  background: #dae6f2;
  border-color: #6f9bc1;
}

.btn-copy.copied {
  background: #d4f0e0;
  border-color: #2e8b57;
  color: #2e8b57;
}

.copy-icon {
  font-size: 0.9rem;
}

.detail-box {
  margin-top: 16px;
  background: white;
  border-radius: 14px;
  border: 1px solid #e2eef9;
  padding: 10px 14px;
}
.detail-box summary {
  cursor: pointer;
  font-weight: 600;
  color: #1e3f5c;
  font-size: 0.9rem;
  padding: 4px 0;
}
.detail-box pre {
  background: #0f3b5e;
  color: #d6e7f7;
  padding: 14px;
  border-radius: 10px;
  font-size: 0.78rem;
  overflow-x: auto;
  margin: 10px 0 4px;
  line-height: 1.5;
}
</style>
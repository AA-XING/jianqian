<template>
  <div class="result-panel" v-if="data">
    <div class="result-header">
      <h2>📊 计算结果</h2>
    </div>

    <!-- 期望收益 -->
    <div class="expect-row">
      <div class="expect-label">期望收益</div>
      <div class="expect-value">{{ fmt(data.expect, 4) }}</div>
    </div>

    <!-- 投注总额 -->
    <div class="total-bet-row">
      <div class="total-bet-label">投注总额</div>
      <div class="total-bet-value">{{ data.result ? data.result.M : '—' }}</div>
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
            <th>推荐投注额</th>
            <th>比赛结果</th>
            <th>收益 (D)</th>
            <th>回报率 (D/M)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in data.details" :key="item.index">
            <td class="col-idx">{{ item.index + 1 }}</td>

            <td class="col-num">
              <span class="bet-amount">{{ item.bet }}</span>
            </td>

            <!-- ★ 比赛结果列：场次名（蓝）+ 结果（大号彩色） -->
            <td class="col-combo">
              <div
                v-for="(c, i) in item.combo"
                :key="i"
                class="combo-line"
              >
                <span class="combo-match">{{ c.matchName }}</span>
                <span class="combo-sep">·</span>
                <span class="combo-result" :class="labelClass(c.label)">
                  {{ c.label }}
                </span>
                <span class="combo-odds">{{ fmt(c.value, 2) }}</span>
              </div>
            </td>

            <td class="col-num" :class="profitClass(item.profit)">
              {{ item.profit >= 0 ? '+' : '' }}{{ fmt(item.profit, 4) }}
            </td>

            <td class="col-num" :class="profitClass(item.rate)">
              {{ (item.rate * 100).toFixed(2) }}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 权重详情 -->
    <details class="detail-box" v-if="data.result">
      <summary>optimize_weights 完整输出</summary>
      <pre>{{ prettyResult }}</pre>
    </details>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Object, default: null }
})

function fmt(v, digits = 4) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  return Number(v).toFixed(digits)
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
        D: r.D.map(v => +fmt(v, 4)),
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

/* 期望收益 */
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

/* 投注总额 */
.total-bet-row {
  display: flex;
  align-items: center;
  gap: 16px;
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
  font-size: 1.4rem;
  font-weight: 700;
  color: #0f3b5e;
  font-family: ui-monospace, monospace;
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

/* 表格 */
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
.col-combo { min-width: 260px; }

/* 投注额高亮 */
.bet-amount {
  display: inline-block;
  background: #eafaf0;
  color: #2e8b57;
  padding: 3px 12px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.95rem;
}

/* ★ 比赛结果列：场次名 + 结果 */
.combo-line {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 4px;
  flex-wrap: wrap;
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

/* 收益/回报率颜色 */
.profit-pos { color: #2e8b57; }
.profit-neg { color: #c0392b; }

/* 详情 */
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
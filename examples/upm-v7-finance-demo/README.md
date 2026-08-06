# UPM v7 示例工程：2024 经营分析汇报

本目录是用 `bin/upm make` 生成的完整示例工程，展示 v7 默认生产链路：

```text
DeckIR → PPTD → 结构校验 → 整稿渲染 + 联系表 → 视觉复检 → PPTX 导出（local）→ 质量报告
```

生成命令（结果可复现）：

```bash
bin/upm make "2024 年公司营业收入达到 96.3 亿元，同比增长 16.7%。净利润 15.8 亿元，毛利率提升至 41%。研发投入 11.4 亿元，占营收比重 11.8%。主要风险包括供应链波动和汇率变化。下一步将推进国际化布局。" \
  --title "2024 经营分析汇报" --out examples --pages 7 --direction formal-finance --mode standard
```

## 工程内容

```text
deck.pptd                 # PPTD 清单（version: v2 + upm 元数据）
pages/*.page              # 7 个独立页面（cover/benefit/risk/closing 等 recipe）
exports/…pptx             # 最终交付：7 页，本地后端导出，ZIP 校验通过
preview/overview.jpg      # 整稿联系表
preview/pages/*.png       # 每页浏览器渲染图（agent-browser 后端）
.upm/deckir.json          # DeckIR（claims/roles/recipes/evidence）
.upm/quality-report.json  # 质量报告（gates 全 pass，1 个 overflow 提示，0 未解决）
.upm/export-record.json   # 导出记录（backend=local）
```

## 继续编辑

```bash
bin/upm open examples/upm-v7-finance-demo
bin/upm review examples/upm-v7-finance-demo
```

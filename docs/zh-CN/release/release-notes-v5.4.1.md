# 发布说明 - v5.4.1

v5.4.1 是 Swiss Deck + Asset Factory 的门禁修复版。它保留 v5.4 的 Web Deck 双路线，并把 README 承诺、资产规划、生成图片证据、版式校验和导出门禁都绑定到可执行检查上。

## 更新内容

- 将路线选择改成确定性表和 fixture 测试集，让正式/可编辑信号、网页信号、瑞士风信息设计信号和极短指令有稳定优先级。
- 将 Step 5 接到 `scripts/build_asset_plan.py`，让 `asset_plan.json` 在 `image_prompts.json` 之前成为图片父合同。
- 重建资产计划时按 item id 保留已有状态和 `current_generation_evidence`，并停止为非法输入静默创建项目目录。
- `scripts/image_gen.py` 写入本次生成证据：run id、backend、prompt hash、file hash、图片尺寸和时间戳。
- 新增 `pipeline-state.json` 质量门禁状态，让 PPTX 导出拒绝过期或缺失的质量证明。
- 新增 `scripts/validate-magazine-deck.mjs` 检查 Style A，并把瑞士布局签名移入 `references/magazine-web/swiss-layout-registry.json`。
- 强化瑞士风校验：slide 数量交叉检查、未定义 class、style 块字号、`flex-end` 和 S22 `object-position` 风险。
- 新增 `spec_lock` 尺寸预算/切片脚本，并对超过 16 页的 deck 强制分段续跑。
- 重写 README 与公开 proof 页面，改为 Proof Packs、已知限制、依赖降级和可执行承诺审计。

## 白话更新栏

- 短指令和模糊需求的路线现在更稳定。
- 生成图片没有本次证据就不能被标成完成。
- 手动图片缺口会在页面组装前暴露，不会被静默吞掉。
- README 不再靠“最佳咒语”或领先执行路径的宣传撑场面。
- 公开案例墙改为 Proof Packs，展示输入、输出和 Design Doctor 自评口径。

## 兼容性

v5.4.1 对 v5.4.0 项目增量兼容。已有 `bestEffectBrief`、`webDeck`、`visualBrief`、`guidedBrief`、`expectationFit`、`asset-plan.md` 和 `asset_plan.json` 仍可使用。重新运行 `scripts/build_asset_plan.py` 时，会按 item id 保留已完成行和证据。

本次 release 不上传桌面二进制安装包。公开分发继续以源码包和 Web/Agent 工作流为主，除非后续单独产出签名桌面包。

## 验证

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests
npm run audit:docs
npm run audit:market
npm run audit:quality
npm run audit:image-contracts
npm run audit:magazine-deck
npm run audit:swiss-deck
npm run audit:presets
npm run audit:web-console
npm run test:node
npm run test:bridge
npm run build:web
npm run build:desktop
npm run doctor
git diff --check
```

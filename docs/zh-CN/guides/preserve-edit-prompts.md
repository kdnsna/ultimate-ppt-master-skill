# 保真改稿 · 可复制场景 Prompt

把下面整段贴给已安装 `$ultimate-ppt-master` 的 Agent（Codex / Claude Code / Cursor 等）。  
原则：**只改点名页/对象，其余字节级不动**；完成后回报 fidelity 报告。

## 1. 经营复盘改数

```text
使用 $ultimate-ppt-master 保真修改这份 PPTX（路径：<你的.pptx>）：
1) 封面标题里的「Q2」改成「Q3」；
2) 第 4 页表格中旧数字按附件新表替换（只改单元格文字，不改表结构）；
3) 第 6 页柱状图图例「线上」改成「线上渠道」。
其余页、母版、logo、备注、超链接一律不要动。
先 inspect 再改；输出新文件 + fidelity 报告（改了哪些 / 多少部分原样）。
```

## 2. 客户底稿换结论

```text
使用 $ultimate-ppt-master 保真修改 <客户方案.pptx>：
- 只改第 2 页结论段：把「建议暂缓上线」换成「建议小范围试点后上线」；
- 第 7 页风险页把「红色」相关措辞改为「可控风险」，不要改颜色形状；
- 不要重排版式，不要增删页，不要整套重生成。
交回可编辑 .pptx 与变更清单。
```

## 3. 培训课件更新数据

```text
使用 $ultimate-ppt-master 保真修改 <上学期课件.pptx>：
- 第 1 页副标题「2025 春季」→「2026 春季」；
- 第 5 页案例数字按 notes.md 中表格更新；
- 第 9 页「课后作业」段落换成 notes.md 的新作业说明。
其余页与品牌母版保持原样。本地运行，不要上传文件。
```

## CLI 等价（无 Agent）

```bash
python3 scripts/preserve_edit_pptx.py --list deck.pptx
python3 scripts/preserve_edit_pptx.py deck.pptx out.pptx --edits edits.json --report fidelity.json --preview
```

`--preview` 会写出：

- `<out>-before-after.svg`：矢量信任卡（始终可用）
- `<out>-before-after.png`：真实像素对比（本机有 LibreOffice 时；CLI `--preview` 会尝试）

桌面端保存成功后会**立刻**展示矢量信任卡，并旁路写入变更说明 `.md`。  
若需要桌面也生成真实 PNG，启动前设置：`PRESERVE_REAL_PREVIEW=1`。

人话 → 计划草案：

```bash
python3 -c "from scripts.preserve_edit_pptx import parse_nl_edit_plan; import json; print(json.dumps(parse_nl_edit_plan('第1页的「Q2」改成「Q3」'), ensure_ascii=False, indent=2))"
```

## 与 PPTLint 串联

1. 用 [PPTLint](https://kdnsna.github.io/pptlint/) 或本地 pptlint 扫问题  
2. `python3 scripts/pptlint_to_preserve_plan.py report.json -o edits.json`  
3. 人工审 `edits.json` 后：  
   `python3 scripts/preserve_edit_pptx.py deck.pptx fixed.pptx --edits edits.json --report fidelity.json`

详见 [MCP 接入](./mcp-server.md) 与 [定位说明](../strategy/positioning-preserve-edit.md)。

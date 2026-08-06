# UPM v7 Office / WPS / LibreOffice 实机验证

> 候选 SHA：`cf9c9dbb00f89105fbbd67f8d466df09cd52fb46`

## 状态

**NOT RUN（待人工执行与签字）**。本机可用：LibreOfficeDev 26.8.0.0.alpha0（codex runtime 路径）、WPS Office（/Applications/wpsoffice.app）。Microsoft PowerPoint 未安装，Windows 平台无本机。

## 覆盖样本

A01（local PPTX）、A05、A06、A09、A12；Kimi 输出待 K1 修复后补入。

## 每文件操作清单（人工执行后逐项签字）

1. 打开文件，确认无“修复”提示；
2. 全屏播放并翻完全部页面；
3. 编辑标题、正文；
4. 移动一个形状；
5. 修改表格或图表对象；
6. 另存为新文件；
7. 关闭后重新打开，检查页面无变化。

特别记录：字体替换、文本重排、图片丢失、黑色背景、图形错位、透明度变化、动画差异、表格单元格可改性、图表数据可改性、DrawingML 组合可编辑性、WPS 与 PowerPoint 差异。

## 证据要求（人工）

首次打开截图、代表页截图、编辑后截图、保存重开截图、应用名称与版本；签字后本文件状态更新为 PASS，未签字不得视为通过。

## 边界声明

本地后端表格/图表为可编辑 DrawingML 形状（非原生对象，K6），本文件为强制准确表达的产品边界；不得宣传原生表格/原生图表能力。

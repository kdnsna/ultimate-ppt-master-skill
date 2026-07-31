# PPT 改稿 · ppt-revise

> 一句话：**别人发你的那份 PPT，指哪改哪，其余原样不动。**

## 它是什么

PPT 改稿不是「再帮你生成一份 PPT」。Kimi、Gamma、ChatGPT 已经够会生成了。
它解决的是生成之后、交付之前的最后一公里——你手上**已经有一份真实品牌 PPT**
（领导发的、客户给的、模板套的），你要改第 5 页的图表标题、第 7 页的结论，
但其余页一个字都不能动，logo 不能糊，母版不能乱，交出去 WPS / PowerPoint 要能正常打开。

模型的本能是「整套重新生成」，而这恰恰会破坏母版、logo、透明度、分组和链接。
PPT 改稿走相反的路：**只重写你点名的那一页，其余每一处都原样拷贝**（严格到一个字节都不差）。
改完附一份改动清单——哪些部分变了、多少个部分原样没动——作为交付门禁。

## 我们做

- 对象级修改你指定页的文本、字体 / 字号 / 粗体 / 颜色、表格单元格、形状位置与大小。
- 未选页、logo、母版、版式、主题、媒体、链接、分组——**原样保留**。
- 输出原生可编辑 `.pptx`，附改动清单；校验不通过就不交付。
- 全程本机运行，不上传任何文件。

## 我们不做

- **不替你从零生成整套演示**——那请用 Kimi / Gamma / ChatGPT。
- **不把整份 PPT 导入再整套重导**来冒充「局部修改」。
- **不把占位内容包装成「已完成」**。
- **不要求你装 Node、跑命令、连本地服务**才能用（桌面端提供免命令入口）。

## 谁用它

- **真实办公用户**：银行、政务、咨询、财务——手里全是带品牌、过合规、要被改五轮的 PPT。
- **AI Agent**：通过零依赖 MCP server（`scripts/ppt_preserve_mcp.py`），任何 MCP 客户端都能调用「安全改这份 pptx」。

## 三种形态，同一个引擎

- **引擎** `scripts/preserve_edit_pptx.py`：纯标准库，「只改你点名的页」与校验门禁的唯一实现。
- **桌面端**：拖入 → 选页 → 改 → 预览 → 存，免命令。
- **MCP server** `scripts/ppt_preserve_mcp.py`：零依赖、stdio，给 Agent 生态。

## 看一眼它怎么改

下面这张对比由 `scripts/make_preserve_demo_proof.py` 对仓库内真实样例生成：
只改第 1 页标题，其余部分原样不变。可复现：

```bash
python3 scripts/make_preserve_demo_proof.py
```

产物见 `assets/preserve-demo/`（修复后的 `.pptx`、改动清单 `fidelity-report.json`、对比卡 `before-after.svg`、动画示意 `before-after.gif`；本机装了 LibreOffice 时还有真实像素渲染 `before-after-real.png` / `before-after-real.gif`）。

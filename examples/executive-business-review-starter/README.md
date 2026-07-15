# 公开办公 PPTX：季度经营复盘

这是一份由**脱敏合成数据**生成的正式办公案例，用于证明 Ultimate PPT Master 能交付可继续修改的原生 PowerPoint，而不是只给结构稿或整页截图。

## 输入

- [脱敏合成 source](./source.sanitized.md)
- 场景预设：`executive_business_review`
- 数据边界：不含真实客户、个人信息或交行业务材料

## 输出与复核

- [下载可编辑 PPTX](./executive-business-review-editable.pptx)
- [打开 Web Deck 预览](./web-demo.html)
- [查看封面预览](./cover.svg)
- [查看原生对象审计](./native-object-report.json)
- [查看 PPTLint 检查摘要](./pptlint-report.md)
- [查看完整质量报告](./quality-report.json)

## 已验证事实

- 9 页，稳定 `P01-P09`。
- 209 个文本 run、226 个原生矢量对象。
- 2 个原生图表、2 个原生表格、9 页演讲备注。
- 当前浅色圆角版已完成原生对象审计、PPTLint 规则检查与 WPS Office 9/9 页逐页视觉复核。
- 功能容器采用克制的小圆角；图表、表格内网格和证据规则保留直线秩序。
- PPTLint 规则检查分 100；这是内部规则检查，不是审美评分或第三方认证。

## 已知限制

- 接收端缺少 `Noto Sans CJK SC` 时可能替换字体并改变换行。
- 当前浅色版在本机 WPS Office 中未见可见缺字、溢出、错位、黑底替换或图表异常；状态栏仍有字体便携性提醒。
- 本机未安装 Microsoft PowerPoint，因此 PowerPoint 原生逐页复核仍待在目标环境完成。
- 本机 LibreOffice 运行时出现中文缺字，因此它的导出结果不作为视觉通过证据。
- 如需无障碍对外交付，还应在 PowerPoint 选择窗格中人工复核对象阅读顺序。

重新生成：

```bash
python3 scripts/generate_public_office_proof.py
```

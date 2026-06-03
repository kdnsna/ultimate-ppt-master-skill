# 发布说明 - v2.3.0

v2.3.0 把 Ultimate PPT Master 统一到一个产品承诺上：

> 输入看得懂，产出看得见，本地 Agent 接得住。

## 最大提升

项目不再只是说明“可以生成 Agent prompt”。README 和 Web Experience 现在把完整路径摆出来：

1. 用户应该提供什么资料；
2. 会生成什么 Agent prompt；
3. 打磨后的 Web Deck 产物长什么样；
4. Bridge 如何打包 handoff；
5. Skill 为什么仍然是高质量生产路线。

## 主要变化

- 新增本地仓库、Codex Skill、通用 Agent Skill 的一键更新命令。
- README 新增输入到产出样板，包含 source、Agent prompt、截图和生成 Web Deck。
- Web Experience 文案统一为 Agent Connect Studio，直接解释 v2.3 的产品价值。
- Bridge 继续坚持本地优先和 handoff 定位：`manifest`、`engine-plan`、`quality-checklist`、预览文件和 Agent 命令。
- 公开示例说明改成“给什么 / 出什么”的结构，降低新用户理解成本。

## 质量标准

v2.3.0 仍然把网页端定位为入口，而不是最终生产引擎。最终质量应该由 Skill 路线保证：本地文件、脚本、预览、修复和导出检查。

公开样板已经作为可打开的 Web Deck 检查，并与源 brief 放在一起说明。

## 升级

```bash
cd ultimate-ppt-master-skill
npm run update
```

Codex Skill 用户可以直接使用 README 中的一键更新命令。

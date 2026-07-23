# 安装与启动

v6.3.8 正式版本保留两条安装路径。是否真正发布，只以 [`v6.3.8` tag 与 GitHub Release 页面](https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.8) 为准；源码元数据本身不能代替该证据。GitHub 安装不会自动发布或证明 marketplace 已上架。只想让 Codex 或其他兼容 Agent 使用 Skill，优先走一分钟安装；需要可视化工作台、真实资料解析和本地产物下载，再安装完整仓库。

## 一分钟安装 Skill

```bash
npx skills add kdnsna/ultimate-ppt-master-skill --skill ultimate-ppt-master
```

安装后直接对 Agent 说：

```text
用 $ultimate-ppt-master，把这份资料做成 10 页、给管理层看的可编辑 PPTX。
结论先行，所有数字可追溯，不能编造缺失事实。
```

这条路径适合已经在 Codex、Claude Code 等环境里工作的人。最终文件由本地 Agent 生成，不经过 Ultimate 的云端账号或托管服务。

## 完整工作台

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run doctor
npm run bridge
```

然后打开：

```text
https://kdnsna.github.io/ultimate-ppt-master-skill/
```

工作台把文件交给 `127.0.0.1` 上的本机 Bridge。默认不会自动启动 Agent；如需“创建项目并启动 Codex”，使用：

```bash
npm run bridge -- --allow-launch
```

未启用自动启动时，工作台会创建项目并给出可复制的 Codex 命令。

## 安装后检查

```bash
npm run doctor
npm run test:bridge
```

`doctor` 中 provider 未配置属于可选提醒，不会阻止确定性故事板、handoff 和本地产物发现。资料、密钥和项目默认保留在本机；不要把 Bridge 直接暴露到公网。

英文完整说明见 [Agent Setup](../../guides/agent-setup.md)，Bridge 路径与安全规则见 [Agent Connect Bridge](./agent-connect-bridge.md)。

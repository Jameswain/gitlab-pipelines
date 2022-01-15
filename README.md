# Development Environment - 开发环境

- node: v16.13.1
- npm: v8.1.2
- Operating System - 系统: MacOS

# GitLab Pipelines

:us: This extension can monitor 20 GitLab Pipelines in Realtime

:cn: 这个插件可以实时监控当前仓库最新的20条pipeline状态

## Features

:us: This extension will display the latest 20 pipeline statuses in the tree menu on the left.

:cn: 这个插件会在左侧树菜单展示当前仓库最新20pipeline的状态

![](https://img.ikstatic.cn/MTYzMzg3NDA3NzUyNiMyMTkjanBn.jpg)

## Requirements - 要求

:us: This plugin only exist in the currently opened workspace.

:cn: 这个插件只有当前打开的工作空间存在`.gitlab-ci.yml`文件才会启动

## Extension Configuration - 插件配置

在`settings.json`文件中添加以下配置：

```json
"GitLabPipelines": {
  "code.com": {      						// 自己公司对应的gitlab域名
    "token": "123HJG23DCAXSDAS",// 在你的GitLab的 Personal Access Token 菜单中进行创建
    "interval": 3000						//  更新时间
  }
}
```

创建 [Gitlab Personal Access Token](https://docs.gitlab.com/ce/user/profile/personal_access_tokens.html) 如下图所示：

![](https://img.ikstatic.cn/MTYzMzg3NDU5MzA1NSM2ODQjanBn.jpg)

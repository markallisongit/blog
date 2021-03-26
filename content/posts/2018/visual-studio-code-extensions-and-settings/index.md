---
title: "Visual Studio Code Extensions and Settings"
date: 2018-02-04T15:09:11Z
lastmod: 2018-02-04T15:09:11Z
draft: false
author: Mark
tags: [vscode]
categories: [environment]
lightgallery: false
---
I primarily work in **Visual Studio 2017** and **Visual Studio Code**, using VS2017 for SSDT work, and VS Code for pretty much everything else. VS code is highly configurable, and as it’s a rainy Sunday, I thought I’d share my settings with you in case you are interested. A few colleagues at work have asked me what extensions and settings I have so, here they are as of Feb 2018.

## Extensions

In a console session within vs code, you can do this to list them:
``` powershell
PS C:\> code --list-extensions
codezombiech.gitignore
DotJoshJohnson.xml
eamodio.gitlens
gerane.Theme-Blackboard
mohsen1.prettify-json
ms-mssql.mssql
ms-vscode.PowerShell
ms-vsts.team
PeterJausovec.vscode-docker
secanis.jenkinsfile-support
yzhang.markdown-all-in-one
```

These are:

* Blackboard Theme
* Docker
* Git Lens
* gitignore
* Jenkinsfile Support
* Markdown All In One
* mssql
* PowerShell
* Prettify JSON
* Visual Studio Team Services
* XML Tools

## Settings

Settings I like are:

```json
{
    "gitlens.advanced.messages": {
        "suppressCommitHasNoPreviousCommitWarning": false,
        "suppressCommitNotFoundWarning": false,
        "suppressFileNotUnderSourceControlWarning": false,
        "suppressGitVersionWarning": false,
        "suppressLineUncommittedWarning": false,
        "suppressNoRepositoryWarning": false,
        "suppressResultsExplorerNotice": false,
        "suppressUpdateNotice": false,
        "suppressWelcomeNotice": true
    },
    "workbench.colorTheme": "Blackboard",
    "mssql.connections": [
        {
            "server": "CROCUS",
            "database": "master",
            "authenticationType": "Integrated",
            "profileName": "CROCUS-master",
            "password": ""
        }
    ],
    "editor.fontFamily": "'Fira Code'",
    "editor.fontLigatures": true,
    "editor.fontSize": 16,
    "editor.minimap.renderCharacters": false,
    "editor.mouseWheelZoom": true,
    "editor.renderWhitespace": "boundary",
    "editor.showFoldingControls": "always",
    "window.zoomLevel": 0,
    "files.autoSave": "onWindowChange",
    "powershell.startAutomatically": false
}
```

Here’s a quick video on how to set it all up:

{{< youtube CFwn2a-j_no >}}
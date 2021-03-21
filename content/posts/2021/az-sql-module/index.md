---
title: Az.Sql Module won't load
date: 2021-03-16T18:17:22Z
lastmod: 2021-03-16T18:17:22Z
draft: false
author: Mark
tags: [azure, powershell, sql-managed-instance]
categories: [powershell]
lightgallery: true
---

Today, the `Az.Sql` module would not load on my machine when attempting to manually fail over a SQL Managed Instance with this error:

{{< image src="2021-03-16_18-19-15.png" caption="module could not be loaded" >}}

I followed the advice of the error message and tried to import the module to get further information.

{{< image src="2021-03-16_18-19-54.png" caption="module is already loaded" >}}

Hmmm :thinking:

I decided to uninstall the Azure PowerShell from my machine using the Windows 10 Settings App. Looks like an old version.

{{< image src="2021-03-16_18-22-25.png" caption="Uninstall Azure PowerShell" >}}

I then tried to reinstall the `Az` module using PowerShell but it still found an old version in my personal OneDrive\Documents folder.

{{< image src="2021-03-16_18-24-00.png" caption="Warning version already installed" >}}

I went into Windows Explorer and deleted that, and then all was fine for the installation and the PowerShell cmdlets for `Az.Sql` worked fine again.

{{< image src="2021-03-16_18-27-27.png" caption="Installing module for all users" >}}

{{< image src="2021-03-16_18-28-51.png" caption="Working fine now" >}}
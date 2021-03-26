---
title: "Automating Adding Servers to Sentry One"
date: 2017-11-20T15:20:19Z
lastmod: 2017-11-20T15:20:19Z
draft: false
author: Mark
tags: [powershell,sentry-one,monitoring]
categories: [monitoring]
lightgallery: false
---
## Overview

**Sentry One** is a great tool for monitoring many servers. For new installations, it can be a bit of a bind to add your existing servers into the tool to be monitored. I have written a PowerShell module to make this much easier and to validate that servers that you thought were being monitored, are in fact monitored.

There is full documentation for the module in the Sentry One user guide which explains how to use the functions within it, but a brief explanation is shown below. it is worth mentioning that all the PowerShell cmdlets are doing is calling the SentryOne compiled PowerShell module provided when you install SentryOne.

## Functions

* `Test-SentryOneTarget`: this module has been rolled into the module from my previous post. It tests a remote machine to make sure all the firewall ports, permissions, WMI, perfmon is accessible to allow SentryOne to monitor it.

* `Register-SentryOneTarget`: Registers a Sentry One Windows machine and SQL Server instance with Sentry One and then watches it.

* `Test-SentryOneTargetIsWatched`: Connects to Sentry One and checks to see if the server and SQL Server instance are currently being watched.

By themselves the functions are not that special, but they become more powerful when run in a PowerShell pipeline. If you have a list of servers in a CSV, XML or JSON file, you can pipe those into the above commands and have your whole estate configured and monitored in under 5 minutes from a blank Sentry One monitoring service.

There’s a demo of how this works in the YouTube video here on YouTube.

{{< youtube uSxQ52oD7TA >}}

## Typical workflow

A typical workflow is to first check that the servers we want to monitor are accessible and meet the requirements of SentryOne in terms of firewall ports and permissions. This can be done with:

### Check requirements

```powershell
$servers = Get-Content ".\tests\serverlist.json" -Raw -Encoding UTF8 | ConvertFrom-Json
get-childitem "C:\temp\*.csv" | Remove-Item  -Force
$result = $servers.targets | % { Test-SentryOneTarget $_.ServerName $_.InstanceName $_.UserName $_.Password $_.SQLPort }
```

This will tell you if all your servers meet the requirements or not. If you have a lot of servers, and you want to know which ones failed to add in Full mode, simply run this:

`$result | ? {$_.SentryOneMode -ne "Full"}`
 

This will show you all the servers that can only run in Limited mode, or cannot be monitored. You can now go and fix those issues and re-run. Once your connection issues are fixed, you can register and watch your servers with a single line of PowerShell:

### Register and watch

```powershell
$result = $servers.targets | % { Register-SentryOneTarget $_.ServerName $_.InstanceName $_.UserName $_.Password $servers.SentryOneServer $servers.SentryOneDatabase }
```

Check the result for failures with another line of PowerShell:

```powershell
$result | ? { $_.WatchComputer -ne "Pass" -or $_.WatchConnection -ne "Pass"}
```

### Verify
Give SentryOne a few minutes to complete it’s gather process where it will connect to all the instances and start gathering configuration and performance metrics. Then verify that they are all being watched with:

```powershell
$result = $servers.targets | % { Test-SentryOneTargetIsWatched $_.ServerName $_.InstanceName $servers.SentryOneServer $servers.SentryOneDatabase }
```

Check that all the servers were registered in Sentry One successfully with:

```powershell
$result | ? {$_.InstanceIsRegistered -ne $true }
```

Check all the instances are watched with:
```powershell
$result | ? {$_.InstanceIsWatchedBy -notmatch "PerformanceAdvisor|EventManager"}
```

As a final check, load SentryOne and have a look to make sure everything looks fine.

> Originally published at https://sabin.io/blog/automating-adding-servers-to-sentry-one/
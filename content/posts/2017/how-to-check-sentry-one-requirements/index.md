---
title: "How to Check Sentry One Requirements"
date: 2017-11-12T15:37:18Z
lastmod: 2017-11-12T15:37:18Z
draft: false
author: Mark
tags: [sentry-one,monitoring,powershell]
categories: [monitoring]
lightgallery: true
---
I was at a client site recently and implemented Sentry One for them, a great monitoring system for SQL Server. It proved challenging because some servers were in a DMZ on a separate network and domain and some servers were in the same domain. All servers connected via a router and were firewalled off from each other with only the minimum ports open required for them to fully function and communicate.

Sentry One operates in two modes, **Full** and **Limited**.

* Full mode allows Sentry One to gather Windows metrics as well as SQL Server metrics
* Limited mode does not allow WMI or Perfmon counters to be collected, so only SQL Server metrics are collected

In order to run in Full mode, the Sentry One service and client must be able to authenticate in Windows on the target. The Sentry One service must be a member of the local Administrators group on the target, and a sysadmin in every SQL Server instance on the target that we want to monitor. All the required firewall ports must also be open.

On the client site, we could get Sentry One to connect in Limited mode only and it was unclear why. We double-checked all the requirements, and they seemed to be met. A colleague suggested to write a PowerShell script that would test for all the requirements for Sentry One on each target, and to be able to read a list of servers from a file and use that to check a bunch of servers.

So that’s what I did, and I’d like to share it in case you find it useful on your site in complicated networking environments.

Please see the [github page](https://github.com/markallisongit/Test-SentryOneTarget) for the code and documentation that shows you how to use it.

Here’s some examples of it in action:

### Example 1

Testing a server that I know has all ports open and the correct permissions for Full mode.

```powershell
Set-Location "C:\Repos\Test-SentryOneTarget"
. .\Test-SentryOneTarget.ps1
Test-SentryOneTarget -ServerName wisteria –Verbose 
```

{{< image src="fullmode.png" caption="Testing against Full mode" >}}

### Example 2

Testing a server that has the WMI port blocked

```powershell
Test-SentryOneTarget -ServerName violet -InstanceName "violet\instance_a" –Verbose
```

{{< image src="WMIblocked.png" caption="Testing against WMI blocked" >}}

### Example 3

Pipe in a JSON file of a list of servers you want to check

JSON file will look something like:

{{< image src="jsonconfig.png" caption="JSON config" >}}

```powershell
$servers = Get-Content .\serverlist.json -Raw -Encoding UTF8 | ConvertFrom-Json
$servers.targets | % { Test-SentryOneTarget $_.ServerName $_.InstanceName $_.UserName $_.Password $_.SQLPort} 
```

{{< image src="many.png" caption="Testing many servers" >}}

So there we have it, I hope you find it useful. Here’s a little video demo if you want to see how Sentry One behaves when the firewall blocks WMI, and the script in action:

{{< youtube PdRbHV-e96g >}}
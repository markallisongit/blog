---
title: "Strange Sql Virtual Machine Problem"
date: 2022-03-11T07:54:52Z
lastmod: 2022-03-11T07:54:52Z
draft: false
author: Mark
tags: [azure, sql-server, sql-virtual-machine, bicep]
lightgallery: false
---
I've been having problems deploying a Sql Virtual Machine in Azure lately and decided to perform some tests to get to the bottom of the issue. I'd like to share some strange behaviour.

## Problem

If I deploy a new SQL VM using bicep, it deploys fine. If however, I redeploy the same VM the deployment fails with this error:

{{< admonition failure "Ext_AutomatedBackupError" true >}}
* code: **Ext_AutomatedBackupError**
* Error: **Execution Timeout Expired**.  The timeout period elapsed prior to completion of the operation or the server is not responding.;System.Data.SqlClient.SqlException (0x80131904): Execution Timeout Expired.  The timeout period elapsed prior to completion of the operation or the server is not responding. ---> System.ComponentModel.Win32Exception (0x80004005): The wait operation timed out.
{{< /admonition >}}

In the SQL Server ERRORLOG on the VM:

```
2022-03-06 08:24:17.62 Logon       Error: 18456, Severity: 14, State: 38.
2022-03-06 08:24:17.62 Logon       Login failed for user 'NT Service\SQLIaaSExtensionQuery'. Reason: Failed to open the explicitly specified database 'msdb'. [CLIENT: <local machine>]
2022-03-06 08:24:17.74 spid8s      Starting up database 'msdb'.
```

* Location: UK South
* VM Size: Standard_D2ds_v4
* SqlImageType: sql2019-ws2022
* SqlImageSku: sqldev-gen2

If you want to reproduce the issues I am having I created a repo [here](https://github.com/markallisongit/sqliaas-demo). Just clone the repo and change into the repo directory in PowerShell 7, Connect to the Azure subscription you want to deploy to and then run `Deploy.ps1`.

### Initial deploy works fine

Takes 8 minutes to run.

{{< image src="InitialDeploy.gif" caption="Initial deploy (click to enlarge) Video length: 00:10" >}}

{{< admonition note "Note" true >}}
Requires latest [bicep](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/install) and [PowerShell 7](https://docs.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-windows?view=powershell-7.2).
{{< /admonition >}}

### Redeploy without rebooting

Takes 2 minutes to run.

{{< image src="RedeployWithoutRebooting.gif" caption="Redeploy without rebooting (click to enlarge) Video length: 00:10" >}}
### Redeploy after VM deallocated

{{< image src="RedeployAfterDeallocate.gif" caption="Redeploy after deallocation (click to enlarge) Video length: 00:40" >}}

## Strange workaround 1

Restart the SQL Server service and redeploy

{{< image src="RedeployRestartSql.gif" caption="Redeploy after Sql Service restart (click to enlarge) Video length: 00:47" >}}

## Strange workaround 2

Change the VM Size to Standard_D2ds_v4 and redeploy (same as rebooting?)

{{< image src="RedeployResized.gif" caption="Redeploy after Sql Service restart (click to enlarge) Video length: 00:27" >}}
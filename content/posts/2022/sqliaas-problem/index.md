---
title: "Sql Virtual Machine Race Condition"
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

Delving into the previous `ERRORLOG` file, `ERRORLOG.1` I can see this

```
2022-03-28 09:13:37.60 spid11s     Clearing tempdb database.
2022-03-28 09:13:37.60 spid11s     Error: 5123, Severity: 16, State: 1.
2022-03-28 09:13:37.60 spid11s     CREATE FILE encountered operating system error 3(The system cannot find the path specified.) while attempting to open or create the physical file 'D:\SQLTemp\Data\tempdb.mdf'.
2022-03-28 09:13:37.65 spid11s     Error: 17204, Severity: 16, State: 1.
2022-03-28 09:13:37.65 spid11s     FCB::Open failed: Could not open file D:\SQLTemp\Data\tempdb.mdf for file number 1.  OS error: 3(The system cannot find the path specified.).
2022-03-28 09:13:37.65 spid11s     Error: 5120, Severity: 16, State: 101.
2022-03-28 09:13:37.65 spid11s     Unable to open the physical file "D:\SQLTemp\Data\tempdb.mdf". Operating system error 3: "3(The system cannot find the path specified.)".
2022-03-28 09:13:37.65 spid11s     Error: 1802, Severity: 16, State: 4.
2022-03-28 09:13:37.65 spid11s     CREATE DATABASE failed. Some file names listed could not be created. Check related errors.
2022-03-28 09:13:37.65 spid11s     Could not create tempdb. You may not have enough disk space available. Free additional disk space by deleting other files on the tempdb drive and then restart SQL Server. Check for additional errors in the operating system error log that may indicate why the tempdb files could not be initialized.
```

This suggests that SQL Server is unable to create tempdb.

Machine specs

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

## Microsoft Support

I raised a Support Request with Microsoft and the suggestion that came back was to set the SQL Server service to **Delayed Start**. This is because there is a program scheduled using the task scheduler to create the `D:\SQLTemp\Data` and `D:\SQLTemp\Log` directories on server boot. Looking in Task Scheduler, there is indeed a task called SqlStartUp which creates these tempdb directories. 

{{< image src="2022-03-28_10-45-13.jpg" caption="SqlServerStarter.exe in SqlIaaS resource" >}}

This is a [race condition](https://en.wikipedia.org/wiki/Race_condition), where if the SQL Server service wins the race with the SqlStartUp scheduled task, SQL Server will fail to start, because the tempdb directories do not exist.

I view this solution as a workaround because it needs to be set in a Custom Script Extension after deployment which is a bit of hassle to create and maintain.
## References

https://docs.microsoft.com/en-us/azure/azure-sql/virtual-machines/windows/performance-guidelines-best-practices-vm-size
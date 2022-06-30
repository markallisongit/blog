---
title: "Sql Virtual Machine Race Conclusion"
date: 2022-06-30T11:28:59+01:00
lastmod: 2022-06-30T11:28:59+01:00
draft: true
author: Mark
tags: [azure,sql-server,sql-virtual-machine,bicep]
lightgallery: true
---
A couple of months ago [I wrote about]({{< relref "./sqliaas-problem/index.md" >}}) a race condition in a [SQL IaaS VM](https://docs.microsoft.com/en-us/azure/azure-sql/virtual-machines/?view=azuresql) using the Azure sqlvm resource. I have been working with Microsoft and have come to a better resolution than placing tempdb on a separate remote drive as mentioned in that article.

## Suggestion

Microsoft suggested to change the startup type of the SQL Server service to Automatic (Delayed Start). I have now put this into the bicep template for both SQL Server and SQL Server Agent service. 

One problem I came up against was trying to use the PowerShell cmdlet `Set-Service` to set the SQL Server service to Delayed Start because this is only supported from PowerShell 6.0 onwards and Windows Server 2022 is shipped with Windows Powershell 5.1.

Two solutions to this

1. In a previous step install Powershell 7
1. Use `sc.exe` instead

For this article I opted for sc.exe instead, but recommend PowerShell 7 as it has many performance, feature and security improvements over Windows PowerShell 5.1. Setting just the SQL Server service to Delayed Start was intermittently successful, typical of a race condition.

{{< image src="2022-06-30_12-22-38.jpg" caption="Deployment with SQL Server service set to Delayed Start (click to enlarge)" >}}

## Further suggestion

Microsoft later suggested to set both the SQL Agent and SQL Server services to Delayed start. This seems to have fixed the issue and I have not had a Timeout since. This makes sense because if you start the SQL Server Agent service without starting the SQL Server service, SQL Server gets started anyway because SQL Server Agent *depends on it*.


 To set both services to delayed start in my template I call the `Microsoft.Compute/virtualMachines/runCommands` resource and run this script as part of the deployment.

```powershell
sc.exe config SQLSERVERAGENT start= delayed-auto; sc.exe config MSSQLSERVER start= delayed-auto;
```

The full code can be found in my [git repo](https://github.com/markallisongit/sqliaas-demo). 

## Problem solved

I can now have reliable SQL Virtual Machine deployments with tempdb on the local, fast ephemeral disk without having to place that on a provisioned disk.

Hope this helps!
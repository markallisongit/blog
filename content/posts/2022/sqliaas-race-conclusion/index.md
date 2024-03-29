---
title: "Sql Virtual Machine Race Conclusion"
date: 2022-06-30T16:28:59+01:00
lastmod: 2022-08-01T12:20:59+01:00
draft: false
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

Logging in to the VM shows that they are indeed set to Delayed Start.

{{< image src="2022-06-30_13-38-31.jpg" caption="SQL Services set to Delayed Start (click to enlarge)" >}}

I have tested this multiple times and it seems reliable (but let me know if you have issues).

{{< image src="2022-06-30_14-29-05.jpg" caption="Reliable SQLVM deployments! (click to enlarge)" >}}


## Problem solved

I can now have reliable SQL Virtual Machine deployments with tempdb on the local, fast ephemeral disk without having to place that on a provisioned disk.

Hope this helps!

## UPDATE 20th July 2022

Microsoft got in touch with me and let me know that this race condition has now been fixed by the product team so the code to set the SQL Server services to Delayed Start will no longer be required. At the time of this update the fix is being rolled out to all Azure regions according to their [safe deployment practises](https://azure.microsoft.com/en-us/blog/advancing-safe-deployment-practices/#:~:text=%20Advancing%20safe%20deployment%20practices%20%201%20Changing,the%20entire%20rollout%20process%20is%20completely...%20More%20). I will provide another update when the fix has been rolled out to all regions, from that point the workaround code I provided in this article can be removed.

## UPDATE 1st August 2022

This is now rolled out across all of Azure.
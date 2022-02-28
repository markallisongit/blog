---
title: "Automate Setting the SqlIaaS Backup Container"
date: 2022-02-25T12:36:08Z
lastmod: 2022-02-25T12:36:08Z
draft: false
author: Mark
tags: [azure,sql-server,bicep,devops]
lightgallery: true
---
Even though Microsoft offer Azure Sql Database and Azure Sql Managed Instance, there are occasions when SQL Server in a VM is required.

## The SqlIaaS Azure Resource

If you've read my posts before you will know that I deploy resources to the cloud using infrastructure-as-code, with my preferred language being bicep. As a lazy developer, I like to use built-in offerings and PaaS wherever possible. For SQL server on VMs in Azure, the resource `Microsoft.SqlVirtualMachine/sqlVirtualMachines` is great.

Why reinvent the wheel?

In the [Microsoft documentation](https://docs.microsoft.com/en-us/azure/templates/microsoft.sqlvirtualmachine/sqlvirtualmachines?tabs=bicep) I noticed there isn't a way to set the container name for automated backups of SQL Server with the `sqlvirtualmachines` resource. So, after deploying the template with ARM or bicep the default container name will be **backupcontainer**.

What if I have multiple SQL IaaS VMs that I want backed up to the same storage account? Clearly, I need to set the container name, and I'm **not** doing this manually. A good name would be the SQL Server instance name.

## Tinkering

I decided to go into the [Azure Portal](https://portal.azure.com/#home) (yes, I know) and see if there is a setting in there to change the container name. I was surprised to see that it is possible by clicking on **Select storage account**.

{{< image src="2022-02-25_12-51-22.jpg" caption="Select storage account in SqlIaaS resource" >}}

I decided to change the name of the container to `markscontainer` and redeploy, and then capture the template deployment so that I could include that in my bicep template.


{{< image src="2022-02-25_12-57-33.jpg" caption="Add container" >}}

Capturing the deployment, and looking at the template I can see a property called `StorageContainerName`.

{{< image src="2022-02-25_13-02-23.jpg" caption="Viewing the deployment template" >}}

## Adding to bicep

Notice that there's no mention of this attribute in the [Microsoft documentation](https://docs.microsoft.com/en-us/azure/templates/microsoft.sqlvirtualmachine/sqlvirtualmachines?tabs=bicep), in both the ARM and Bicep sections. I have submitted a response to Microsoft to get that improved.

Also, the vscode bicep linter does not accept this value either, so it's missing in there as well. Deployments using the bicep template succeed and deploy fine though using the Azure CLI.

{{< image src="2022-02-25_13-08-33.jpg" caption="The bicep template with vscode linter warning" >}}

If I hover over the squiggly writing I see this:

> The property "StorageContainerName" is not allowed on objects of type "AutoBackupSettings". Permissible properties include "fullBackupFrequency", "fullBackupStartTime", "fullBackupWindowHours", "logBackupFrequency", "password". If this is an inaccuracy in the documentation, please report it to the Bicep Team.bicephttps://aka.ms/bicep-type-issues

I've reported this to the bicep team too.

## Summary

To set the name of the container where your SQL Server backups go to, add the `storageContainerName` property to the `autoBackupSettings` of the bicep/ARM template as shown above.

## References

https://docs.microsoft.com/en-us/azure/templates/microsoft.sqlvirtualmachine/sqlvirtualmachines?tabs=bicep
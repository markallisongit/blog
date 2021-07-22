---
title: "Bicep Resource Not Found"
date: 2021-07-22T10:02:11+01:00
lastmod: 2021-07-22T10:02:11+01:00
draft: false
author: Mark
tags: [bicep, azure]
lightgallery: true
---
## Bicep stopped deploying with this error

I'm trying to deploy a resource group which has two storage accounts in it with this PowerShell command using a bicep template:

```PowerShell
New-AzResourceGroupDeployment -ResourceGroupName $resourcegroupName -TemplateFile .\azuredeploy.bicep -TemplateParameterFile .\azuredeploy.test.parameters.json
```

{{< admonition failure "Error" true >}}
New-AzResourceGroupDeployment: Cannot retrieve the dynamic parameters for the cmdlet. Build succeeded: 0 Warning(s), 0 Error(s)
{{< /admonition >}}

I haven't made any code changes, just not deployed this resource for a while. I decided to update bicep to the latest version (at the time of writing is Bicep CLI version 0.4.412 (f1169d063e)).

I still get the same error, so I update the PowerShell `Az` module to the latest version too. Now when I try my command again, getting a different error:

{{< admonition failure "Error" true >}}
New-AzResourceGroupDeployment: The deployment 'azuredeploy' failed with error(s). Showing 1 out of 1 error(s).

Status Message: The Resource 'Microsoft.Storage/storageAccounts/backupsacdukcjkaykm' under resource group was not found.
{{< /admonition >}}

I check my bicep template and all is fine. However I look up the [storage accounts](https://docs.microsoft.com/en-us/azure/templates/microsoft.storage/storageaccounts?tabs=bicep) documentation and check the API versions. I see that there's a later API version than the one I'm using so update to the latest.

I just had to change line 1 in the code below

Code before
```
resource saResources 'Microsoft.Storage/storageAccounts@2021-01-01' = [for sa in storageAccounts: {
  name: '${sa.namePrefix}${uniqueString(resourceGroup().id)}'
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: sa.accessTier
  }
}]
```

Code after
```
resource saResources 'Microsoft.Storage/storageAccounts@2021-02-01' = [for sa in storageAccounts: {
  name: '${sa.namePrefix}${uniqueString(resourceGroup().id)}'
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: sa.accessTier
  }
}]
```

Now when I deploy, it works fine.
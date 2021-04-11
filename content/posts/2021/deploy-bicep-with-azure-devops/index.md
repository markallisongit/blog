---
title: "Deployments with Bicep and Azure Devops"
date: 2021-04-09T13:08:20+01:00
lastmod: 2021-04-09T13:08:20+01:00
draft: false
author: Mark
tags: []
lightgallery: false
---

## Goodbye JSON

Since Microsoft released bicep version 0.3 I thought I'd give it a try because anyone that's authored ARM templates will know, they tend to make your eyes bleed after a while.

I reverse-engineered an existing simple template that deploys two storage accounts by using `bicep decompile` and got a template like this:

```bicep
@description('Tags for the backup storage resources.')
param tags object

@description('Location for all resources, defaults to the Resource Group location')
param location string = resourceGroup().location

@description('Number of days to housekeep blob storage')
param houseKeepDays int = 90

var archsaName = 'ndwarchsa${uniqueString(resourceGroup().id)}'
var backupsaName = 'ndwbackupsa${uniqueString(resourceGroup().id)}'
var skuName = 'Standard_LRS'
var storageKind = 'StorageV2'

resource archsa 'Microsoft.Storage/storageAccounts@2021-01-01' = {
  name: archsaName
  location: location
  tags: tags
  sku: {
    name: skuName
  }
  kind: storageKind
  properties: {
    accessTier: 'Cool'
  }
}

resource backsa 'Microsoft.Storage/storageAccounts@2021-01-01' = {
  name: backupsaName
  location: location
  tags: tags
  sku: {
    name: skuName
  }
  kind: storageKind
}

resource backsa_default 'Microsoft.Storage/storageAccounts/managementPolicies@2021-01-01' = {
  name: '${backsa.name}/default'
  properties: {
    policy: {
      rules: [
        {
          enabled: true
          name: 'HouseKeepFilesAfter${houseKeepDays}Days'
          type: 'Lifecycle'
          definition: {
            actions: {
              baseBlob: {
                delete: {
                  daysAfterModificationGreaterThan: houseKeepDays
                }
              }
            }
            filters: {
              blobTypes: [
                'blockBlob'
              ]
            }
          }
        }
      ]
    }
  }
}
```

After a bit of massaging and implementing a loop in the bicep code, I ended up with this:

```bicep
@description('Tags for the backup storage resources.')
param tags object

@description('Location for all resources, defaults to the Resource Group location')
param location string = resourceGroup().location

@description('Number of days to housekeep blob storage')
param houseKeepDays int = 90

var storageAccounts = [
  {
    namePrefix: 'ndwarchsa'
    accessTier: 'Cool'
  }
  {
    namePrefix: 'ndwbackupsa'
    accessTier: 'Hot'
  }
]

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

resource backsa 'Microsoft.Storage/storageAccounts/managementPolicies@2021-01-01' = {
  name: 'ndwbackupsa${uniqueString(resourceGroup().id)}/default'
  properties: {
    policy: {
      rules: [
        {
          enabled: true
          name: 'HouseKeepFilesAfter${houseKeepDays}Days'
          type: 'Lifecycle'
          definition: {
            actions: {
              baseBlob: {
                delete: {
                  daysAfterModificationGreaterThan: houseKeepDays
                }
              }
            }
            filters: {
              blobTypes: [
                'blockBlob'
              ]
            }
          }
        }
      ]
    }
  }
}
```

## How to deploy with Azure Pipelines?
I tried various iterations until I came up with something I was happy with. I tried the template locally using PowerShell `New-AzResourceGroupDeployment` using **Bicep** and it worked fine. I had a little trouble with Azure DevOps though, but all seemed well with a Self-Hosted agent.

### Steps for Self-Hosted agents

Connect to your build server, then:

1. Install Bicep
1. Ensure installed `Az` PowerShell module version >= 5.6
1. Cannot use `AzureResourceManagerTemplateDeployment` pipeline task

I like using the `AzureResourceManagerTemplateDeployment` task as it just simplifies the pipeline, but for bicep I wrote a `Deploy.ps1` PowerShell script instead and just referenced that with code like this:

```powershell
param (
    $ResourceGroup,
    $Location,
    $TemplateFile,
    $TemplateParameterFile
)

if (-not (Get-AzResourceGroup | where {$_.ResourceGroupName -eq $ResourceGroup} )) {    
    New-AzResourceGroup -Name $ResourceGroup -Location $Location
}

New-AzResourceGroupDeployment -Name StorageDeployment -ResourceGroupName $ResourceGroup -TemplateFile $TemplateFile -TemplateParameterFile $TemplateParameterFile
```

and then called it from a `PowerShell` task in Azure Pipelines with:

```yaml
- task: AzurePowerShell@5
  displayName: Deploy Storage Infrastructure to $(BackupResourceGroup)
  inputs:
    azureSubscription: '<REDACTED>'
    ScriptType: 'FilePath'
    ScriptPath: 'ndwstorage/ndwstorage/Deploy.ps1'
    ScriptArguments: '-ResourceGroup $(BackupResourceGroup) -Location $(SecondaryLocation) -TemplateFile azuredeploy.bicep -TemplateParameterFile azuredeploy.$(Environment).parameters.json'
    FailOnStandardError: true
    azurePowerShellVersion: 'LatestVersion'
    pwsh: true
    workingDirectory: 'ndwstorage/ndwstorage' 
```

This all works great. When the `AzureResourceManagerTemplateDeployment` task supports bicep I may switch it back. However the PowerShell method **does not work** for Microsoft-Hosted agents.

### Steps for Microsoft-Hosted Agents

I thought I'd try with a Microsoft-Hosted Agent but this made me realize I'm getting a little bit ahead of myself. I ran into multiple problems with tooling not supporting bicep as yet.

#### bicep not installed

Bicep is not installed on the Hosted VMs. Not a big deal, so I wrote an installer:

```powershell
# initialise
$source = "https://github.com/Azure/bicep/releases/latest/download/bicep-setup-win-x64.exe"
$downloadPath =  (New-Object -ComObject Shell.Application).NameSpace('shell:Downloads').Self.Path # robust Downloads folder
$bicepinstaller = "$downloadPath\bicep-setup-win-x64.exe"
$bicepPath = "$env:LOCALAPPDATA\Programs\Bicep CLI"

# download installer
Invoke-WebRequest -Uri $source -OutFile $bicepinstaller

# install bicep
Start-Process -FilePath $bicepinstaller -ArgumentList "/VERYSILENT" -Wait -NoNewWindow

# add to PATH for current environment
if (-not $env:path.Contains($bicepPath)) { $env:path += ";$bicepPath" }

# check installed OK
bicep --version
```

I wasn't happy with this though because there's lots of extra code to maintain, and there were issues between tasks where PowerShell could not find the bicep executable, despite me adding it to the PATH.

#### Az module version

The Az module version to support bicep must be 5.6 or later. However the [latest Windows Microsoft-Hosted agent VM](https://github.com/actions/virtual-environments/blob/main/images/win/Windows2019-Readme.md) only has 5.5. I did spend some time trying to coerce it into installing a later verison with `Install-Module`, `Update-Module`, `Install-Package` etc,  but I didn't get very far. I didn't get any errors with installing the module, but bicep threw an error:

`##[error]Unexpected character encountered while parsing value: @. Path '', line 0, position 0.
##[error]PowerShell exited with code '1'.`

I even put some debug code in to check and it all looked fine, but the deployment failed.

# Use a Linux Microsoft-Hosted Agent

I then decided to have a go at using a Linux VM. The best way to use bicep in Linux was to use the [Azure Cli](https://docs.microsoft.com/en-us/cli/azure/), something I don't normally use, as a PowerShell user.

So, in Azure Pipelines I created a task like this:

```yaml
- task: AzureCLI@2
  displayName: Deploy storage accounts
  inputs:
    azureSubscription: '<REDACTED>'
    scriptType: 'pscore'
    scriptLocation: 'inlineScript'
    inlineScript: 'az deployment group create --resource-group $(BackupResourceGroup) --template-file azuredeploy.bicep --parameters azuredeploy.$(Environment).parameters.json'
```

Lo and behold, it worked! Azure Cli will automatically download bicep if it's not found: perfect for a Microsoft-Hosted VM where bicep isn't supported yet!

## Conclusion as of April 2021

I know this blog post will go out of date pretty quickly but at the time of writing I would say the best route for deploying Azure resources using bicep in a pipeline is to use the `AzureCLI` task and it works fine in both Windows and Ubuntu (I tested both with identical code).

Bicep seems to make ARM templates much easier to read and maintain and is certainly much less pain. It is also easy to convert existing ARM templates *to a starting point*, and does quite a good job, however some hand tweaking after will be needed.

Give bicep a try.
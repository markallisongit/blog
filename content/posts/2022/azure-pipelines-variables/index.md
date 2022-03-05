---
title: "Where to store Azure Pipelines Variables?"
date: 2022-03-04T07:30:29Z
draft: false
author: Mark
tags: [azure, devops, azure-pipelines]
lightgallery: true
---
## Question

Where should variables be stored for deploying *infrastructure-as-code* in Azure DevOps pipelines to Azure? Resources need to be deployed to different regions and environments, and attributes for these need to be stored somewhere.

## Options

Six options spring to mind.

1. **[Parameter files](https://docs.microsoft.com/en-us/azure/azure-resource-manager/templates/parameter-files)**. Seems like the obvious choice.
1. **[Template file defaults](https://docs.microsoft.com/en-us/azure/azure-resource-manager/templates/parameters#default-value)** in `azuredeploy.json` or `main.bicep`
1. **[Azure DevOps Library](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/variable-groups?view=azure-devops&tabs=yaml)** variable groups. Seems good, a single place
1. **[Azure Pipelines variables](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/variables?view=azure-devops&tabs=yaml%2Cbatch)** in individual pipelines
1. **[Configuration file](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/bicep-functions-files#loadtextcontent)** within the project source code
5. **[Runtime parameters](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/runtime-parameters?view=azure-devops&tabs=script)** for setting values at run time

Let's go through each option and then discuss my preferred approach.

### Parameter files

Rather than hard coding values in your template file, the values can be placed in a separate parameter file and looked up during deployment. They have the following format.

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "<first-parameter-name>": {
      "value": "<first-value>"
    },
    "<second-parameter-name>": {
      "value": "<second-value>"
    }
  }
}
```

:(fas fa-plus-circle): Good for

* Simple environments
* Clean code
* Store different sets of values for different environments or regions

:(fas fa-minus-circle): Not so good for

* Secrets, because parameter files are plain text
* Values that repeat across different regions or environments. We should update in one place.
* Variables that are used across multiple pipelines

### Template File defaults

Each parameter in a bicep or ARM template can accept a default. The default value is used when a value isn't provided during deployment. They look like this in bicep

```bicep
@description('The instance collation')
param collation string = 'Latin1_General_CI_AS'
```

They look like this in ARM

```json
"parameters": {
  "collation": {
    "type": "string",
    "defaultValue": "Latin1_General_CI_AS",
    "metadata": {
        "description": "The instance collation"
      }
  }
}
```

In this example I know that all SQL instances that I deploy will use the collation `Latin1_General_CI_AS`, so I shouldn't put this in all my parameter files because if I want to change it in the future I would have to update it in multiple places.

:(fas fa-plus-circle): Good for

* Reducing clutter in parameter files
* Providing a default, but also allowing flexibility to override in parameter files
* Providing expressions in defaults. e.g. `param location string = deployment().location`

:(fas fa-minus-circle): Not so good for

* Values that change between deployments
* Values that need to be shared across pipelines
* Secrets, because they are plain text

### Azure DevOps Library

Variable groups in Azure DevOps Library store values and secrets that you might want to be passed into a YAML pipeline or make available across multiple pipelines. You can share and use variables groups in multiple pipelines in the same project like this in Azure Pipelines YAML.

```yaml
variables:
- group: my-variable-group
```

:(fas fa-plus-circle): Good for

* Sharing values across multiple Azure Pipelines
* A golden source for initial population of key vault secrets

:(fas fa-minus-circle): Not so good for

* Portability. What if you want to move to a different CI/CD tool?
* Source controlling variables
* Visibility, they are hidden away

### Azure Pipelines variables

I haven't really found a use for these except for testing. I prefer to use parameter files for Azure resources or [Runtime parameters](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/runtime-parameters?view=azure-devops&tabs=script). Pipeline variables are more commonly used when building executable code, with the `MSBuild` task, for example.

```yaml
# Set variables once
variables:
  configuration: debug
  platform: x64

steps:

# Use them once
- task: MSBuild@1
  inputs:
    solution: solution1.sln
    configuration: $(configuration) # Use the variable
    platform: $(platform)

# Use them again
- task: MSBuild@1
  inputs:
    solution: solution2.sln
    configuration: $(configuration) # Use the variable
    platform: $(platform)
```

:(fas fa-plus-circle): Good for

* Testing out some YAML code for your pipeline
* Deploying executable code

:(fas fa-minus-circle): Not good for

* Reusing variables across pipelines
* Secrets

### Config files

Since bicep introduced the ability to [read files in JSON format](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/bicep-functions-files#loadtextcontent), it is possible to put variables in one place. e.g. `var mySettings = json(loadTextContent('settings.json'))`

:(fas fa-plus-circle): Good for

* Bicep templates
* PowerShell scripts
* Single place for all variables across environments and regional deployments
* Reusing variables across pipelines
* Source controlling variables
* Using the same code for interactive development/debugging and production code. Reading DevOps library interactively is a pain

:(fas fa-minus-circle): Not good for

* Secrets
* Requires extra code to read the config file
* ARM templates

### Azure Pipelines runtime parameters

runtime parameters let you have more control over what values can be passed to a pipeline at the time of execution. With runtime parameters you can:

* Supply different values to scripts and tasks at runtime
* Control parameter types, ranges allowed, and defaults
* Dynamically select jobs and stages with template expressions

:(fas fa-plus-circle): Good for

* Choosing which environments to deploy to at runtime
* Choosing a region to deploy to at runtime
* Prompting for secrets (removes the CI/CD element though)

:(fas fa-minus-circle): Not good for

* Variables across pipelines
* Automation, although defaults can be set
* General variables
* Variables that don't need to be changed at runtime

## My approach

I use a combination of

1. Runtime parameters
1. Parameter files
1. Template file defaults
1. JSON settings files (for bicep)
1. Azure DevOps library for initial key vault secrets

I don't use pipeline variables.

### Example runtime parameters

These are great for situations where you need to deploy to different environments or regions at runtime.

In `azurepipelines.yml` file, this can be done:

```yaml
parameters:
- name: location
  displayName: Region
  type: string    
  default: uksouth
  values:
    - ukwest
    - uksouth
    - westeurope
    
- name: deployTestStage
  displayName: Deploy to TEST
  type: boolean
  default: true

- name: deployProdStage
  displayName: Deploy to PROD
  type: boolean
  default: true
```

It looks like this in Azure DevOps:

{{< image src="2022-03-05_11-58-04.jpg" caption="Specifying values at runtime" >}}

### Example parameter files

I use parameter files for values that I know are *only used by a single pipeline*, but that value could change depending on the region or environment it's deployed to. I might have `test.parameters.json` and `prod.parameters.json` or `uksouth.test.parameters.json`, etc.

```json
"parameters": {
    "auditHouseKeepDays": {
        "value": 14
    },    
    "backupHouseKeepDays": {
        "value": 14
    }
}
```

### Example template file defaults

I generally use template file defaults for `location` and timestamping.

```bicep
@description('The location.')
param location string = deployment().location

@description('Suffix to make deployment names unique')
param deploymentNameSuffix string = utcNow()
```

### Example JSON settings file

Most of my variables go in here that are used across pipelines for a project, department or organization.

```json
{
    "prod": {
        "ownerTag": "product.owner@org.uk",
        "PITRDays": 35,
        "protectWithLocks": true,
        "uksouth": {
            "vnetName": "my-prod-uksouth-vnet",
            "vnetResourceGroup": "my-prod-uksouth-rg"
        },
        "ukwest": {
            "vnetName": "my-prod-ukwest-vnet",
            "vnetResourceGroup": "my-prod-ukwest-rg"
        }
    },
    "test": {
        "vmAutoShutdownTime": "20:00",
        "ownerTag": "developer.name@org.uk",
        "PITRDays": 7,
        "protectWithLocks": false,
        "uksouth": {
            "vnetName": "my-test-uksouth-vnet",
            "vnetResourceGroup": "my-test-uksouth-rg"
        },
        "ukwest": {
            "vnetName": "my-test-ukwest-vnet",
            "vnetResourceGroup": "my-test-ukwest-rg"
        }
    },
    "common": {
        "adminUserName": "myadminaccount",
        "objectIdAADAdmins": "ddd1a284-0acd-4462-a6b8-815cbf8faea5",
        "objectIdDevOpsPrincipal": "20e7e510-041c-4e7f-a9b8-f18f846c7e69",
        "projectTag": "My project",
        "subscriptionName": "The name of my Azure subscription",
        "sysadminAccountList": [
            "deploy",
            "admin"
        ]
    }
}
```

This file can then be read by bicep, PowerShell, or whatever in your scripts. For example:

```bicep
// main.bicep
var settings = json(loadTextContent('config/settings.json'))
var tags = {
  'Owner': settings[environment].ownerTag
  'Project': settings.common.projectTag
  'Env': environment
  'Description': 'A general description'
}
```

```powershell
# Configure.ps1
$settings = Get-Content config/settings.json -Raw | ConvertFrom-Json
$vnet = $settings.$Environment.$Location.vNetName
```

### Example Azure DevOps Library

If you have some secrets that need to be deployed more than once, then it's best to put them in Azure DevOps libray and then add the secrets to a Key Vault deployment.

It looks like this where we have a secret called `deployPassword`

{{< image src="2022-03-01_14-24-28.jpg" caption= "Storing initial key vault secrets" >}}

The password can then be stored in an Azure Pipeline like so on Line 9:

```yaml
- task: AzurePowerShell@5
  displayName: Deploy Key vaults and secrets
  inputs:
    azureSubscription: 'my subscription (248745da-341c-4485-9e69-ef2000b536f7)'
    ScriptPath: secrets/Deploy.ps1
    ScriptArguments: 
      -Environment ${{ parameters.environment }} `
      -Location ${{ parameters.location }} `
      -deployPassword $(deployPassword)
    azurePowerShellVersion: LatestVersion    
    pwsh: true
    workingDirectory: secrets
```

## Summary

For my environment I prefer to use

* **Azure DevOps Library** for initial secrets to be stored in a new key vault.
* **JSON settings files** for variables that need to be used across multiple pipelines, regions or environments. This is so they can be source controlled.
* **Parameter files** for pipelines that don't share attributes with any other pipeline. Also source controlled.
* **Parameter defaults** for system functions, e.g. `utcNow()`, `deployment().location` and `resourceGroup().location`

## References

* [Parameter files](https://docs.microsoft.com/en-us/azure/azure-resource-manager/templates/parameter-files)
* [Template file defaults](https://docs.microsoft.com/en-us/azure/azure-resource-manager/templates/parameters#default-value)
* [Azure DevOps Library](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/variable-groups?view=azure-devops&tabs=yaml)
* [Azure Pipelines variables](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/variables?view=azure-devops&tabs=yaml%2Cbatch)
* [Configuration file](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/bicep-functions-files#loadtextcontent)
* [Runtime parameters](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/runtime-parameters?view=azure-devops&tabs=script)
* [Bicep: Read files in JSON format](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/bicep-functions-files#loadtextcontent)
---
title: "Where to store Azure Pipelines Variables?"
date: 2022-02-28T09:30:29Z
lastmod: 2022-02-28T09:30:29Z
draft: false
author: Mark
tags: [azure, devops, azure-pipelines]
lightgallery: false
---
## Question

Where should variables be stored for deploying infrastructure-as-code in Azure DevOps pipelines? Resources need to be deployed to different regions and environments.

## Options

Five options spring to mind.

1. **[Parameter files](https://docs.microsoft.com/en-us/azure/azure-resource-manager/templates/parameter-files)**. Seems like the obvious choice.
1. **[Azure DevOps Library](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/variable-groups?view=azure-devops&tabs=yaml)** variable Groups. Seems good, a single place
1. **[Pipeline variables](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/variables?view=azure-devops&tabs=yaml%2Cbatch)** in individual pipelines
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

✔ Good for

* Simple environments
* Clean code
* Store different sets of values for different environments or regions

❌ Not so good for

* Secrets, because parameter files are plain text
* Values that repeat across different regions or environments. We should update in one place.
* Variables that are used across multiple pipelines

### Azure DevOps Library

Variable groups store values and secrets that you might want to be passed into a YAML pipeline or make available across multiple pipelines. You can share and use variables groups in multiple pipelines in the same project.

```json
variables:
- group: my-variable-group
```

✔ Good for

* Sharing values across multiple Azure Pipelines
* A golden source for secrets when needing to deploy key vaults

❌ Not so good for

* Portability, what if you want to move to Octopus Deploy?
* Source controlling variables
* Visibility, they are hidden

### Pipeline variables

I haven't really found a use for these except for testing. I prefer to use parameter files for Azure resources or [Runtime parameters](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/runtime-parameters?view=azure-devops&tabs=script). These will be more commonly used when building Visual Studio projects.

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

✔ Good for

* Testing out some YAML code for your pipeline
* Deploying code that is not Azure infrastructure-as-code

❌ Not good for

* Reusing variables across pipelines
* Secrets

### Config files

This is my favoured approach for variables across pipelines.

### Runtime parameters

Runtime parameters let you have more control over what values can be passed to a pipeline. With runtime parameters you can:

* Supply different values to scripts and tasks at runtime
* Control parameter types, ranges allowed, and defaults
* Dynamically select jobs and stages with template expressions
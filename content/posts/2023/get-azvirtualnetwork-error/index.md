---
title: "Troubleshooting Get-AzVirtualNetwork"
date: 2023-01-16T12:15:23Z
lastmod: 2023-01-16T12:15:23Z
draft: false
author: Mark
tags: [azure, powershell, troubleshooting, networking]
lightgallery: false
---

Are you encountering the following error message when working with Azure in PowerShell and running the command Get-AzVirtualNetwork?

```Get-AzVirtualNetwork: GenericArguments[0], 
'Microsoft.Azure.Management.Network.Models.SecurityRule', 
on 'T MaxInteger[T](System.Collections.Generic.IEnumerable`1[T])' 
violates the constraint of type 'T'.
```

This error can be caused by an incompatibility between PowerShell 7 and the `Az` Module and [incompatibilty with .NET 7](https://github.com/Azure/azure-powershell/issues/18721). To fix this issue, try the following steps:

1. Upgrade to the latest versions of PowerShell 7 and the Az module.

1. If the issue persists, remove all versions of the Az Module on your system by using the command `Uninstall-Module Az -AllVersions`.

1. Examine your module paths by using `$env:PSModulePath -split ';'`. This will show you all the paths to PowerShell modules. Manually remove any Az modules from those paths.

1. Finally, reinstall the Az module again using PowerShell 7 *as Administrator* using the command `Install-Module Az -Scope AllUsers`

This should resolve the issue and get your Azure PowerShell scripts running smoothly again.

Hope this helps!
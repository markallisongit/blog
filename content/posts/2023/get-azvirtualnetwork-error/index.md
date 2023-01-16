---
title: "Troubleshooting Get-AzVirtualNetwork"
date: 2023-01-16T12:15:23Z
lastmod: 2023-01-16T12:15:23Z
draft: false
author: Mark
tags: [azure, powershell, troublshooting ]
lightgallery: false
---

Are you working with Azure in PowerShell and encountering the following error message when running the command Get-AzVirtualNetwork?

```Get-AzVirtualNetwork: GenericArguments[0], 
'Microsoft.Azure.Management.Network.Models.SecurityRule', 
on 'T MaxInteger[T](System.Collections.Generic.IEnumerable`1[T])' 
violates the constraint of type 'T'.
```

This error can be caused by an incompatibility between PowerShell 7.1.3 and the Az Module. Updating to the latest version of the Az module may not always fix the issue.

One possible solution is to remove all versions of the Az Module by using the following command:

```powershell
Uninstall-Module Az -AllVersions
```

Then, examine your module paths by using `$env:PSModulePath -split ';'`. This will show you all the paths to PowerShell modules. Manually remove any Az modules from those paths.

Finally, reinstall the Az module again using PowerShell 7 as Administrator using the command `Install-Module Az -Scope AllUsers`. This should resolve the issue and get your Azure PowerShell scripts running smoothly again.

Hope this helps!
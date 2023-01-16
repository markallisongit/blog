---
title: "Troubleshooting Get-AzVirtualNetwork"
date: 2023-01-16T12:15:23Z
lastmod: 2023-01-16T12:15:23Z
draft: true
author: Mark
tags: []
lightgallery: false
---
If you're working with Azure in PowerShell, you may have encountered the following error message when running the command Get-AzVirtualNetwork:

```
Get-AzVirtualNetwork: GenericArguments[0], 
'Microsoft.Azure.Management.Network.Models.SecurityRule', 
on 'T MaxInteger[T](System.Collections.Generic.IEnumerable`1[T])' 
violates the constraint of type 'T'.

```

This occurred because I of an incompatibility between PowerShell 7.1.3 and the Az Module. Updating to the latest version of the Az module did not fix the issue.

I removed all versions of the Az Module by first listing where they all were with `Get-Module Az -ListAvailable` and then removing them with `Uninstall-Module Az -AllVersions`.

After examining my module paths using `$env:PSModulePath -split ';'` I found all the paths to PowerShell modules and manually removed Az modules from those paths.

I then reinstalled the Az module again with `Install-Module Az -Scope AllUsers` and now it's working fine again. Hope it helps!

---
title: "Powershell What-If"
date: 2022-01-26T09:59:06Z
lastmod: 2022-01-26T09:59:06Z
draft: false
author: Mark
tags: [powershell]
lightgallery: false
---

What if you could do a dry run of some PowerShell when making a change to your production environment?

If you've read my other posts, you will know I am a big advocate of *infrastructure-as-code*. Most of my work is done in the Microsoft Azure cloud, and although I encourage source controlling all assets within Azure, sometimes developers create things manually through the portal.

Yes, I know! 🙄

## Removing Azure Resources safely

A scheduled drift report should alert developers or DevOps engineers that the production state is out-of-sync with the source controlled code. If this happens, and some resources need removing, then the `What-If` switch comes in handy and provides confidence to remove items in production that shouldn't be there.

### SQL DBAs know

SQL DBAs will know that when making changes to production data, this can be safer if always using `BEGIN TRANSACTION` when making updates, or deletes to production data, checking it and then issuing `COMMIT`. Bearing in mind, of course, that the data is locked until the `COMMIT` is issued. If the data looks wrong, or a mistake was in the code, just press `CTRL-Z`, I mean `ROLLBACK TRAN`.

### Azure

`-WhatIf` allows us to see what changes a script will make before running it.

> "Why not use Bicep or ARM templates?" I hear you cry

My preference is to use the Incremental deployment method so that resources are never deleted with declarative code, only changed or added. This gives another level of protection from removing resources that need to maintain state, e.g. databases, virtual machines, storage accounts.

## Practical example

Let's suppose we have four storage accounts, but two of them are no longer used, or were created in error, and we need to remove them. Here's some code as a test, if you want to follow along.

```PowerShell
# set up some variables
$ResourceGroup = 'marktest-rg'
$Location = 'uksouth'

# create a resource group and store the info in a variable
$rg = New-AzResourceGroup -Name $ResourceGroup -Location $Location

# create four storage accounts
for ($i=1; $i -le 4; $i++) {
    New-AzStorageAccount -ResourceGroupName $ResourceGroup `
    -Name "marktestsa$($i)" `
    -SkuName 'Standard_LRS' `
    -Location $rg.Location
}
```

We now have four storage accounts, but want to remove the two named `marktestsa3` and `marktestsa4` safely and without using the portal.

![Azure Portal](2022-01-26_10-22-36.png)

To test our delete code we can simply add the `-WhatIf` switch, to ensure that we are deleting the correct accounts and there are no bugs in our logic.

```PowerShell
# remove the last two storage accounts, but do a "dry run" first
for ($i=3; $i -le 4; $i++) {
    Remove-AzStorageAccount -ResourceGroupName $ResourceGroup `
    -Name "marktestsa$($i)" `
    -WhatIf
}
```

You should see output similar to this:

![WhatIf](2022-01-26_10-37-36.png)

That looks fine, so the `-WhatIf` switch can now be removed in the actual command.

```PowerShell
# looks good, let's do it for real
for ($i=3; $i -le 4; $i++) {
    Remove-AzStorageAccount -ResourceGroupName $ResourceGroup `
    -Name "marktestsa$($i)" `
    -Force
}
```

A quick check shows that all is well.

```PowerShell
Get-AzResource -ResourceGroupName $ResourceGroup | ft -AutoSize
```

```text
Name        ResourceGroupName ResourceType                      Location
----        ----------------- ------------                      --------
marktestsa1 marktest-rg       Microsoft.Storage/storageAccounts uksouth
marktestsa2 marktest-rg       Microsoft.Storage/storageAccounts uksouth
```

## Habit

Make this a habit if you find yourself needing to script destructive changes in a production environment as part of a housekeeping exercise, for example.

Happy Scripting!
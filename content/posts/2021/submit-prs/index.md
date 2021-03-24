---
title: "Submit PRs"
date: 2021-03-24T10:58:39Z
lastmod: 2021-03-24T10:58:39Z
draft: false
author: Mark
tags: [pull-request,contribution]
categories: [contribution]
lightgallery: true
---
## Found an error in Microsoft documentation?

Submit a pull request! 

Much of the Microsoft documentation is open source on GitHub which means that if you spot an error in either the code examples, the grammar, spelling, a typo or copy-and-paste error, you can quickly fix it and people reading the docs after you will benefit. This is such a difference from when I started using Microsoft products back in the 90s where nothing was open source and all documentation was either in a printed manual or a [chm file](https://en.wikipedia.org/wiki/Microsoft_Compiled_HTML_Help).

## Contributor guide

Microsoft have published a [contributor guide](https://docs.microsoft.com/en-us/contribute/) on the best way to help improve the documentation. Have a review of it before contributing your own changes to the documentation sets. Quite often a contribution can be done right there and then in the browser using the GitHub Edit feature.

{{< image src="2021-03-24_11-18-28.png" caption="Edit the Microsoft docs" >}}

## Example

I came across a copy-and-paste bug in the PowerShell module documentation for the command `Invoke-AzSqlInstanceFailover` in module `Az.Sql` which will manually failover a Managed Instance to another node in the Virtual Cluster. I forked [the page](https://docs.microsoft.com/en-us/powershell/module/az.sql/invoke-azsqlinstancefailover) to my repo, made the change and [submitted a PR](https://github.com/Azure/azure-powershell/pull/14603). Within a day or so, Microsoft reviewed the change and merged it into master.

Quick and easy, you should try it too and make the documentation better for everyone. :smile:


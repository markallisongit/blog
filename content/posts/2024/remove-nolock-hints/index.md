---
title: "Script to Remove NOLOCK Hints"
date: 2024-09-06T13:25:32+01:00
lastmod: 2024-09-06T13:25:32+01:00
draft: false
author: Mark
tags: [Sql-Server, Powershell]
lightgallery: false
---

# The problem

Recently, I was performance tuning and enhancing the reliability of several databases for a client and discovered `NOLOCK` hints everywhere. Why are these bad, they seem to improve performance and remove blocking for most queries?

## 1. Dirty reads

This allows data to be read that is currently being modified by another query leading to inconsistent results. If a row that has been read gets rolled back because of an error like a deadlock, or network issue, the data never existed!

## 2. Non-repeatable reads

Data might get read but during the query, another transaction modifies the row that you read to a different value. If the data is read again in the same query, it will be different.

## 3. Phantom reads

Phantom reads happen when new rows are inserted or existing rows are deleted by another transaction while the query is running. A query using `NOLOCK` might encounter these phantom rows, causing unexpected or inconsistent results.

## 4. Other nastiness

In rare circumstances corrupted data could be read from partially modified rows that are being updated by another transaction resulting in logical inconsistencies. This can also occur on index pages, not just leaf pages.

# The solution

Yes, you guessed it, Read Committed Snapshot Isolation.

However, once this has been switched on for a database, the NOLOCK hints still remain which means SQL Server will still not honour some locks. This means that the problem is still present. The NOLOCK hints need to be removed from the entire database.

## Powershell script to remove NOLOCK

I wrote a [PowerShell 7 script](https://github.com/markallisongit/Scripts/blob/main/PowerShell/GenerateNOLOCKRemovalScripts.ps1)
 to generate Deploy and Revert SQL Scripts to remove NOLOCK hints for all tables and views in a database. [Download here](https://github.com/markallisongit/Scripts/blob/main/PowerShell/GenerateNOLOCKRemovalScripts.ps1). If for some reason the script does something horrible, each object is scripted out into a **revert** script so changes can be undone.

{{< admonition warning "Test first!" false >}}
Ensure you back up your database or test on a copy first.
{{< /admonition >}}

Hope it helps save you some time!
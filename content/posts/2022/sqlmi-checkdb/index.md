---
title: "SQLMI Checkdb?"
date: 2022-02-15T13:33:58Z
lastmod: 2022-02-15T13:33:58Z
draft: false
author: Mark
tags: [azure, ]
lightgallery: false
---
As a standard practise for IaaS and on-premises SQL Servers, I usually like to install [Ola Hallengren's maintenance scripts](https://ola.hallengren.com/sql-server-integrity-check.html). Why invent the wheel when we already have a super-shiny one? These scripts include integrity checks, which run DBCC CHECKDB.

## Is DBCC CHECKDB needed anymore?

I have been working with Sql Managed Instances quite closely over the past couple of years and wondered whether DBCC CHECKDB needs to be run at all. The whole point of CHECKDB is to be able to *do something* if the pages are corrupt. If we can't do anything about it, except for calling Microsoft or restoring from point-in-time log backups, then why bother with it? They are very I/O intensive operations which can impact the server.

## The good ol' days

Back in the day when we had to install SQL Server from a pile of floppies, we installed SQL Server onto magnetic spinning disks. I am well aware that I'm in a shrinking group of people that have had the pleasure of this experience,

{{< image src="CzKiKWCVQAAH7KQ.jfif" caption="SQL Server 4.2 on 4 floppies! Source: Bob Ward" >}}

Modern SSDs aren't fool-proof but they tend to be much more reliable than spinning disks. Years ago in large data centers, failure was a regular occurrence. It made sense back then to check the database for corruption and attempt to fix it.

Database sizes were relatively small compared to today so integrity checks didn't take long to run.

On a modern SQL Server, it is common to see instances with 10s or 100s of TB on them backed by SSD storage, and probably in an Availability Group.

## PaaS

Most general pupose relational databases in Azure are now running on Azure Sql Database or Azure Sql Managed Instances. The management of these databases is largely taken care of for you, so you are free to develop your app and not worry about boring stuff like backups and maintenance.

When running DBCC CHECKDB, if a repair is required, then the database needs to be in single-user mode. Azure Sql Database and SQLMI does not support single-user mode, so the repair cannot be done by a non-Microsoft person.

## Recommendations

### Azure Sql Database

* Remove your DBCC CHECKDB jobs. [Microsoft manages this](https://azure.microsoft.com/en-gb/blog/data-integrity-in-azure-sql-database/) for you.

### Azure Sql Managed Instance

* Switch off your DBCC CHECKDB jobs for non-mission critical databases.
* Use DBCC CHECKDB WITH PHYSICAL_ONLY for larger databases.
* For smaller mission-critical databases use the full DBCC CHECKDB to make sure all logical structures are checked too.

If errors are detected, initiate a RESTORE ASAP.

### Azure/AWS Cloud Sql VM and On-Premises SQL Server

Use `DBCC CHECKDB WITH PHYSICAL_ONLY` for larger DBs where the check process is interfering with your maintenance window. Continue to use DBCC CHECKDB for smaller databases where you have a comfortable period of low activity to run it.

## References

https://azure.microsoft.com/en-gb/blog/data-integrity-in-azure-sql-database/

https://twitter.com/bobwardms/status/806885734087098368

https://docs.microsoft.com/en-us/sql/t-sql/database-console-commands/dbcc-checkdb-transact-sql

https://ola.hallengren.com/sql-server-integrity-check.html

https://www.brentozar.com/archive/2020/08/3-ways-to-run-dbcc-checkdb-faster/
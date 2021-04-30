---
title: "MI Exceeds Storage Account Size"
date: 2021-04-30T14:05:11+01:00
lastmod: 2021-04-30T14:05:11+01:00
draft: false
author: Mark
tags: [azure, sql-managed-instance ]
lightgallery: false
---
## Don't create too many files!

I had an interesting issue today, where I'm trying to improve concurrency in our data warehouse by using partitioning for database loads. For this data feed, the warehouse is loaded once per month, and it makes sense to partition the data monthly. This will allow monthly data loads into a staging table and then SWITCH partition without SQL Server escalating to table locks.

## Snapshot isolation

Another way to improve concurrency is to use Snapshot Isolation. As you know, this isolation level requires heavy use of tempdb. However, when using a Managed Instance (General Service Tier), there is no control over the size of tempdb except for increasing the number of vCores you are using at a rate of 24 GB/vCore. For this reason we have stayed away from this solution.

## The problem

When creating files for the filegroups in the monthly partition scheme, I got this error:

```
Msg 5009, Level 16, State 1, Line 619
One or more files listed in the statement could not be found or could not be initialized.
Managed Instance has reached the total capacity of underlying Azure storage account. Azure Premium Storage account is limited to 35TB of allocated space.
```

Puzzling because we are only using 3 TB out of the maximum 8 TB allowed for a General Service Tier Managed Instance. I contacted Microsoft to find out what was going on.

## Pre-defined database file sizes

According to [this article](https://techcommunity.microsoft.com/t5/azure-sql/reaching-azure-disk-storage-limit-on-general-purpose-azure-sql/ba-p/386234), as pointed out to me from Microsoft Support, the data file sizing is allocated according to a crude formula with data files only able to support these sizes:

128GB, 512GB, 1TB, 2TB, and 4TB

If you have a database that only has a few hundred megabytes in it, Azure will allocate you 128GB of space whether you like it or not, and cap the amount of space that can be used at 35TB. This means on a Managed Instance General Service Tier you can have a maximmum file count of 280 database files, if they are all under 128GB.

This makes partitioning and data warehouse loading on a Managed Instance problematic.

## Solutions

So what are the options for a solution?

### Migrate to IaaS

A migration to a standard SQL Server on a VM where full control of storage and CPU resources gives the maximum flexibility at the cost of higher administration overhead. There is also a cost to migrate the instance over to IaaS. There is also a loss of the built-in High Availability that a Managed Instance provides.

### Upgrade to Business Critical Tier?

The Business Critical Tier is really focused on low latency storage and the storage limits for this tier is lower than for the General Tier. In order to get 4 TB of storage the minimum number of vCores is 32, making this option not viable economically.

### Create another General Tier Managed Instance

Another option is to create groups of databases that depend on each other (we have a fair amount of cross-database queries) and create another Managed Instance for larger databases that do not have dependencies.
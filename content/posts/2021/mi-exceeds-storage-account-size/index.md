---
title: "Minimum data file size on MI is 128 GB!"
date: 2021-05-10T17:15:11+01:00
lastmod: 2021-05-10T17:15:11+01:00
draft: false
author: Mark
tags: [azure, sql-managed-instance ]
lightgallery: false
---
## Storage underlying a Managed Instance

Microsoft Azure should not require you to have deep understanding of the underlying technologies used to provide the service, after all the whole point of PaaS is to abstract you away from implementation details. One of these details is storage of data files in the file system.

When provisioning a General Tier Sql Managed Instance, the maximum storage size for the instance is capped at 8 TB. However this is not the whole story and it's important to understand some of what is happening under the covers, especially if you are migrating an on-premises SQL Server instance to the cloud that contains a lot of databases or uses partitioning.

## Limits

Let's briefly go through the limitations and why you need to know. Microsoft have a page on [this here](https://docs.microsoft.com/en-us/azure/azure-sql/managed-instance/resource-limits). Recommended reading!

The figures below are correct at the time of publishing in May 2021.
### Instance storage limit

As mentioned above, the limit for the General Tier is 8 TB added up across all databases. For 4 vCores the limit is 2 TB.

### Max tempdb database size

This depends on the number of vCores provisioned and is 24 GB/vCore.

e.g. 8 vCore MI will give you 192 GB tempdb, 16 vCore will give you 384 GB tempdb, etc. Tempdb Log file size is limited to 120 GB.

### Max number of databases

100 user databases, unless the instance storage limit has been reached. More on this, it's more detailed than that and also limited by the number of database files.

### Max number of database files

280 OR the Azure Premium disk storage allocation space. 

> This is the important one to understand. 

When a database file is allocated space in Azure it is done to a formula which impacts the IOPS performance but also space.

According to [this article](https://techcommunity.microsoft.com/t5/azure-sql/reaching-azure-disk-storage-limit-on-general-purpose-azure-sql/ba-p/386234), the data file sizing is allocated according to a crude formula with data files only able to support these sizes:

128GB, 512GB, 1TB, 2TB, and 4TB

If you have a database that only has a few hundred megabytes in it, Azure will allocate you 128GB of space for the data file whether you like it or not, and cap the amount of space that can be used at 35TB. This means on a Managed Instance General Service Tier you can have a maximum file count of 280 database files, **if** they are all under 128GB.

This makes partitioning and data warehouse loading on a Managed Instance problematic. Shouldn't be an issue if you have a large warehouse as you should be on Synapse Analytics anyway.

## The real-world problem

When creating files for the filegroups in a partition scheme, this error will occur if you have used up the 35 TB Azure Storage account space.

```
Msg 5009, Level 16, State 1, Line 619
One or more files listed in the statement could not be found or could not be initialized.
Managed Instance has reached the total capacity of underlying Azure storage account. Azure Premium Storage account is limited to 35TB of allocated space.
```
## Solutions

So what are the options for a solution?

### Migrate from PaaS to IaaS

A migration to a standard SQL Server on a VM where full control of storage and CPU resources gives the maximum flexibility at the cost of higher administration overhead. There is also a cost to migrate the instance over to IaaS. There is also a loss of the built-in High Availability that a Managed Instance provides. This feels like a backwards step because the main benefits of the cloud are easier administration and flexibility.

### Migrate to Azure Synapse Analytics

If the Managed Instance is being used to host a migrated data warehouse, then consider moving to Azure Synapse Analytics instead, there are many things to consider by migrating to this solution outside of this article (something for another day).

### Upgrade to Business Critical Tier?

The Business Critical Tier is really focused on low latency storage and the storage limits for this tier is lower than for the General Tier. In order to get 4 TB of storage the minimum number of vCores is 32, making this option not viable.

### Create another General Tier Managed Instance

Another option is to create groups of databases that depend on each other and create another Managed Instance for larger databases that do not have dependencies. These instances can reside in the same Virtual Cluster.

### Remove paritioning and use Snapshot Isolation

Test data warehouse loads using snapshot isolation instead of partition switching. As mentioned above, the size of `tempdb` is limited by the number of vCores you have provisioned. For large data warehouse loads, the MI could be scaled up for a load, and then scaled back down again afterwards.

## Conclusion

Azure Sql Managed Instance brings lots of benefits offering greater security, less management, disaster recovery, high availability, but this comes at a cost of less flexibility and storage scale. Keep in mind the database file number limits, and that the smallest can only be 128 GB, and also tempdb is limited by the number of vCores allocated.
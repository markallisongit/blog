---
title: "EXECUTE denied on Managed Instance"
date: 2021-03-17T12:20:04Z
draft: false
author: "Mark"
tags: ["azure","sql-managed-instance","ssms"]
categories: ["azure"]
lightgallery: true
featuredImagePreview: featured-image.jpeg
featuredImage: featured-image.jpeg
---
## The problem 

I came across an interesting (!) issue with an Azure Sql Managed Instance today. One of our users came across this error when trying to `SELECT` from a view in a database where they are not a member of the `db_owner` database role or any elevated server-level permission by right clicking the view in SSMS 18.8 and choosing **Select Top 1000 Rows**.

{{< image src="2021-03-17_11-40-04.png" caption="Select Top 1000 Rows in SSMS" >}}

{{< image src="2021-03-17_11-40-44.png" caption="EXECUTE denied on xp_instance_reg_read in mssqlsystemresource" >}}

The full text of the error is `The EXECUTE permission was denied on the object 'xp_instance_regread', database 'mssqlsystemresource', schema 'sys'.`
I verified that this was indeed the case with:

``` tsql
use [master]
select * from sys.database_permissions 
where major_id = object_id(N'master.sys.xp_instance_regread')
and state = 'G'
and type = 'EX'
```
No rows returned.

Running the query "normally" in a Query Editor window works just fine, you just can't right click the Object in the Object Explorer.

{{< image src="2021-03-17_11-43-00.png" caption="Works fine in Query Editor in SSMS" >}}


## The "fix"

I've never seen this issue with SQL Server on IaaS VMs or on-premises, or even with Azure Sql Database, but managed to "fix it" with running this against the `master` database.

``` tsql
use [master]
GRANT EXECUTE ON [master].[sys].[xp_instance_regread] TO [public]
```

Everything is back to normal, or is it? The more astute among you may guess what happens next.

## Uh oh, it's not fixed :grimacing:

Yes, you guessed correctly. During routine maintenance, Microsoft fail over databases on the Managed Instance to other nodes and as you know, the master database does not get failed over. So on the node it fails over to in the next patching cycle which is who-knows-when (because it's managed), the error resurfaces and users start complaining again.

## The kludgy fix

Create a SQL Agent job to run the `GRANT EXECUTE` every morning before users start using the database. This does indeed work, but I'm managing code that *Microsoft* should be managing and it's ugly.

## The alternative fix

Use **Azure Data Studio** because let's face it, it's much easier on the eyes. When doing the exact same thing in Azure Data Studio the error does not occur.

{{< image src="2021-03-17_11-44-24.png" caption="Works fine in Azure Data Studio" >}}

{{< image src="2021-03-17_11-44-49.png" caption="Results" >}}

## What next?

I've raised a Support Request with Microsoft Azure to see what they have to say, and they might just say that SSMS is deprecated, use Azure Data Studio. I'm not sure why SSMS is needing to run `xp_instance_regread` when selecting from a view, quite bizarre.

I will update this blog post when Microsoft have provided some input.

## Update

(still waiting)
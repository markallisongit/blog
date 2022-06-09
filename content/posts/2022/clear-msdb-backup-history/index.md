---
title: "Clear Msdb Backup History Safely"
date: 2022-06-10T06:46:13+01:00
lastmod: 2022-06-10T06:46:13+01:00
draft: false
author: Mark
tags: [sql-server, maintenance]
lightgallery: true
---
I came across a situation this week where the **msdb** database had grown to a large amount (130 GB). This is the largest I've ever seen msdb and is a result of no scheduled maintenance of the backup history for several years.

## msdb.dbo.sp_delete_backuphistory

Why not just run `msdb.dbo.sp_delete_backuphistory` I hear you say?

Well, when the history tables have over 100 million rows each and the database files are on the C drive, running this proc will require huge amounts of transaction log space. Each delete statement will be cleaning out millions of rows per table in a single transaction.

The [Ola Hallengren Maintenance Solution](https://github.com/olahallengren/sql-server-maintenance-solution) includes a SQL Agent job to run this proc, however I would recommend for large msdb databases, the job schedule command is changed from the default.

{{< image src="2022-06-06_14-33-40.png" caption="Updating the backup history cleanup job" >}}

## Remove data in batches

The best way to do this is to remove the data in batches and commit the data so that the log can either be backed up and truncated, or in the case of SIMPLE recovery model, just truncated after a CHECKPOINT. As a DBA you will know that a CHECKPOINT flushes dirty pages from memory to disk which means the transaction log records are no longer required in case of sudden failure.

The built-in stored procedure `msdb.dbo.sp_delete_backuphistory` accepts a parameter `@oldest_date`. If we find out what the oldest record is in the `msdb.dbo.backupset` table we can work backwards from there in chunks and delete the data from oldest to newest up to a limit.

I have changed the script in the Ola Hallengren sp_delete_backuphistory SQL Agent job to this:

https://github.com/markallisongit/Scripts/blob/main/CleanUpMsdbBackupHistory.sql

Feel free to play around with the variable defaults to suit your system. I ran this query to decide on a `DaysToKeep` of 60 days and `chunk_days` of 3 days. You may find that if you have a lot of databases with frequent transaction log backups, that it is kinder on the transaction log if you delete one day at a time and set `@chunk_days` to **1**.

``` sql
DECLARE @backup_set_id TABLE      (backup_set_id INT)
DECLARE @media_set_id TABLE       (media_set_id INT)

INSERT INTO @backup_set_id (backup_set_id)
SELECT DISTINCT backup_set_id
FROM msdb.dbo.backupset
WHERE backup_finish_date > dateadd (dd,-1, GETDATE())

INSERT INTO @media_set_id (media_set_id)
SELECT DISTINCT media_set_id
FROM msdb.dbo.backupset
WHERE backup_finish_date  > dateadd (dd,-1, GETDATE())

SELECT count(*) FROM @backup_set_id
SELECT count(*) FROM @media_set_id

select count(*) from msdb.dbo.backupfile WITH (NOLOCK)
WHERE backup_set_id IN (SELECT backup_set_id
                          FROM @backup_set_id)

						  
select count(*) from msdb.dbo.backupfilegroup
WHERE backup_set_id IN (SELECT backup_set_id
                          FROM @backup_set_id)

select count(*) from msdb.dbo.backupmediafamily
WHERE media_set_id IN (SELECT media_set_id
                             FROM @media_set_id)
```

### Run time

I ran this query and it took three hours to clean out msdb on a system with three years history and fifteen minute transaction log backup frequency.

{{< admonition warning "Warning" true >}}
The transaction log backups will occasionally get blocked by the msdb DELETE command. This is why it's a good idea to keep the chunk size small to reduce long running transactions in msdb.
{{< /admonition >}}

{{< image src="2022-06-09_09-15-17.jpg" caption="msdb data file usage and transaction log file size during housekeeping" >}}

Of course, once the process has finished there will be lots of empty space in msdb. With the housekeeping job running frequently in a schedule, that space is no longer needed, so use DBCC SHRINKFILE to reclaim the disk space.

Obviously do this in chunks so as not to blow up the msdb transaction log again or lock msdb for an extended period causing your transaction log backups to stall. 

10 GB chunks should be enough, something like this:

```sql
USE [msdb]
GO
DBCC SHRINKFILE (N'MSDBData' , 120000)
GO
-- ...
-- 10 Gb chunks
-- ...
GO
DBCC SHRINKFILE (N'MSDBData' , 10000)
GO

-- shrink the log file as well down to 1 GB or so
DBCC SHRINKFILE (N'MSDBLog' , 1000)
GO
```

## Another way

The other way I considered was to re-write the `msdb.dbo.sp_delete_backuphistory` procedure with a parameter called `@batch_size` or something, but that would have required much more work and testing. It's best to wrap around a script that is proven in production than to take the risk of re-writing it.
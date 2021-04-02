---
title: "How to Move a Replication Subscriber"
date: 2017-03-12T21:38:39Z
lastmod: 2017-03-12T21:38:39Z
draft: false
author: Mark
tags: [sql-server,replication]
lightgallery: true
---
## How to move a replication subscriber to a new server with no downtime to the publisher?

In a recent data centre migration for a client we had a problem where we needed to move a subscriber to a new data centre without incurring any downtime to the publisher or loss of data after the subscription migration. The application was sending hundreds of transactions per second to the publisher. An additional complication was an upgrade to SQL Server 2016 from SQL Server 2008 R2 on the subscriber.

The first phase of the migration was to move the subscriber to a new server in a different domain, but without incurring any downtime to the publishing application.

## How to do that?
All of the steps outlined below should be scripted and tested before running in a production environment.

### Phase 1 – build new server
Build the new server on SQL Server 2016 in the new Data Centre, let’s call it DC2. Make sure the security mode is mixed because we will be replicating to an untrusted domain and can’t use Windows Authentication.

{{< image src="2017-03-12 12_08_24.png" caption="New server in DC2" >}}

Business as usual, with a newly built server in DC2.

### Phase 2 – set up log shipping

Set up log shipping between DC1 and DC2 so that DC2 is in step with DC1 every 5 minutes.

1. Set up an account on Sub 1 in DC1 and make it a proxy account for SQL Agent. Ensure that account has permissions on Sub 2 in DC2.
1. Change the distributor settings in DC1 so that the distributor retention period more than covers the migration window. Set up a backup job on DC1 to backup the initial database and then transaction logs every 5 minutes.
1. Copy the backup file to DC2 and restore the database from DC1 with NORECOVERY.
1. Create copy jobs to copy the files from DC1 to DC2 using pass-through authentication, or create your own custom job to copy the files between domains.
1. Create restore jobs to restore the transactions with `NORECOVERY` on Sub2.
1. Change the publication with `sp_change_publication` to `allow_initialize_from_backup`. This does not incur downtime on the publisher. This step must be done before the last log is shipped or you will not be able to sync from the last LSN on the old subscriber.

{{< image src="2017-03-12 12_17_44.png" caption="Log shipping in place" >}}

### Phase 3 – stop distribution to the old subscriber

If using pull subscriptions, stop the distribution agent and disable it on the subscriber, in our case it was on Sub 1. If using push subscriptions, then disable the distribution agent on the Distributor. At this stage, transactions will start to build up on the distributor as we do our replication “switcheroo”. Make sure there is plenty of disk space and capacity plan how much you will need in your maintenance window.

{{< image src="2017-03-12 12_20_55.png" caption="Distribution halted" >}}

### Phase 4 – Get the latest LSN from the old subscriber

We need the latest LSN (log sequence number) from the old subscriber. This is the point that the distributor last wrote to the subscriber and assumes that nothing other than the distribution agent is writing to the Sub 1 database.

{{< image src="2017-03-12 12_33_34.png" caption="Get latest LSN" >}}

I wrote a little PowerShell script to get the latest LSN from the old subscriber:

```powershell
$DebugPreference = "Continue" # change to SilentlyContinue to suppress
$subscriber = "Sub1"
$subscriber_db = "MySubscribedDB"
$publisher = "Pub"
$publisher_db = "MyPublishedDB"
$publication = "MyPub"
$distributor = "Dist"
$distribution_db = "distribution"

$Query = "SET NOCOUNT ON;SELECT MAX(transaction_timestamp) FROM $subscriber_db.dbo.MSreplication_subscriptions
WHERE publisher = '$publisher'
AND publisher_db = '$publisher_db'
AND publication = '$publication'"
Write-Debug "query to get LSN:`n$Query"
 
$LSN = (& sqlcmd -S $subscriber -E -d $subscriber_db -Q $Query -h-1 ).SubString(0,22)
Write-Output "LSN: $LSN"

$Query = "IF EXISTS(SELECT * 
FROM MSpublications p
JOIN master..sysservers srv 
ON srv.srvid = p.publisher_id
JOIN MSpublisher_databases d
ON d.publisher_id = p.publisher_id
JOIN MSrepl_transactions trans
ON trans.publisher_database_id = d.id
WHERE p.publication = '$publication'
AND p.publisher_db = '$publisher_db'
AND srv.srvname = '$publisher'
AND xact_seqno = $LSN
AND $LSN > p.min_autonosync_lsn)
BEGIN
PRINT 'The LSN: $LSN is correct'
END ELSE BEGIN
PRINT 'The LSN: $LSN is wrong'
END"

Write-Debug "query to check LSN:`n$Query"
& sqlcmd -S $distributor -E -d $distribution_db -Q $Query -h-1 
```

We need to keep a note of this LSN for later.

### Phase 5 – Flush log shipping transactions through to DC2

Disable your backup log, copy and restore log shipping jobs and then run them manually in order after each one has completed to ensure that any remaining transactions in the log on DC1 are replayed in DC2 Sub 2 database. Data is still building up on the distributor and we are not receiving any data at all now on Sub1 or in DC2.

Once the Log shipping data has been flushed through we need to bring online Sub 2 using `RESTORE DATABASE WITH RECOVERY`. This will roll forward the transactions on DC2 and perform an upgrade of the database to SQL Server 2016.

{{< image src="2017-03-12 12_37_22.png" caption="New subscriber online" >}}

### Phase 6 – create a new subscription to the new DC2

We are now ready to receive all the built up transactions on the distributor of DC1 at DC2. We will create a new subscription and specify the option `@sync_type = N'initialize from LSN'` in the script to create the subscription. Use `sp_addsubscription` to do this and with parameter `@subscriptionlsn = <yourLSN>` to specify the **LSN** you saved from Phase 4.

{{< admonition note >}}
If Sub 2 is in an availability group you will have to use a push subscription because pull subscribers are not supported on AGs.
{{</ admonition >}}

Once you have created the subscription with `sp_addsubscription` and `sp_addpushsubscription_agent` (for push subscriptions ) or `sp_addpullsubscription_agent` for pull subscriptions, the distributor will send the transactions and apply them to the subscriber. This shouldn’t take too long to complete depending on how many transactions per second you have coming in, and how long it took you to perform phases 3-6.

{{< image src="2017-03-12 12_45_05.png" caption="Subscriber moved and online" >}}

### Phase 7 – validate

Time to validate your data and monitor transactions coming through to DC2. If you’ve done everything correctly, you should not receive any errors and your data will be completely in sync with the publisher without the publisher knowing anything about it and no downtime to the users of the publication database. At this point you may also want to drop the old subscription at the publisher with `sp_dropsubscription`.

{{< admonition warning >}}
Microsoft does not support replication from SQL Server 2008 R2 to SQL Server 2016 SP1. The other alternative we had was to introduce a double hop republishing scenario involving a SQL Server 2014 republisher. After some testing of the simpler solution of going direct to SQL Server 2016, we felt that it was lower risk to do that than set up a complicated republisher. The solution is a temporary one as the next phase in the migration is to move the publisher and distributor to DC2. This will incur downtime for the publisher, but at least we don’t have the added complication of moving the subscriber too in the same maintenance window. This means that our “exposure” to an unsupported configuration from Microsoft’s point of view was kept small.
{{</ admonition >}}

As always, look for the simplest solution that works.

## References

[Re-initialization with Log Sequence Numbering (LSN) for SQL Server Failover and Failback.](https://blogs.msdn.microsoft.com/srinivas-v-v/2013/06/24/re-initialization-with-log-sequence-numbering-lsn-for-sql-server-failover-and-failback/)

[Replication Stored Procedures (Transact-SQL)](https://msdn.microsoft.com/en-us/library/ms174364.aspx)
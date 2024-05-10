---
title: "How to Move Sql Distribution Database"
date: 2024-05-02T11:04:28+01:00
lastmod: 2024-05-02T11:04:28+01:00
draft: false
author: Mark
tags: [Sql-Server, Replication, Performance]
lightgallery: true
---

# The Problem

## The incident

Recently, a system I am working on experienced a noticeable slow response time for users due to high PAGEIOLATCH_SH waits. These waits are SQL Server waiting on a latch to read data from disk into memory. At the time we noticed that the distribution agent cleanup task was running for over an hour and checking the latency on the disks revealed that disk read time was peaking at 400ms, when it should be below 10ms.

## Performance data

Here is the performance data

{{< image src="latch-waits-detailed.jpg" caption="Latch wait types" >}}

{{< image src="latch-waits.jpg" caption="Latch waits" >}}

{{< image src="disk-read-time.jpg" caption="Disk Read Latency" >}}

## Diagnosis

This is a very busy OLTP system with transactional replication on most tables so we need to isolate the IO for the distribution database from the other databases.

1. The data drives should be upgraded to lower latency drives
1. The distribution database should have its own drive so that high disk activity here doesn't impact the application. 
1. Create index rebuild jobs on the distribution database, which don't exist

Once the new drive for distribution is installed we need to move them.

## Solution

### Moving the distribution database

As you may know the **Log Reader agent** reads the transaction log and writes them into the distribution database and the **Distribution agent** reads the transactions in the distribution database and sends them to the subscribers. After they have been sent and applied at the subscribers the transactions and commands need to be removed from the distribution database at some point. The default configuration for this is 72 hours.

The job that cleans up these transactions runs every 10 minutes by default so that the distribution database doesn't grow too large. It was this process that caused degradation on our system.

With a new drive installed for the distribution data file, the following steps were taken during a quiet period.

1. Stop the **Log Reader Agent** and **Distribution Agent** in **SQL Server Agent**. This prevents the log reader from writing to the distribution database, and it prevents the distribution agent from reading the distribution database to send on to the subscribers.
1. Take the distribution database offline so we can move the files with `ALTER DATABASE distribution SET OFFLINE`
1. Copy the distribution data file from D to the new R: drive
1. Copy the distribution log file from the D to the E: logs drive
1. Tell SQL Server where the new data file is: `ALTER DATABASE distribution MODIFY FILE ( NAME = distribution , FILENAME = 'R:\MSSQL\distribution\distribution.mdf'`
1. Tell SQL Server where the new log  file is: `ALTER DATABASE distribution MODIFY FILE ( NAME = distribution_log , FILENAME = 'E:\TxLogs\distribution\distribution.ldf'`
1. `ALTER DATABASE distribution SET ONLINE`
1. Start the  **Log Reader Agent** and **Distribution Agent**

SQL Server will start reading the transaction log from where it left off and replicate transactions that were made when the distribution database was offline.

### Gotcha

If you get the following error

```
Msg 5120, Level 16, State 101, Line 37
Unable to open the physical file "G:\distribution\distribution.mdf". 
Operating system error 5: "5(Access is denied.)".
```

 the SQL Server service does not have permission to the new location. You can either grant permission to the SQL Server service to the folder the distribution data and log files are in and propagate to child items, or to the file itself.

If you're not using a domain and using the `NT SERVICE\MSSQLServer` local account then grant the permissions like so:

{{< image src="permissions-gotcha.jpg" caption="Fixing permissions" >}}

We now have a fast disk for distribution which will speed up the cleanup jobs, and combine that with an index rebuild job for distribution, should alleviate future performance impact on the user databases.

## Results

While we were reconfiguring the storage, the drive that holds the data files was also upgraded to io2 EBS volumes, the fastest performing disks on off from aws.

{{< image src="disk-read-time-after.jpg" caption="Disk read latency. Dark blue is current, light blue same period yesterday" >}}

{{< image src="latch-waits-after.jpg" caption="Latch waits. Dark blue is current, light blue same period yesterday" >}}

Interestingly, just increasing the disk performance also reduced the CPU by around 20%, I'm guessing because less CPU cycles are taken up waiting for the disk, which frees it up for other tasks.

{{< image src="cpu-utilization-after.jpg" caption="CPU Utilization. Dark blue is current, light blue same period yesterday" >}}
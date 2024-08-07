---
title: "CPU Hot Add Breaks Fulltext Search"
date: 2024-08-07T14:23:28+01:00
lastmod: 2024-08-07T15:52:28+01:00
draft: false
author: Mark
tags: [Sql-Server, Full-Text]
lightgallery: false
---
# Overloaded server

I recently worked on a SQL Server 2019 CU27 on-premises server that was running at 100% CPU sustained several times during business hours and also during the night running batch processes. This was impacting users, who were complaining. The VM was running in vmware which supports hot cpu add functionality.

## Hot add

The number of CPUs was doubled from 8 to 16 to deal with the customer workload. In order for SQL Server to use these CPUs in SQL Server 2019, the `RECONFIGURE` command must be run. When that was run all looked fine.

```sql
SELECT status,
       COUNT(*) AS [Count]
FROM sys.dm_os_schedulers
GROUP BY status;e
```
{{< image src="cpu-hot-add.jpg" caption="Hot added CPUs" >}}

## A problem

Almost immediately, users started searching the `Contacts` table using SQL Server Full-Text search and were now getting the following error:

```
Msg 596, Level 21, State 1, Line 0
Cannot continue the execution because the session is in the kill state.
Msg 0, Level 20, State 0, Line 0
A severe error occurred on the current command. The results, if any, should be discarded.
```
and then the session was terminated.

Examining the SQL Server ERRORLOG showed lots of stack dumps and access violations.

```
08/05/24 19:07:00 spid 168 Exception 0xc0000005 EXCEPTION_ACCESS_VIOLATION reading address 0000000000000000 at 0x00007FFE305439F4
08/05/24 19:07:30 spid 290 Exception 0xc0000005 EXCEPTION_ACCESS_VIOLATION reading address 0000000000000000 at 0x00007FFE305439F4
08/05/24 19:07:36 spid 285 Exception 0xc0000005 EXCEPTION_ACCESS_VIOLATION reading address 0000000000000000 at 0x00007FFE305439F4
08/05/24 19:07:41 spid 290 Exception 0xc0000005 EXCEPTION_ACCESS_VIOLATION reading address 0000000000000000 at 0x00007FFE305439F4
08/05/24 19:07:46 spid 264 Exception 0xc0000005 EXCEPTION_ACCESS_VIOLATION reading address 0000000000000000 at 0x00007FFE305439F4
08/05/24 19:07:52 spid 290 Exception 0xc0000005 EXCEPTION_ACCESS_VIOLATION reading address 0000000000000000 at 0x00007FFE305439F4
08/05/24 19:08:05 spid 283 Exception 0xc0000005 EXCEPTION_ACCESS_VIOLATION reading address 0000000000000000 at 0x00007FFE305439F4
08/05/24 19:08:14 spid 263 Exception 0xc0000005 EXCEPTION_ACCESS_VIOLATION reading address 0000000000000000 at 0x00007FFE305439F4
08/05/24 19:08:16 spid 53 Exception 0xc0000005 EXCEPTION_ACCESS_VIOLATION reading address 0000000000000000 at 0x00007FFE305439F4
08/05/24 19:08:21 spid 109 Exception 0xc0000005 EXCEPTION_ACCESS_VIOLATION reading address 0000000000000000 at 0x00007FFE305439F4
08/05/24 19:08:25 spid 288 Exception 0xc0000005 EXCEPTION_ACCESS_VIOLATION reading address 0000000000000000 at 0x00007FFE305439F4
```

## Turn it off and on!

As with most things in IT, turning it off and on fixes most things. The server was rebooted and the CPUs were now marked as VISIBLE ONLINE instead of VISIBLE ONLINE HOT_ADDED.

{{< image src="cpu-cold-add.jpg" caption="After a reboot" >}}

No more access violations, and happier users.
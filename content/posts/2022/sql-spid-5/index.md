---
title: "Sql Server SPID -5"
date: 2022-02-23T10:39:18Z
lastmod: 2022-02-23T10:39:18Z
draft: false
author: Mark
tags: [sql-server, sql-managed-instance]
lightgallery: true
---
I had an interesting issue today when a colleague was running a long running IO intensive query. I ran `sp_who2` to view the activity and saw that the query was running multi-threaded, but was blocked by a SPID of -5.

Yes, that's SPID minus five, or negative five. (putting this here so that google searches maybe work?).

{{< image src="2022-02-21_15-28-35.jpg" caption="blocking SPID -5" >}}

## Google not working

I tried to use Google to get information on this but it seems that Google doesn't allow you to search for negative numbers. So searching for `SPID -5` doesn't show any decent information to understand what's going on.

As a last resort, I posted to Twitter.

{{< tweet user="dataguzzle" id="1495784060509204481" >}}

I got some great responses and will let you navigate to the tweet or click on the links below. Mostly importantly, the links below describe the following.

> By itself, blocking_session_id -5 does not indicate a performance problem. -5 is an indication that the session is waiting on an asynchronous action to complete.

## References

[How can I search Google for a negative number?](https://webapps.stackexchange.com/questions/50092/how-can-i-search-google-for-a-negative-number)

[Negative Blocking Session Ids (-5 = Latch ANY TASK RELEASOR)](https://bobsql.com/negative-blocking-session-ids-5-latch-any-task-releasor/)

[sys.dm_exec_requests (Transact-SQL)](https://docs.microsoft.com/en-us/sql/relational-databases/system-dynamic-management-views/sys-dm-exec-requests-transact-sql)

{{< tweet user="dataguzzle" id="1495888376528097280" >}}

---
title: "SQLMI Server Audit Fails"
date: 2021-08-02T08:56:42+01:00
lastmod: 2021-08-02T08:56:42+01:00
draft: false
author: Mark
tags: [azure, sql-managed-instance, audit, security]
lightgallery: false
---
I have set up server auditing for some managed instances in the same virtual cluster to record login success and failed events and writing them to blob storage.

Downstream, an ADF pipeline reads the events asynchronously and inserts them into a database for further analysis and reporting.

## Server audit stops writing

Recently the server audit stopped writing to blob storage, even though the server audit status was still running and enabled. I have seen failures before where the server audit failed because of an expiring SAS token, but in this case the SAS token has a long expiry date, so know it's not that.

The SQL Server ERRORLOG has entries like the following:

```log
07/30/2021 21:18:46,spid89s,Unknown,HaDrDbMgr::WaitForQuorumCatchUp: {db_id: [6]<c/> db_name: [e982cea5-2bbf-437e-8b86-52b28afb28fe]<c/> quorum_mode: [1]}.
```
A Google search for HaDrDbMgr::WaitForQuorumCatchUp yields zero (0) results!

I see the following also:

```log
07/30/2021 21:18:47,spid130s,Unknown,[DbrSubscriber] Switching role to primary. Database: managed_model<c/> Partition ID: F0179160-9192-4F4A-9A9C-0F19794711A7.
07/30/2021 21:18:47,spid92s,Unknown,[DbrSubscriber] Cleared hadron truncation LSN in bootpage. Database: msdb<c/> Partition ID: 7C8CB740-9FCA-40FF-B3CA-34733F4495EC.
07/30/2021 21:18:47,spid130s,Unknown,[DbrSubscriber] Cleared hadron truncation LSN in bootpage. Database: managed_model<c/> Partition ID: F0179160-9192-4F4A-9A9C-0F19794711A7.
07/30/2021 21:18:47,spid92s,Unknown,[GenericSubscriber] Begin of TransitionToPrimary Database: msdb<c/> Partition ID: 7C8CB740-9FCA-40FF-B3CA-34733F4495EC.
07/30/2021 21:18:47,spid130s,Unknown,[GenericSubscriber] End of TransitionToPrimaryAsync

07/30/2021 21:18:47,spid1s,Unknown,Process ID 125 was killed by an ABORT_AFTER_WAIT = BLOCKERS DDL statement on database_id = 32763<c/> object_id = 0.
07/30/2021 21:18:47,spid1s,Unknown,Process ID 103 was killed by an ABORT_AFTER_WAIT = BLOCKERS DDL statement on database_id = 32763<c/> object_id = 0.
07/30/2021 21:18:47,spid1s,Unknown,Process ID 107 was killed by an ABORT_AFTER_WAIT = BLOCKERS DDL statement on database_id = 32763<c/> object_id = 0.
07/30/2021 21:18:47,spid1s,Unknown,Process ID 82 was killed by an ABORT_AFTER_WAIT = BLOCKERS DDL statement on database_id = 32763<c/> object_id = 0.

07/30/2021 21:18:49,spid142s,Unknown,[GenericSubscriber] Begin of starting audit sessions on transition to primary. Database: 1bc613f9-72a7-4dd8-85e2-c2e9e4821f68<c/> Partition ID: 75459A04-DCFF-4AAA-939E-D1CAD901AADE.

07/30/2021 21:18:49,spid1s,Unknown,Cannot remove the credential 'https://myauditaccount.blob.core.windows.net/auditlogins' because it is being used.

07/30/2021 21:18:50,Logon,Unknown,Database 'master' on server 'np:\\.\pipe\DB4C.0-E848FE6A99A3\sql\query' is not currently available.  Please retry the connection later.  If the problem persists<c/> contact customer support<c/> and provide them the session tracing ID of '***'.
07/30/2021 21:18:50,Logon,Unknown,Error: 40613<c/> Severity: 17<c/> State: 169.

07/30/2021 21:19:58,spid12s,Unknown,Audit: Server Audit: 65536<c/> State changed from: STARTED to: SHUTTING_DOWN

07/30/2021 23:27:19,spid13s,Unknown,SQL Server Audit has started the audits. This is an informational message. No user action is required.
07/30/2021 23:27:19,spid13s,Unknown,Audit: Server Audit: 65539<c/> Initialized and Assigned State: STARTED
07/30/2021 23:27:19,spid13s,Unknown,Audit: Server Audit: 65539<c/> Initialized and Assigned State: START_FAILED
07/30/2021 23:27:19,spid13s,Unknown,FAppAuditingChangeFlushPolicy enabled<c/> setting flush policy to 0
07/30/2021 23:27:19,spid13s,Unknown,Audit: Server Audit: 65537<c/> Initialized and Assigned State: STARTED
07/30/2021 23:27:19,spid13s,Unknown,Audit: External Monitor Target Create succeeded
07/30/2021 23:27:19,spid13s,Unknown,Audit: Server Audit: 65537<c/> Initialized and Assigned State: START_FAILED
07/30/2021 23:27:19,spid13s,Unknown,FAppAuditingChangeFlushPolicy enabled<c/> setting flush policy to 0
07/30/2021 23:27:19,spid13s,Unknown,SQL Server Audit is starting the audits. This is an informational message. No user action is required.

```

Simply disabling and enabling the audit allows it to start writing again. This behaviour should not be happening so will raise a support request with Microsoft and ask for a fix to be applied, or for a further explanation to see if there are any configuration changes that can be made.

In the meantime an alert has been set up with Sentry One to detect if the audit has stopped writing to blob storage.
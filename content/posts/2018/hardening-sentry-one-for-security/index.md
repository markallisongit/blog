---
title: "Hardening Sentry One for Security"
date: 2018-04-27T11:04:16Z
lastmod: 2018-04-27T11:04:16Z
draft: false
author: Mark
tags: [sentry-one,monitoring]
lightgallery: true
---
If you have an environment where you need to lock down Sentry One as much as possible, then this article should help. It is well known that the Sentry One service account needs to be a member of the `Local Administrators` group in each server it monitors, and also a member of the `sysadmin` role for each SQL Server instance. At the moment this is still a requirement, but if you can live without the Windows metrics, then you could run Sentry One in **Limited Mode** which will only gather SQL Server specific metrics. Some of our clients run in this configuration for security reasons.

A recommended architecture is to run the following VMs:

* Sentry One Monitoring server
* Sentry One Database server
* Sentry One Workstation with the client installed

As a Sentry One user, you should not need to log in to the Monitoring server or database server directly after initial setup. In the Sentry One database add your user account, or even better an AD Group with all the users you want to access Sentry One client to a selection of the following database roles in the SentryOne database depending on what you want to lock down:

* allow_all
* deny_actions_update
* deny_contact_update
* deny_customconditions_update
* deny_eventchain_update
* deny_settings_connection_update
* deny_settings_object_update
* deny_settings_source_update
* deny_site_update
* deny_watch_connection
* deny_watch_object

Carefully read the following article and only remove the permissions that are not required for the users connecting to the Sentry One client.

https://docs.sentryone.com/help/role-based-security

Or run this script:

```tsql
-- script needs to be run in SQLCMD mode.
-- change the LoginName below to the appropriate one.

:setvar LoginName "DOMAIN\Login" 

IF NOT EXISTS (
	select * FROM sys.database_principals 
	where name = N'$(LoginName)')
CREATE USER [$(LoginName)] FOR LOGIN [$(LoginName)];

ALTER ROLE [allow_all] ADD MEMBER [$(LoginName)]
ALTER ROLE [deny_actions_update] ADD MEMBER [$(LoginName)]
ALTER ROLE [deny_contact_update] ADD MEMBER [$(LoginName)]
ALTER ROLE [deny_customconditions_update] ADD MEMBER [$(LoginName)]
ALTER ROLE [deny_eventchain_update] ADD MEMBER [$(LoginName)]
ALTER ROLE [deny_settings_connection_update] ADD MEMBER [$(LoginName)]
ALTER ROLE [deny_settings_object_update] ADD MEMBER [$(LoginName)]
ALTER ROLE [deny_settings_source_update] ADD MEMBER [$(LoginName)]
ALTER ROLE [deny_site_update] ADD MEMBER [$(LoginName)]
ALTER ROLE [deny_watch_connection] ADD MEMBER [$(LoginName)]
ALTER ROLE [deny_watch_object] ADD MEMBER [$(LoginName)]
```
 
Log in to the Sentry One client workstation using your normal locked-down AD account (not the Sentry One service account), and those functions will now be denied to you. For example, if you wanted to add an advisory condition to get all the credit card numbers from a target server, you now can’t do that:

{{< image src="accessdenied.png" caption="No permissions to managed actions" >}}

You can also create an AD group and limit a group of users to only be able to look at certain servers by restricting it in the Sentry One GUI.

With the AD group concerned, link it in Sentry One to a new User by following this page. https://docs.sentryone.com/help/client-security

The sequence will look like this:

{{< image src="newuser.png" caption="New User" >}}

In the Properties dialog, fill in the First Name, Login and Description fields. The Login field should be filled in by clicking the ellipsis to the right of that field so that it can be validated against AD.

{{< image src="userdetails.png" caption="User Details" >}}

Save the dialog by clicking the **Save** icon.

Close the dialog and reopen it and you should see a Rights Tab. In here you can specify which servers you want the group to see. Click **Add…** for each SQL Server and Windows Target you want the group to view performance metrics on. You can **CTRL-Click** for multiple servers.

{{< image src="rights.png" caption="Rights" >}}

Click **Save** when you are finished.

Suggestions for the Sentry One team:

1. Please allow the Sentry One service to use Group Managed Service Accounts
1. Please remove the requirement for Sentry One to be a Local Admin on Windows on targets
1. Please remove the requirement for Sentry One to be sysadmin on SQL Server instances and to use the finer grained permissions in SQL Server
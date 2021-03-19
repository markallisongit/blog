---
title: "⚠ Careful with Maintenance Window"
subtitle: "It might bite you"
date: 2021-03-16T13:41:54Z
draft: true
author: "Mark"
categories: ["azure"]
tags: ["azure","sql-managed-instance"]
fontawesome: true
---

## Maintenance Window now in Preview
(at the time of writing)

On 2nd March 2021, [Microsoft announced](https://techcommunity.microsoft.com/t5/azure-sql/maintenance-window-for-azure-sql-database-and-managed-instance/ba-p/2174835) a long-awaited feature, at least by me, to give choice over when OS and SQL patching occurs behind-the-scenes in Azure SQL Managed Instance. Before this feature, Microsoft would patch the Virtual Cluster supporting Managed Instances outside of regular business hours in the region your Managed Instance is located. 

You now get **two** additional options:

* Weekday window, 10PM to 6AM local time Monday – Thursday
* Weekend window, 10PM to 6AM local time Friday - Sunday

{{< admonition type=warning title="Warning" open=true >}}
Continue reading before trying Maintenance Window
{{< /admonition >}}

This would mean that if you had any long running transactions, they would get disconnected and rolled back, which can be inconvenient for loading a data warehouse daily, for example. Usually when a Managed Instance fails over it takes less than 30 seconds, typically around 8, so the outage is small, however it does disconnect any existing transactions. Similar to how Availability groups work in SQL Server with a  command like:

``` tsql
ALTER AVAILABILITY GROUP MyAg FAILOVER;  
```

## Users requesting this feature

I had users requesting this feature because they wanted uninterrupted daily loading of the warehouse and didn't want to have to deal with unpredicatable failover events.

After reading the announcement I decided to try it out, because users were requesting it, but I *didn't read the entire documentation* on the [Microsoft documentation site](https://docs.microsoft.com/en-us/azure/azure-sql/database/maintenance-window). Therefore I didn't see this part of the docs:

{{< admonition type=info title="Important" open=true >}}
Configuring maintenance window is a long running asynchronous operation, similar to changing the service tier of the Azure SQL resource. The resource is available during the operation, except a short failover that happens at the end of the operation and typically lasts up to 8 seconds even in case of interrupted long-running transactions. To minimize the impact of failover you should perform the operation outside of the peak hours.
{{< /admonition >}}

Little did I know but changing your maintenance window does the following:

1. Creates a new virtual cluster! (because it's using new code)
1. Begins a scaling operation to move the entire managed instance into the new virtual cluster
1. Will change the IP address of the Managed Instance
1. The process can take hours (5+ in my case)

### Scaling operations

Scaling operations should normally be done during a maintenance window (oh, the irony), because disconnection events happen as the instance is moved to new virtual machines. Although the managed instance is available during this event, some things are not possible, for example, restoring a managed database.

## Firewall rules

If the managed instance is behind an IP based firewall then the public endpoint (if configured) will become unavailable as the IP address changes. Anyone that manages and deploys managed instances should know that URL based firewalls should be used for public endpoints, or even better, use private endpoints (my preferred approach).

## Summary

Changing your maintenance window does not simply adjust a schedule in Microsoft. It will:

1. Create a new virtual cluster
1. Move your managed instance to the new virtual cluster
1. Take hours to do it.
1. Prevent some operations to take place like restoring a database
1. Likely change the IP address of the public endpoint of the Managed Instance as a result of moving to a new virtual cluster with a new listener



{{< admonition type=tip title="Tip" open=true >}}
In case you didn't know you can invoke a failover manually for testing purposes on a Managed Instance with https://docs.microsoft.com/en-gb/azure/azure-sql/managed-instance/user-initiated-failover
{{< /admonition >}}
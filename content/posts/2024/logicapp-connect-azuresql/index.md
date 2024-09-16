---
title: "Connect Logic App to  Azure Sql Securely"
date: 2024-09-16T07:27:43+01:00
lastmod: 2024-09-16T07:27:43+01:00
draft: false
author: Mark
tags: [Azure, Managed-Identity, Azure-Sql-Database, Sql-Server]
lightgallery: false
---
# The Problem

Recently, I was working on a personal project where I needed to export data from my Azure SQL Database into a JSON file every hour. This JSON file would then be used by a static website hosted on Azure Blob Storage. I wanted a secure way to do this without maintaining passwords, so I decided to use Managed Identity to connect my Logic App to the Azure SQL Database.

## My Setup

For this task, I had:
- A Logic App named `la-sqltest`.
- An Azure SQL Database called `logicappdb`, hosted on a logical SQL server named `logicappmarktest`.

Here’s how it looked in the Azure Portal:

{{< image src="resources.jpg" caption="Azure Resources Overview" >}}

## Following the Documentation

The official documentation recommends enabling a System-Assigned Managed Identity for the Logic App and using that identity to access the database.

After enabling Managed Identity, I got the Object ID for the Logic App:

{{< image src="logicapp-mi.jpg" caption="Enabling Managed Identity for the Logic App" >}}

The next step was to add this Object ID to the Azure SQL Database with the following SQL command and grant permissions to the database:

```sql
CREATE USER [la-sqltest] FROM EXTERNAL PROVIDER;
CREATE ROLE [la-sqltest-role];
GRANT SELECT ON dbo.marktest TO [la-sqltest-role];
ALTER ROLE [la-sqltest-role] ADD MEMBER [la-sqltest];
```

However, when I tried this, I ran into an error:

```
Msg 33130, Level 16, State 1, Line 1
Principal 'c9e84c4b-1bc7-4bb5-b9ed-a9dd18f9fcf3' could not be found or this principal type is not supported.
```

## Using the Logic App Name Instead

To troubleshoot, I decided to use the Logic App's name instead of the Object ID:

```sql
CREATE USER [la-sqltest] FROM EXTERNAL PROVIDER;
```

This worked without any issues!

```
Commands completed successfully.
```

With the user created, I went ahead and attempted to connect the Logic App to the SQL Database.

Next, let's connect the Logic App to Sql .

## Running into Another Error

Unfortunately, I encountered another error during the connection:

{{< image src="run-failed.jpg" caption="Run failed" >}}

```json
{
  "status": 404,
  "source": "https://logic-apis-uksouth.token.azure-apim.net:443/tokens/logic-apis-uksouth/sql/e5ba64851872438fbf719a107050ab9b/exchange",
  "message": "Error from token exchange: The connection (logic-apis-uksouth/sql/e5ba64851872438fbf719a107050ab9b) is not found. Please create new connection and change your application to use the new connection."
}
```

I tried creating a new connection as suggested, but the error persisted.

# Solution

The connection string in the Logic App **must** use the fully qualified domain name (FQDN) of the SQL Server. In my case, that meant including `.database.windows.net` in the server name.

Additionally, the **System-Assigned Managed Identity** for the Azure SQL Database must be enabled at least once during the initial connection setup.

Once I made these changes, the connection worked.

{{< image src="connection-complete.jpg" caption="Successful connection" >}}

## An Interesting Observation

Interestingly, I noticed that the Managed Identity for the Azure SQL Database can be turned off after the connection is established, and everything continues to work. I'm not entirely sure why this is, but it's worth noting.

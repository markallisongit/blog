---
title: "SQLMI Restore Blob Storage Access Denied"
date: 2023-08-08T11:24:22+01:00
lastmod: 2023-08-08T11:24:22+01:00
draft: false
author: Mark
tags: [azure,sql-managed-instance,security]
lightgallery: false
---

If you are using Azure SQL Managed Instance and encounter an error like this when restoring a database from an Azure Blob Storage container:

{{< admonition failure "Msg 3201, Level 16, State 2, Line 1" true >}}
Cannot open backup device 'https://{storage-account}.blob.core.windows.net/my-container/mydb/FULL/mydb-backup.bak'. Operating system error 5(Access is denied.).
{{< /admonition >}}

You can try the following steps to fix it:

## 1. Check the SAS token and generate a new one if needed.

The most common cause of this error is that the SAS token used to access the Azure Blob Storage container has expired or is invalid. A SAS token is a shared access signature that grants limited access to a resource in Azure. You can generate a SAS token for your Azure Blob Storage container using the Azure portal, PowerShell, CLI, or SDK.

To fix this error, you need to generate a new SAS token for your Azure Blob Storage container and use it in your stored credential. Make sure that the SAS token has the following permissions:

- Read (r)
- List (l)
- Add (a)

Also, make sure that the SAS token has a sufficient expiry time and start time.

## 2. Check the firewall rules and allow access between the resources.

Another possible cause of this error is that the firewall rules of your Azure SQL Managed Instance or your Azure Blob Storage account are blocking access. You need to make sure that both resources are configured to allow communication with each other.


## 3. Check the credential and create one if needed.

Another possible cause of this error is that the **credential** used to access the Azure Blob Storage container is incorrect or missing. You need to create a credential in your Azure SQL Managed Instance that matches the storage account name and key of your Azure Blob Storage account.

You can create a credential using T-SQL like this:

```sql
CREATE CREDENTIAL [https://{storage-account}.blob.core.windows.net/my-container]
WITH IDENTITY = 'SHARED ACCESS SIGNATURE',
SECRET = '<your-SAS-token>'
```
You can then use the credential in your restore command like this:

```sql
RESTORE DATABASE mydb FROM URL = 'https://{storage-account}.blob.core.windows.net/my-container/mydb/FULL/mydb-backup.bak'
```
Hope it helps, in my case the SAS token had expired and I just generated a new one and added it to my credential.
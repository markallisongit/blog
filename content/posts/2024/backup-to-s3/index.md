---
title: "Backup to S3 from SQL Server"
date: 2024-11-01T07:57:04Z
lastmod: 2024-11-01T07:57:04Z
draft: false
author: Mark
tags: [sql-server, backups, s3, aws]
lightgallery: false
---
As we all know backing up to Azure Storage has been easy for some years now, but only since SQL Server 2022 have Microsoft supported backing up to S3. This includes third party providers that implement the S3 bucket protocol. 

## Why do this?

To keep backups safe and secure, best practise dictates that backup files should be off-site. Rather than backing up locally to a volume and then copying the file to S3, money can be saved by not having to provision space for local volumes. It is common in AWS to use an FSx volume for backups, or even a mounted EBS volume, but these costs can be removed by backing up directly to an S3 bucket.

It is best to backup to a different region to the one your SQL Server is hosted in. If your S3-compatible storage provider supports distributed regions, then this option can be added to the BACKUP statement to specify which region.

`WITH BACKUP_OPTIONS = '{"s3": {"region":"eu-west-1"}}'`

In my case I don't need this because my S3 bucket is in a different region to my SQL Server already.

## Requirements
To back up to URL an Access Key and Secret Key is required. If you do not have these, see your AWS administrator, they can be obtained from the AWS console.

## Create a credential using the s3 bucket endpoint where

- `<bucket_name>`: Bucket Name
- `<region>`: is the AWS region of the bucket. e.g. `eu-west-1`
- `<path>`: is the path inside the bucket to limit this credential to

```sql
CREATE CREDENTIAL [s3://<bucket_name>.s3.<region_name>.amazonaws.com/<path>]
WITH IDENTITY = 'S3 Access Key',
SECRET = '<AccessKey>:<SecretKey';
```

e.g.

```sql
CREATE CREDENTIAL [s3://databasebackups.s3.eu-west-1.amazonaws.com/UK/PROD]
WITH IDENTITY = 'S3 Access Key',
SECRET = '<redacted>:/<redacted>';
```

## Backup database to URL

This will ALSO allow you to backup to sub-directories. You must specify the full path inside the bucket.

```sql
BACKUP DATABASE MyDatabase
TO URL = 's3://databasebackups.s3.eu-west-1.amazonaws.com/UK/Test/FULL/MyDatabase.bak'
WITH STATS = 10
```

output:

```
12 percent processed.
21 percent processed.
30 percent processed.
42 percent processed.
51 percent processed.
60 percent processed.
72 percent processed.
81 percent processed.
90 percent processed.
100 percent processed.
Processed 4264 pages for database 'MyDatabase', file MyDatabase' on file 1.
Processed 1 pages for database 'MyDatabase', file 'MyDatabase_log' on file 1.
BACKUP DATABASE successfully processed 4265 pages in 14.052 seconds (2.370 MB/sec).
```

## Ola Hallengren command

```sql
EXECUTE [dbo].[DatabaseBackup]
@Databases = 'MyDatabase',
@URL= 's3://databasebackups.s3.eu-west-1.amazonaws.com/UK/Test',
@BackupType = 'FULL',
@Verify = 'Y',
@Compress = 'Y',
@CleanupTime = NULL,
@CheckSum = 'Y',
@LogToTable = 'Y'
```

Also check out the `@BackupOptions` parameter for more S3 options.

## Troubleshooting

### The request could not be performed because of an I/O device error

If you get the below error it could be because the file sizes are too big.

```
Msg 3202, Level 16, State 1, Line 3
Write on "s3://databasebackups.s3.eu-west-1.amazonaws.com/UK/Test/EC2AMAZ-F9UJ37V/MyDatabase/FULL_COPY_ONLY/EC2AMAZ-F9UJ37V_MyDatabase_FULL_COPY_ONLY_20241029_154232.bak" failed: 1117(The request could not be performed because of an I/O device error.)
Msg 3013, Level 16, State 1, Line 3
BACKUP DATABASE is terminating abnormally.
```

Try splitting the files up with a command like this using the `@MaxTransferSize` and `@NumberOfFiles` parameters:

```sql
EXECUTE [dbo].[DatabaseBackup]
@Databases = 'ProcureWizard',
@URL= 's3://databasebackups.s3.eu-west-1.amazonaws.com/UK/Test',
@BackupType = 'FULL',
@CopyOnly = 'Y',
@Verify = 'Y',
@Compress = 'Y',
@CheckSum = 'Y',
@LogToTable = 'Y',
@MaxTransferSize = 10485760,  -- 10MB
@NumberOfFiles = 4
```

### Operating system error 5(Access is denied.)

Permissions on the bucket are incorrect. Make sure that `ListBucket`, `GetObject`, `PutObject` have been granted. The policy for the bucket should look something like this:

```json
{  
    "Version": "2012-10-17",  
    "Statement": [  
        {  
            "Effect": "Allow",  
            "Action": [  
                "s3:PutObject"  
            ],  
            "Resource": "arn:aws:s3:::databasebackups/*"  
        },  
        {  
            "Effect": "Allow",  
            "Action": [  
                "s3:GetObject"  
            ],  
            "Resource": "arn:aws:s3:::databasebackups/*"  
        },  
        {  
            "Effect": "Allow",  
            "Action": [  
                "s3:ListBucket"  
            ],  
            "Resource": [  
                "arn:aws:s3:::databasebackups"  
            ]  
        }  
    ]  
}
```

### The value for the parameter @URL is not supported.

If you get this error

```
Msg 50000, Level 16, State 1, Procedure dbo.DatabaseBackup, Line 2276 [Batch Start Line 4]
The value for the parameter @URL is not supported.
```

You need to get the latest version of Ola Hallengren scripts from https://ola.hallengren.com/scripts/MaintenanceSolution.sql

## Performance tests

### From EC2 instance to S3

125MB/s throughput 

### On-Prem to S3

120MB/s throughput 

## References

[Backup and restore with S3-compatible object storage - SQL Server | Microsoft Learn](https://learn.microsoft.com/en-us/sql/relational-databases/backup-restore/sql-server-backup-and-restore-with-s3-compatible-object-storage?view=sql-server-ver16)

[SQL Server backup to URL for S3-compatible object storage - SQL Server | Microsoft Learn](https://learn.microsoft.com/en-us/sql/relational-databases/backup-restore/sql-server-backup-to-url-s3-compatible-object-storage?view=sql-server-ver16)
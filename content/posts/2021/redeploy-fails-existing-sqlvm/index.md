---
title: "Redeployment of Existing SqlVm fails"
date: 2021-04-06T14:37:53+01:00
lastmod: 2021-04-06T14:37:53+01:00
draft: true
author: Mark
tags: [azure-devops,azure,devops,SqlVm]
lightgallery: true
---
## Infrastructure-as-code Release

I have an ARM template defining the following Azure resources which I would like to deploy using Azure DevOps.

* 2 Azure Data Factories
* SQL Virtual Machine, with associated networking resources
* 2 Storage accounts

This has been working fine as an old-school Azure Release, but the time has come to convert all existing infrastructure into YAML pipeline releases since the feature became available in 2020.

## Convert Release to YAML Pipeline

It didn't take too long to create the YAML code and I tested it by creating a deployment into a test resource group.

As you can see in the image below the `TEST` stage worked fine deploying to a new resource group, but the `PROD` stage failed deploying the same code to an existing resource group.

{{< image src="2021-04-06_14-42-03.jpg" caption="TEST succeeds, PROD fails" >}}

### Error

The error received from the Azure deployment was:

```log
2021-03-29T16:28:26.3820888Z Starting template validation.
2021-03-29T16:28:26.3939214Z Deployment name is azuredeploy-20210329-162826-b1b1
2021-03-29T16:28:26.8803999Z Template deployment validation was completed successfully.
2021-03-29T16:28:26.8808738Z Starting Deployment.
2021-03-29T16:28:26.8814512Z Deployment name is azuredeploy-20210329-162826-b1b1
2021-03-29T16:36:29.9746782Z There were errors in your deployment. Error code: DeploymentFailed.
2021-03-29T16:36:29.9805021Z ##[error]At least one resource deployment operation failed. Please list deployment operations for details. Please see https://aka.ms/DeployOperations for usage details.
2021-03-29T16:36:29.9850960Z ##[error]Details:
2021-03-29T16:36:29.9866282Z ##[error]Ext_AutomatedBackupError: Error: 'Execution Timeout Expired.  The timeout period elapsed prior to completion of the operation or the server is not responding.;System.Data.SqlClient.SqlException (0x80131904): Execution Timeout Expired.  The timeout period elapsed prior to completion of the operation or the server is not responding. ---> System.ComponentModel.Win32Exception (0x80004005): The wait operation timed out
   at System.Data.SqlClient.SqlConnection.OnError(SqlException exception, Boolean breakConnection, Action`1 wrapCloseInAction)
   at System.Data.SqlClient.TdsParser.ThrowExceptionAndWarning(TdsParserStateObject stateObj, Boolean callerHasConnectionLock, Boolean asyncClose)
   at System.Data.SqlClient.TdsParser.TryRun(RunBehavior runBehavior, SqlCommand cmdHandler, SqlDataReader dataStream, BulkCopySimpleResultSet bulkCopyHandler, TdsParserStateObject stateObj, Boolean& dataReady)
   at System.Data.SqlClient.SqlCommand.FinishExecuteReader(SqlDataReader ds, RunBehavior runBehavior, String resetOptionsString, Boolean isInternal, Boolean forDescribeParameterEncryption, Boolean shouldCacheForAlwaysEncrypted)
   at System.Data.SqlClient.SqlCommand.RunExecuteReaderTds(CommandBehavior cmdBehavior, RunBehavior runBehavior, Boolean returnStream, Boolean async, Int32 timeout, Task& task, Boolean asyncWrite, Boolean inRetry, SqlDataReader ds, Boolean describeParameterEncryptionRequest)
   at System.Data.SqlClient.SqlCommand.RunExecuteReader(CommandBehavior cmdBehavior, RunBehavior runBehavior, Boolean returnStream, String method, TaskCompletionSource`1 completion, Int32 timeout, Task& task, Boolean& usedCache, Boolean asyncWrite, Boolean inRetry)
   at System.Data.SqlClient.SqlCommand.InternalExecuteNonQuery(TaskCompletionSource`1 completion, String methodName, Boolean sendToPipe, Int32 timeout, Boolean& usedCache, Boolean asyncWrite, Boolean inRetry)
   at System.Data.SqlClient.SqlCommand.ExecuteNonQuery()
   at Microsoft.SqlServer.Management.IaaSAgentSqlQuery.Service.SqlQueryService.<>c__DisplayClass145_0.<DisableEncryption>b__0()
   a'
2021-03-29T16:36:29.9880800Z ##[error]Check out the troubleshooting guide to see if your issue is addressed: https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/deploy/azure-resource-group-deployment?view=azure-devops#troubleshooting
2021-03-29T16:36:29.9884548Z ##[error]Task failed while creating or updating the template deployment.
```

The interesting part being 

`System.Data.SqlClient.SqlException (0x80131904): Execution Timeout Expired.`

### Firewall problem?

Ah, this must be because the Azure Agent doesn't have connectivity to the SQL Virtual machine and can't access the SQLIaaSExtension. So I created some PowerShell to open the firewall temporarily, but I still got the same error.

PowerShell to open firewall:

```powershell
Get-AzNetworkSecurityGroup -ResourceGroupName $(MIResourceGroup) | Add-AzNetworkSecurityRuleConfig -Name "inbound-sql-public" -Description "Allow inbound connections" -Access "Allow" -Protocol "Tcp" -Direction "Inbound" -Priority 200 -SourceAddressPrefix * -SourcePortRange * -DestinationAddressPrefix * -DestinationPortRange 1433 | Set-AzNetworkSecurityGroup

$fqdn = (Get-AzPublicIpAddress -ResourceGroupName $(ETLResourceGroup)).DnsSettings.Fqdn
do {
      $net = Test-NetConnection $fqdn -port 1433
      Sleep -Seconds 1
} 
until ($net.TcpTestSucceeded -eq $true)
```

At this point I was not sure of the root cause, so created a Support Request with Microsoft Azure Support.
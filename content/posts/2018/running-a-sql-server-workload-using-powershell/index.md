---
title: "Running a Sql Server Workload Using Powershell"
date: 2018-02-15T14:41:18Z
lastmod: 2018-02-15T14:41:18Z
draft: false
author: Mark
tags: [powershell,sql-server,testing]
lightgallery: false
---
In February 2018, myself and Paul Anderton gave a presentation on how to correlate database deployments with performance issues within the context of a DevOps pipeline. We used Sentry One as our monitoring tool in a Performance Test environment so that we could catch badly performing deployments before they got to production and caused havoc. If you would like to see the recorded video, then you can download it from here: http://info.sentryone.com/partner-webinar-performance-problems

As part of this presentation we had a workload running on a workstation, which executed a couple of stored procedures repeatedly, and we’ve had some requests from people to share this script. It’s a fairly crude script created specifically for this demo, but could be reused with some tweaking.

It creates a number of background jobs, and each background job calls the stored procedure with a randomized parameter value and has a randomized delay between each run.

The code for it can be downloaded here: 

```PowerShell
<#
.SYNOPSIS
Execute a stored procedure multiple times to simulate a crude workload

.DESCRIPTION
To easily create a workload by running a stored procedure multiple times in parallel, with optional randomized delays.

.PARAMETER InstanceName
The SQL Server instance name to run on.

.PARAMETER DatabaseName
The database where the stored procedure is located.

.PARAMETER StoredProcName
The name of the stored procedure to execute including the schema name

.PARAMETER ParamName
The name of the parameter to pass to the proc

.PARAMETER Threads
Number of parallel executions of the proc to run at the same time

.PARAMETER MinId
The minimum value to pass to the parameter defined in ParamName. This defines the lower bound of a randomizer

.PARAMETER MaxId
The maximum value to pass to the parameter defined in ParamName. This defines the upper bound of a randomizer

.PARAMETER MinDelay
The lower bound of the delay between executions in milliseconds

.PARAMETER MaxDelay
The upper bound of the delay between executions in milliseconds

.PARAMETER IterateSeconds
The number of seconds to run the procs in a loop before stopping

.NOTES
This proc is quite a crude way to run a simple single-valued stored procedure in a loop for demo purposes.
It could be extended to accept a hashtable of parameters.


Author: Mark Allison, Sabin.IO <home@markallison.co.uk>

.EXAMPLE
.\ExecProc_SQLClient.ps1 `
    -InstanceName "SQL01" `
    -DatabaseName "WideWorldImporters" `
    -StoredProcName "Sales.GetBasket" `
    -ParamName BasketID `
    -Threads 20 `
    -MinId 1 `
    -MaxId 1000 `
    -MinDelay 10 `
    -MaxDelay 150 `
    -IterateSeconds $IterateSeconds

    This will run proc Sales.GetBasket with a BasketId ranging between 1 and 1000, with 20 parallel threads as background tasks. There will be a randomized delay on each thread varying between 10 and 150ms.
#>
   [cmdletbinding()]
param (
    [string][Parameter(Mandatory=$true)]$InstanceName,
    [string][Parameter(Mandatory=$true)]$DatabaseName,
    [string][Parameter(Mandatory=$true)]$StoredProcName,
    [string][Parameter(Mandatory=$true)]$ParamName,
    [string][Parameter(Mandatory=$true)]$Threads,
    [string][Parameter(Mandatory=$true)]$minId,
    [string][Parameter(Mandatory=$true)]$maxId,
    [string][Parameter(Mandatory=$false)]$minDelay=10,
    [string][Parameter(Mandatory=$false)]$maxDelay=100,
    [int]$IterateSeconds # number of Seconds to run in a loop
)

for ($i=1; $i -le $Threads; $i++) {
    Start-Job -ScriptBlock {
        $StartTime = Get-Date
        $conn = New-Object System.Data.SqlClient.SqlConnection
        $conn.ConnectionString = "Data Source=$($using:InstanceName);Initial Catalog=$($using:DatabaseName);Integrated Security=SSPI;Application Name=PowerShell.SabinDataLoader;"
        $conn.Open()
        do {

            $id = (Get-Random -Minimum $using:minId -Maximum $using:maxId)
            $SleepMs = (Get-Random -Minimum $using:minDelay -Maximum $using:maxDelay)
            $cmd = $Null
            $cmd = New-Object System.Data.SqlClient.SqlCommand
            $cmd.connection = $conn
            $cmd.CommandType = [System.Data.CommandType]::StoredProcedure
            $cmd.Parameters.AddWithValue("@$($using:ParamName)",$id) | Out-Null
            $cmd.commandtext = $using:StoredProcName
            $result = $cmd.executenonquery()
            Start-Sleep -Milliseconds $SleepMs
        }
        While ((Get-Date) -le $StartTime.AddSeconds($using:IterateSeconds))
        $conn.close()
    }
}
#Get-Job | Wait-Job
#Get-Job | Remove-Job
```

For example if you want to execute a procedure called `Sales.GetBasket` in parallel over 20 processes for an hour: then run it like so:

```powershell
.\ExecProc_SQLClient.ps1 `
    -InstanceName "SQL01" `
    -DatabaseName "WideWorldImporters" `
    -StoredProcName "Sales.GetBasket" `
    -ParamName BasketID `
    -Threads 20 `
    -MinId 1 `
    -MaxId 1000 `
    -MinDelay 10 `
    -MaxDelay 150 `
    -IterateSeconds 3600
```

The output will look something like this:

```text
Id     Name            PSJobTypeName   State         HasMoreData     Location             Command
--     ----            -------------   -----         -----------     --------             -------
1      Job1            BackgroundJob   Running       True            localhost            ...
3      Job3            BackgroundJob   Running       True            localhost            ...
5      Job5            BackgroundJob   Running       True            localhost            ...
7      Job7            BackgroundJob   Running       True            localhost            ...
9      Job9            BackgroundJob   Running       True            localhost            ...
11     Job11           BackgroundJob   Running       True            localhost            ...
13     Job13           BackgroundJob   Running       True            localhost            ...
15     Job15           BackgroundJob   Running       True            localhost            ...
17     Job17           BackgroundJob   Running       True            localhost            ...
19     Job19           BackgroundJob   Running       True            localhost            ...
21     Job21           BackgroundJob   Running       True            localhost            ...
23     Job23           BackgroundJob   Running       True            localhost            ...
25     Job25           BackgroundJob   Running       True            localhost            ...
27     Job27           BackgroundJob   Running       True            localhost            ...
29     Job29           BackgroundJob   Running       True            localhost            ...
31     Job31           BackgroundJob   Running       True            localhost            ...
33     Job33           BackgroundJob   Running       True            localhost            ...
35     Job35           BackgroundJob   Running       True            localhost            ...
37     Job37           BackgroundJob   Running       True            localhost            ...
39     Job39           BackgroundJob   Running       True            localhost            ...
41     Job41           BackgroundJob   Running       True            localhost            ...
43     Job43           BackgroundJob   Running       True            localhost            ...
45     Job45           BackgroundJob   Running       True            localhost            ...
47     Job47           BackgroundJob   Running       True            localhost            ...
```
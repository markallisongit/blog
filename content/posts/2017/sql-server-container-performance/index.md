---
title: "Sql Server Container Performance"
date: 2017-02-12T22:19:17Z
lastmod: 2017-02-12T22:19:17Z
draft: false
author: Mark
tags: [containers,sql-server]
categories: [containers]
lightgallery: true
---
## Is SQL Server in a container faster than a VM?

I briefly looked at SQL Server containers when Windows Server 2016 was released. Containers offer the ability for rapid provisioning, and denser utilization of hardware because the container shares the base OS’s kernel. There is not a need for a Hyper-Visor layer in between. As a recap for those that are not up speed with containers, the traditional architecture of databases in a VM is like so:

{{< image src="image_28.png" caption="Virtual machine architecture" >}}

The Hyper-Visor OS is installed onto the host hardware, a physical server in the data centre. Many VMs are created on the Hyper-Visor layer to host more operating systems. These operating systems can be anything and do not need to share the host kernel. This allows BSD, Linux or old versions of Windows to be installed on Hyper-V 2016, for example. Once the guest OS inside the VM is installed, we install SQL Server as the main application in the VM.

Windows Containers allow us to get closer to the hardware by removing the need for two operating system layers and the hypervisor. Containers allow us to do this:

{{< image src="image_30.png" caption="Container architecture" >}}


The host operating system is installed on the physical server hardware. The container software which hosts and manages the containers is installed on the host OS. In Windows this is the Windows Containers feature and can only be used on Windows Server 2016 and later. Containers have been around for a long time on Linux and the post popular is docker which uses RunC as the base container software. There are other container engines out there (for example LXC), but we won’t go into that here, this blog post is long enough already.

With this in mind it would seems reasonable that containers should outperform virtual machines for databases as there are less layers between the database engines and the hardware. Right? I was surprised by what I found. Before we go through the test results, I will take you through how I set it up.

## Hardware spec

* Intel i7 4771 4 core hyper-threaded (8 logical cores)
* 32 GB RAM
* 4 x 4TB RAID-5 disk
* 1 x 256 GB Samsung Evo 850 SSD
* Windows Hyper-V 2016 Core Base OS

### VM Config

* 8 vCPU
* 8GB RAM
* Windows Server 2016 Core
* SQL Server 2016 SP1 Developer Edition Core

Container Details:

* SQL Server 2016 SP1 Developer Edition Core image

## Installation of SQL Server in VM

To try and keep the comparison as similar as possible, Windows Server 2016 Core was used for the VM OS which matches the host OS of Hyper-V 2016 Core where the containers will run. In case you’re interested in installing SQL Server 2016 on Core, it’s quite straight-forward, however delegation must be used when installing across WinRM or if you can’t use Kerberos, use CredSSP Authentication, described below. Alternatively you could RDP to the Core machine and run setup.exe from there without having to use delegation. I prefer not to use RDP on servers, and install Core whenever possible to reduce attack surface and patching footprint. I’m waiting for SQL Server on Nano Server to be supported! Come on, Microsoft…

In Hyper-V I took a Checkpoint, presented a SQL Server 2016 SP1 slipstreamed ISO to the VM as a DVD drive and then ran these commands:

```
PS C:\Users\mark> Enter-PSSession wisteria
[wisteria]: PS C:\Users\mark\Documents> Get-Volume

DriveLetter FileSystemLabel FileSystem DriveType HealthStatus OperationalStatus SizeRemaining      Size
----------- --------------- ---------- --------- ------------ ----------------- -------------      ----
E           SQL2016_x64_ENU CDFS       CD-ROM    Healthy      OK                          0 B   2.53 GB
            Recovery        NTFS       Fixed     Healthy      OK                     137.6 MB    450 MB
D           Data            NTFS       Fixed     Healthy      OK                     99.76 GB  99.87 GB
C                           NTFS       Fixed     Healthy      OK                    118.85 GB 126.45 GB
```

Because I’m installing SQL Server over WinRM, we must either use delegation or use CredSSP. When using CredSSP you can’t use Enter-PsSession because that caches credentials so we need to use Invoke-Command to make the WinRM connection. I used CredSSP in this instance and to set it up follow these instructions: http://stackoverflow.com/a/8436654/38211 Alternatively you can set up AD to allow the user installing the account to be trusted for delegation and trust the COMPUTER you are installing on for delegation.

Let’s set our credentials to connect with:

```powershell
$credential = Get-Credential
Invoke-Command -ComputerName wisteria -Authentication CredSSP -Credential $credential { & E:\setup.exe /q /ACTION=Install /FEATURES=SQLEngine /INSTANCENAME=MSSQLSERVER /SQLSVCACCOUNT="DUCK\sv_sql_wisteria" /SQLSVCPASSWORD=******** /SQLSYSADMINACCOUNTS="duck\mark" /AGTSVCACCOUNT="duck\sv_sqa_wisteria" /AGTSVCPASSWORD="********" /INSTALLSQLDATADIR=D:\ /TCPENABLED=1 /UPDATEENABLED="False" /IACCEPTSQLSERVERLICENSETERMS }
```

See https://msdn.microsoft.com/en-us/library/ms144259.aspx for the full list of unattended options. We can see that our SQL Server is up and running now with:

`PS C:\Users\mark> Invoke-Command -ComputerName wisteria { Get-Service mssql* }`

Results:

```
Status   Name               DisplayName                            PSComputerName
------   ----               -----------                            --------------
Running  MSSQLSERVER        SQL Server (MSSQLSERVER)               wisteria
```

```powershell
Invoke-Command -ComputerName wisteria { Get-Content D:\MSSQL13.MSSQLSERVER\MSSQL\Log\ERRORLOG | Select-Object -First 20 }
```

Results:

```
2017-02-04 22:49:37.78 Server      Microsoft SQL Server 2016 (SP1) (KB3182545) - 13.0.4001.0 (X64)
        Oct 28 2016 18:17:30
        Copyright (c) Microsoft Corporation
        Developer Edition (64-bit) on Windows Server 2016 Datacenter Evaluation 6.3 <X64> (Build 14393: ) (Hypervisor)

2017-02-04 22:49:37.82 Server      UTC adjustment: 0:00
2017-02-04 22:49:37.82 Server      (c) Microsoft Corporation.
2017-02-04 22:49:37.82 Server      All rights reserved.
2017-02-04 22:49:37.82 Server      Server process ID is 2476.
2017-02-04 22:49:37.82 Server      System Manufacturer: 'Microsoft Corporation', System Model: 'Virtual Machine'.
2017-02-04 22:49:37.82 Server      Authentication mode is WINDOWS-ONLY.
2017-02-04 22:49:37.82 Server      Logging SQL Server messages in file 'D:\MSSQL13.MSSQLSERVER\MSSQL\Log\ERRORLOG'.
2017-02-04 22:49:37.82 Server      The service account is 'DUCK\sv_sql_wisteria'. This is an informational message; no user action is required.
2017-02-04 22:49:37.84 Server      Registry startup parameters:
         -d D:\MSSQL13.MSSQLSERVER\MSSQL\DATA\master.mdf
         -e D:\MSSQL13.MSSQLSERVER\MSSQL\Log\ERRORLOG
         -l D:\MSSQL13.MSSQLSERVER\MSSQL\DATA\mastlog.ldf
2017-02-04 22:49:37.84 Server      Command Line Startup Parameters:
         -s "MSSQLSERVER"
2017-02-04 22:49:37.92 Server      SQL Server detected 1 sockets with 8 cores per socket and 8 logical processors per socket, 8 total logical processors; usi
ng 8 logical processors based on SQL Server licensing. This is an informational message; no user action is required.
```

```powershell
& sqlcmd -S wisteria -E -Q "select @@version"
```
```
Microsoft SQL Server 2016 (SP1) (KB3182545) - 13.0.4001.0 (X64)
        Oct 28 2016 18:17:30
        Copyright (c) Microsoft Corporation
        Developer Edition (64-bit) on Windows Server 2016 Datacenter Evaluation 6.3 <X64> (Build 14393: ) (Hypervisor)
```

## Installation of SQL Server in a Windows Container

I am using SQL Server 2016 SP1 Developer Edition for the VM, so let’s build a container image for Developer Edition. I stole the docker code from the Microsoft Express Edition on docker hub. My version can be found here: https://github.com/markallisongit/docker-mssql2016sp1-dev 

* Unzip the SQL Server 2016 with SP1 ISO image to a directory on your Hyper-V Host. ISO can be downloaded from here if you don’t have it: https://www.microsoft.com/en-gb/sql-server/sql-server-editions-developers
* Make sure you have the windowsservercore docker image already pulled down. You can do this with `docker pull microsoft/windowsservercore` See https://hub.docker.com/r/microsoft/windowsservercore/ for more details
* Build the docker image from your dockerfile with: `docker build -t mssql-2016-dev`.

This might take a while to build as it has to copy the setup files to the container and then run setup inside the container. Once this is done, you can create a SQL Server instance in a windows container with:

`docker run -d -p 1433:1433 -e sa_password=<my_very_secure_password> -e ACCEPT_EULA=Y -v D:/mssql/:C:/temp/ --name mssql mssql-2016-dev`

`docker ps`

```
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                    NAMES
8251d4fd533b        mssql-2016-dev      "cmd /S /C 'powers..."   11 seconds ago      Up 4 seconds        0.0.0.0:1433->1433/tcp   mssql
```

`exit`

```powershell
& sqlcmd -S lithium,1433 -Usa -P<my_very_secure_password> -Q "select @@version"
```

Results:

```
Microsoft SQL Server 2016 (SP1) (KB3182545) - 13.0.4001.0 (X64)
        Oct 28 2016 18:17:30
        Copyright (c) Microsoft Corporation
        Developer Edition (64-bit) on Windows Server 2016 Datacenter 6.3 <X64> (Build 14393: ) (Hypervisor)
```

Before we get into testing the performance of the VM vs. the container, a few notes about working with containers. At the moment it’s not possible to WinRM into a container from a remote host. It is possible if you RDP onto the host and then run `docker exec -it mssql powershell` where mssql is the name of my container. We can now run commands inside the container:

```powershell
Get-Content "C:\Program Files\Microsoft SQL Server\MSSQL13.SQL2016DEV\MSSQL\Log\ERRORLOG" -first 20
```

Results:

```
2017-02-11 10:57:17.67 Server      Microsoft SQL Server 2016 (SP1) (KB3182545) - 13.0.4001.0 (X64)
        Oct 28 2016 18:17:30
        Copyright (c) Microsoft Corporation
        Developer Edition (64-bit) on Windows Server 2016 Datacenter 6.3 <X64> (Build 14393: ) (Hypervisor)

2017-02-11 10:57:17.67 Server      UTC adjustment: 0:00
2017-02-11 10:57:17.67 Server      (c) Microsoft Corporation.
2017-02-11 10:57:17.67 Server      All rights reserved.
2017-02-11 10:57:17.67 Server      Server process ID is 8240.
2017-02-11 10:57:17.67 Server      Authentication mode is MIXED.
2017-02-11 10:57:17.67 Server      Logging SQL Server messages in file 'C:\Program Files\Microsoft SQL Server\MSSQL13.SQL2016DEV\MSSQL\Log\ERRORLOG'.
2017-02-11 10:57:17.68 Server      The service account is 'WORKGROUP\8251D4FD533B$'. This is an informational message; no user action is required.
2017-02-11 10:57:17.68 Server      Registry startup parameters:
         -d C:\Program Files\Microsoft SQL Server\MSSQL13.SQL2016DEV\MSSQL\DATA\master.mdf
         -e C:\Program Files\Microsoft SQL Server\MSSQL13.SQL2016DEV\MSSQL\Log\ERRORLOG
         -l C:\Program Files\Microsoft SQL Server\MSSQL13.SQL2016DEV\MSSQL\DATA\mastlog.ldf
2017-02-11 10:57:17.68 Server      Command Line Startup Parameters:
         -s "SQL2016DEV"
2017-02-11 10:57:17.72 Server      SQL Server detected 1 sockets with 4 cores per socket and 8 logical processors per socket, 8 total logical processors; using 8 logical processors based on SQL Server licensing. This is an informational message; no user action is required.
2017-02-11 10:57:17.72 Server      SQL Server is starting at normal priority base (=7). This is an informational message only. No user action is required.
```

## SQL Server Configuration

Max memory was set to 7GB on both instances.

Simple recovery model so we don’t have to worry about log backups impacting performance.

## Install HammerDB on workstation

Get from http://www.hammerdb.com/ and install the Windows 64 bit version.

{{< image src="image3.png" caption="HammerDB" >}}

Expand TPC-C, Schema Build, Options. Then follow this guide to set it up. http://www.hammerdb.com/hammerdb_quickstart_mssql.pdf

Here are my settings for this test.

{{< image src="image_8.png" caption="HammerDB settings" >}}

It will take a while (took around 10 mins on my machine) to create the test data depending on the settings supplied above. It is generally a good idea to set the number of virtual users to the number of logical cores on your test box (I have 8).

### TPC-C Driver Options

On the driver options tab you need to input your Autopilot settings so you can run a series of tests in a row without having to start them all manually. This will run multiple tests in serial with differing numbers of users. I have used these settings:

{{< image src="image_10.png" caption="HammerDB settings" >}}

Once you have configured your driver settings, you need to load the TCL driver script into HammerDB by double-clicking on the Load button.

### Autopilot settings

{{< image src="image_14.png" caption="HammerDB autopilot options" >}}

## Testing results

I ran four sets of tests:

1. Container on RAID-5 spinning disk
1. VM on RAID-5 spinning disk
1. Container on single SSD
1. VM on single SSD

Before each autopilot test we want to have SQL Server in the same state so the results aren’t skewed. As there are a lot of writes in the TPC-C test, we want to ensure stats are up to date. Once stats have run let’s flush dirty pages to disk with a `CHECKPOINT`, and then clear the wait stats from the buffer, and then clear the buffer pool with `DBCC DROPCLEANBUFFERS`. Here are the commands I run before each test:

```tsql
use [tpcc]
exec sp_updatestats
CHECKPOINT
DBCC SQLPERF (N'sys.dm_os_wait_stats', CLEAR);
DBCC DROPCLEANBUFFERS
```

Now double-click the Autopilot button and the tests will start. Time for a cup of tea! I also like to run performance monitor as well so I can see that there’s some activity going on. I like to monitor CPU and disk latency with counters **Processor:% Processor Time** and **Logical Disk: Avg. Disk Sec/read** and **Logical Disk:Avg. Disk Sec/write**.

Results below show numbers of virtual users and transactions per minute (TPM) numbers

{{< image src="image_32.png" caption="HammerDB autopilot options" >}}

If we chart the above by storage we see this:

### RAID-5 comparison

{{< image src="image_34.png" caption="RAID-5" >}}

The container seems a bit faster up to four users, but then trails off with the VM being faster later on.

### SSD comparison

{{< image src="image_36.png" caption="SSD" >}}

Again, the container seemed much faster than the VM up to 4 users, but then the VM seemed to overtake in performance until the server was saturated above 16 users.

### All results together

{{< image src="image_38.png" caption="All tests" >}}

Excel spreadsheet containing wait stats for each test: https://github.com/markallisongit/tpcc-container-test/blob/master/tpcc%20results.xlsx

## What’s it all mean?

When I started writing this article I fully expected the container to outperform the VM by a factor of 10-20%. However it seems that on my very modest hardware, it is difficult to draw any real conclusions. It seems to me that the stateless nature of containers is not really suited to databases, and there is not a compelling enough reason from a performance standpoint to recommend containers for database hosting in an enterprise environment.

## DevOps, CI and CD

That said, I think that containers may be useful for databases when implementing continuous integration (CI) or continuous deployment (CD), especially in a cloud environment because containers take such a short amount of time to create and destroy. For example on my system it can take around ten minutes to provision a VM with SQL Server running on it using an automated PowerShell script and an unattended install of SQL Server. Conversely a new container takes about five seconds to get up and running.

I will be thinking about these issues over the coming weeks and expect another article soon exploring the role of containers for databases in the enterprise and why you might want to look into it for yourself.
---
title: "Running Sql Server in an Azure Container Instance"
date: 2017-10-24T15:50:31Z
lastmod: 2017-10-24T15:50:31Z
draft: false
author: Mark
tags: [sql-server,azure,containers,azure-container-instances]
categories: [containers]
lightgallery: true
---
Azure Container Instances are still in Preview and not officially available for Windows yet, which made me smile. It took me a while to figure out how to get this working so I thought I’d share what I’ve found. Containers are great for lightweight testing of code before deployment to production servers because they can be created so quickly and they give the same environment to test in very reliably. Now that Microsoft is offering container instances in Azure it means you don’t have to worry about provisioning and configuring your own docker host/cluster. The options for deploying SQL Server are really getting large now, look at this list below!

## Azure

* Azure Container Instance on Linux
* Azure Container Instance on Windows (not available at time of writing but seems to work)
* Azure SQL Database
* SQL Server in an Azure Windows VM
* SQL Server in an Azure Linux VM

I think the above can be done in a similar way in AWS but I don’t have much experience with that.

## On Premises

* SQL Server on bare metal (Windows and Linux)
* SQL Server in a Virtual Machine (Windows and Linux guests)
* SQL Server in a docker container (Windows and Linux docker hosts)

It’s pretty bewildering and your choice will depend on your specific use case, and budget. For a CI pipeline, containers are a great choice, and now that we can do this in the Cloud we have even more flexibility at a cheaper price. Let’s dive in and see it in action.

## Create an Azure Container Instance

If you would like to see a demo of this in action see the video below:

{{< youtube zg2Oi4AI0mg >}}

1. Log in to Microsoft Azure.
1. Open an Azure Cloud Shell and choose bash (PowerShell should also work).
1. Create a new resource group. Containers require an empty resource group right now, not sure if this will change in the future.

`az group create –name containerRG –location eastus`

Now create your MSSQL container with:

`az container create --image microsoft/mssql-server-linux --name mssql-container-group –resource-group containerRG --cpu 1 --memory 3.5 --port 1433 --ip-address public -e ACCEPT_EULA=Y MSSQL_SA_PASSWORD=<strong_password> MSSQL_PID=Developer MSSQL_COLLATION=Latin1_General_CI_AS MSSQL_ENABLE_HADR=Y --location eastus`

{{< image src="containercreate.png" caption="az container create" >}}

At the time of writing only three locations are supported: eastus, westus and westeurope

After about 2 minutes the container will be ready to use.

We can verify by connecting to it from `sqlcmd` in Azure cloud shell or by PowerShell:

{{< image src="invokesqlcmdtest.png" caption="test the connection" >}}

To view the logs we can do:

az container logs --resource-group containerRG --name mssql-container-group

image

<snip>

Let’s delete the container with:

`az container delete --name mssql-container-group --resource-group containerRG`

Now delete the resource group

`az group delete –name containerRG`

Using Azure Container Instances is not quite as fast as using an on-premises container because the image has to be downloaded every time, however it is much cheaper than maintaining your own in-house docker host. Unfortunately I couldn’t find a way to stop and start the container, so it needs to be created from scratch and then deleted after use at the time of writing. I thought I would find a command like `az container start` and `az container stop` but they’re not implemented (yet). Even so, using Azure Container Instances could be a compelling option in a CI/CD pipeline.

I’m sure that this time next year the experience will be much richer and we’ll have even more options! Enjoy.
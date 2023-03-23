---
title: "Which ADF Runtime for my workload?"
date: 2023-03-23T08:26:42Z
lastmod: 2023-03-23T08:26:42Z
draft: false
author: Mark
tags: [azure, azure-data-factory, performance]
lightgallery: true
---

## Self Hosted or Managed Virtual Network for ADF?

I was recently asked which runtime would be better to run ADF pipelines in Azure, use Private Managed Endpoints with the Managed Virtual Network, or provision a Self-Hosted Integration Runtime on a Virtual Machine.

### PaaS vs. IaaS

{{< image src="cloud-models.png" caption="Cloud Models. [Image Source](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/strategy/monitoring-strategy)" >}}

My default position on which technology to use is PaaS *where possible*. Organisations should focus on providing value to their business, not micro-managing infrastructure. PaaS reduces the operational burden of managing infrastructure in most cases.

This ease of operation comes at a cost of reduced flexibility, and sometimes performance.

## Test

Let's do a semi-scientific test and move some data from Azure Data Lake Storage (ADLS) Gen2 to Azure SQL Managed Instance (SQLMI) using Azure Data Factory (ADF) with both private managed endpoints using the Managed Virtual Network Integration Runtime, and self hosted Integration Runtime in a VM that we provision and control.

I am using the [UK Land Registry Price Paid full dataset](https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads) for this test which is a decent size, but not too big. ~5 GB of data in ~30 million rows.

### Code provided

Code for this test and demo has been provided including the entire infrastructure [here](https://github.com/markallisongit/Scripts/tree/5-create-bicep-for-adf-private-link-sqlmi-demo/adf-ir-sqlmi-demo) so you can follow along and perform your own tests with your own data if desired.

### Sketch

{{< image src="sketch.png" caption="Infrastructure provisioned by included code" >}}

A bit messy but I talk through this in the video below

### Managed Virtual Network (PaaS)

This allows you to provision a connection to your private endpoints from ADF without going over the public internet and without having to provision and manage a VM in your Vnet.

Azure provisions a VM for you but you don't have to manage or patch it, you then create private connections to the resources you want and approve the connections from ADF in those resources.

When developing in ADF using the Managed Virtual Network, interactive authoring must be switched on, and you will have to wait a few minutes for the provisioning of the VM. Once this is done, you will be able to connect to your private resources but you will be charged by the minute for the time this is running (similar to a standard VM).

{{< image src="interactive-authoring.jpg" caption="Enabling interactive authoring with Managed Virtual Network" >}}

{{< image src="sqlmi-private-managed-endpoint.jpg" caption="Approve the SQLMI Private Managed Endpoint for ADF" >}}

{{< image src="adls-private-endpoint.jpg" caption="Approve the ADLSg2 Private  Endpoint Connection for ADF" >}}

Once the approvals are done and the Integration Runtime has warmed up you should be able to connect to your sources and sinks in ADF securely over private links and develop your pipeline!

{{< image src="managed-virtual-network-running.jpg" caption="The Managed Private Network Running" >}}

### Self-hosted Integration Runtime (IaaS)

After provisioning a VM, you will need to download and install the integration runtime inside the VM and connect it to your Azure Data Factory. Once this is done, the Integration Runtime will show as Running when your VM is started.

To save costs, the VM could be scheduled to start with an Azure Function, and scheduled to stop with the built-in extension for Dev/Test VMs as shown in the bicep template.

## Performance

I tested three loads using each Integration Runtime and here are the results.

{{< image src="adf-monitor-page.jpg" caption="ADF Results" >}}

The Self-Hosted Integration runtime was 6% faster using a `Standard_B2s` VM Size. I sized the VM up to a `D32ads_v5` (32 vcores, 128 GB RAM) out of curiosity (without scaling the sources or sinks) with this result:

{{< image src="self-hosted-32-cores.jpg" caption="ADF Results with 32 Cores" >}}

> The recommended configuration for the Integration Runtime (Self-hosted) machine is 2 GHz, 4 Core CPU, 8 GB Memory and 80 GB disk. e.g. D4lds_v5

It seems that the recommended configuration performs well enough with no extra gains using a larger VM for the Integration Runtime.

{{< image src="all-results.jpg" caption="ADF Results with 32 Cores" >}}


## Conclusion

### Managed Virtual Network 

Pros:

* Don't have to manage and provision your own VM, therefore cheaper to operate
* Cheaper to run

Cons:

* Need to wait for it to warm up when authoring or running pipelines
* Lower performance, but should be adequate for most
* Private Endpoints a bit fiddly to set up, but that's a one time process

### Self-Hosted

Pros:

* More control over performance
* Always on when your VM is running
* Simpler configuration - private endpoints in a Managed Virtual Network not required

Cons:

* More expensive to run
* More expensive to operate - staff need to patch and troubleshoot any issues with the VM

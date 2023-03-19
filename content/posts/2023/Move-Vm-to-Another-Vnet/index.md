---
title: "How to Move a VM to Another Vnet in Azure"
date: 2023-03-19T09:20:12Z
lastmod: 2023-03-19T09:20:12Z
draft: false
author: Mark
tags: [azure, maintenance, networking, bicep]
lightgallery: false
---
Hello everyone,

In this blog post, I want to share with you a problem that I faced this week with moving a VM from one vnet to another in Azure. It was not as easy as I expected and it required some downtime.

## The problem

I had a VM that needed to move to another vnet as part of organisational change. 

I thought it would be a simple task of creating a new network interface card (NIC) in the target vnet and attaching it to the VM. However, it seems that it's not possible to create a NIC in another Vnet and attach it to a VM attached to a different vnet. Also, as you may know a VM must have at least one NIC attached at all times which must be connected to a vnet.

I had a quick Google for a solution and found out that Azure does not support moving VMs between vnets directly. It is however possible to move between subnets in the same vnet, which doesn't help me in this instance.

The only way to do it is to delete the VM (not the disks) and recreate it with a new NIC in the target vnet. This meant that we had to schedule some out-of-hours downtime.

## The solution

Here are the steps that I took:

1. **Take a backup of the VM**. Just in case.
1. **Delete the original VM**. Make sure not to delete its disks or any other resources attached to it such as public IP or NSG.
1. **Create a new NIC** in the target vnet as part of a new VM configuration in PowerShell. 
1. **Create a new VM** using the VM configuration created above

I have provided some bicep code to demo the infrastructure and a PowerShell script to move the VM from one vnet to another so you can play around with it yourself. Here are the resources that will be deployed as part of the demo.

{{< image src="resources.jpg" caption="Azure resources deployed for demo" >}}

 A better way to do this would be to redeploy the VM using bicep, but in this instance I used PowerShell to show what's happening step-by-step.

## Recovery Services Vault

I have tested the move with a VM backed up to Recovery Services Vault and it works fine.

## A suggestion for Microsoft

I think Microsoft should improve this feature of moving VMs between vnets in Azure. It would be much easier if we could just create a new NIC in another vnet and attach it to an existing VM without deleting it first.

This would minimise any disruption to running machines.

## Code 

Click [this link](https://github.com/markallisongit/Scripts/tree/main/move-vm-between-vnets) to get the code to deploy the VM with two vnets and a PowerShell script to move the VM from one Vnet to another preserving the Public IP and disks.

## A video demo

If you would like to see me deploy the VM using bicep and then move it to a new vnet using the code provided above, have a look at this short video.

{{< youtube 9eKkLeq9FLs >}}
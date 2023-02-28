---
title: "The Importance of Testing Your Azure Backups"
date: 2023-02-28T10:37:04Z
lastmod: 2023-02-28T13:02:04Z
draft: false
author: Mark
tags: [azure, disaster-recovery, resilience]
lightgallery: false
---

## My recent experience

Disaster recovery testing is a critical aspect of any organization's infrastructure. It is crucial to regularly test the resilience of your systems and make sure that they are properly backed up and can be restored in case of an emergency. Recently, a VM that had been restored as part of disaster recovery testing would not start but entered an infinite blue-screen boot loop.

{{< image src="2023-02-10_10-30-17.jpg" caption="Blue screen loop" >}}

## Testing Backups

As part of disaster recovery resilience testing, I restored a virtual machine from **Azure Recovery Services Vault**. The first test was done using the latest snapshot backup, and it took around two minutes to complete. However, when I checked the overview page for the virtual machine in the Azure portal, I noticed that the virtual machine agent status was not ready. This meant that I couldn't connect to the VM, not even from within the virtual network.

{{< image src="2023-02-09_11-52-03.jpg" caption="Failed to connect to RDP port using Private Endpoint" >}}

{{< image src="2023-02-10_08-34-39.jpg" caption="Agent Status Not Ready" >}}

To troubleshoot the issue, I turned on the boot diagnostics and restarted the virtual machine. After a few moments, I could see from the console that the machine had blue screened and was restarting into an infinite blue screen loop. I tried deleting the virtual machine and restoring from the snapshot backup from the previous day, but the issue persisted. I then attempted to restore from a standard backup in the recovery services vault, but this also exhibited the same behavior, taking around 30 minutes to complete.

{{< image src="2023-02-09_13-08-13.jpg" caption="Enabling boot diagnostics" >}}

## Snapshot the production OS Disk

To see if the issue was related to the OS Disk, the actions are

* Restore the production VM to a new machine
* Create a snapshot of the production OS Disk
* Create a Managed disk from the snapshot
* Swap the newly created managed disk for the OS Disk in the restored test VM (this will stop the VM)
* Start the VM

The restored VM was now up and running.

## Reproduce it

I have created some [bicep and PowerShell code](https://github.com/markallisongit/Scripts/tree/main/azure-vm-restore-failure) to reproduce how I fixed the failing VM in case it helps you out. See the video for a walk-through.

### Video demo

{{< youtube yLSyaXA9gYo >}}

## Conclusion

Testing your backups is essential to ensure the resilience of your systems in case of an emergency. Some organisations don't take the time to test backups, but it really could save you one day.
---
title: "The Importance of Testing Your Azure Backups"
date: 2023-02-10T10:37:04Z
lastmod: 2023-02-10T10:37:04Z
draft: false
author: Mark
tags: [azure, disaster-recovery, resilience]
lightgallery: false
---

## My recent experience

Disaster recovery testing is a critical aspect of any organization's infrastructure. It is crucial to regularly test the resilience of your systems and make sure that they are properly backed up and can be restored in case of an emergency. Here is a recent experience with testing the restore of a virtual machine in Azure.

## Testing the Backups

As part of disaster recovery resilience testing, I restored a virtual machine from **Azure Recovery Services Vault**. The first test was done using the latest snapshot backup, and it took around two minutes to complete. However, when I checked the overview page for the virtual machine in the Azure portal, I noticed that the virtual machine agent status was not ready. This meant that I couldn't connect to the virtual machine, not even from within the virtual network.

{{< image src="2023-02-09_11-52-03.jpg" caption="Failed to connect to RDP port using Private Endpoint" >}}

{{< image src="2023-02-10_08-34-39.jpg" caption="Agent Status Not Ready" >}}

To troubleshoot the issue, I turned on the boot diagnostics and restarted the virtual machine. After a few moments, I could see from the console that the machine had blue screened and was restarting into an infinite blue screen loop. I tried deleting the virtual machine and restoring from the snapshot backup from the previous day, but the issue persisted. I then attempted to restore from a standard backup in the recovery services vault, but this also exhibited the same behavior, taking around 30 minutes to complete.

{{< image src="2023-02-09_13-08-13.jpg" caption="Enabling boot diagnostics" >}}

{{< image src="2023-02-10_10-30-17.jpg" caption="Blue screen loop" >}}

## Support Request Raised

In light of these issues, I have raised a support request with Microsoft and am now waiting to hear back from them regarding the next steps. It is crucial to note that the backups were happening successfully on a regular basis every 24 hours. However, it seems that I am unable to restore any of the backups and successfully connect to the virtual machine due to the agent status being unavailable.

## Conclusion

Testing your backups is essential to ensure the resilience of your systems in case of an emergency. In my experience, restoring a virtual machine from the recovery services vault in Azure was not as straightforward as I had hoped. Nevertheless, I am hopeful that the support team at Microsoft will assist me in resolving the issue and restoring the virtual machine successfully. Regular testing and troubleshooting of your backup and restore process can prevent disasters and ensure that your systems are always ready when you need them the most.
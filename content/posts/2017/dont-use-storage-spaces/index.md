---
title: "Dont Use Storage Spaces"
date: 2017-07-24T16:51:18Z
lastmod: 2017-07-24T16:51:18Z
draft: true
author: Mark
tags: [storage-spaces]
categories: [storage]
lightgallery: false
---
… if you care about performance in the slightest bit. That’s it really. You don’t need to read any further.

What are storage spaces? Have a read of this quick overview: https://www.windowscentral.com/how-use-storage-spaces-windows-10

I had some spare computer parts laying around so I thought I’d rebuild my Windows 10 desktop at home. I have 4 x 4TB Hitachi SATA drives and a hardware RAID controller spare so decided to put them in my desktop. I had heard of storage spaces and wanted to try it out to see how performance would be considering there was no extra hardware involved in creating the pool. It seems that my expectations were confirmed.

Test configurations
Storage spaces in two-way mirror mode and intuitively you’d think your data would be striped across half the disks and then mirrored, right? Well, I had a look online and there doesn’t seem to be any confirmation that this happens at all, so let’s assume it doesn’t.  I will assume it’s a JBOD of mirrors rather than a stripe across half which is then mirrored (RAID10).
clip_image001
Storage spaces in parity mode. This conceptually is the same as RAID5 in that one of the disks is used to store parity information.
clip_image001[6]
Hardware RAID controller in RAID10 presenting one logical drive to Windows
Hardware RAID controller in RAID5 presenting one logical drive to Windows
Results
Storage spaces in two-way mirror mode
clip_image001[8]
Storage spaces in parity mode
clip_image001[10]
Hardware RAID10
clip_image001[12]
Hardware RAID5
clip_image001[14]
Here’s the performance of a single 4TB drive:

clip_image001[16]

Here’s the performance of a Samsung 850 Evo 256GB SSD for comparison:

clip_image001[18]

Conclusion
Don’t use storage spaces, cough up and buy a hardware RAID controller, it’s worth it.
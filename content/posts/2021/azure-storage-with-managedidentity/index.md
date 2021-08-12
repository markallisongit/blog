---
title: "Azure Storage With Managed Identity"
date: 2021-08-12T12:52:51+01:00
lastmod: 2021-08-12T12:52:51+01:00
draft: false
author: Mark
tags: [azure, managed-identity, azure-storage, powershell]
lightgallery: false
---
On 11th August 2021, [I wrote about]({{< ref "connect-mi-with-managedidentity.md" >}}) how to connect to a SQL Managed Instance using a Managed Identity in an automated PowerShell script. What if you want to output the results of a query against a SQLMI and store them in a file in Azure Blob Storage?

This could be part of a loosely coupled system architecture where downstream systems obtain large data feeds.

## 
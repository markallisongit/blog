---
title: "Trouble Connecting Adf to Github"
date: 2023-03-30T18:08:01+01:00
lastmod: 2023-03-30T18:08:01+01:00
draft: false
author: Mark
tags: [adf, git]
lightgallery: true
---
Hi there!

I had a frustrating issue this week which had a very simple solution but it took me way too long to find it!

## Problem

As mentioned in my [previous article](../which-adf-runtime/), I created a new resource group to demonstrate different Integration Runtimes with ADF. As part of this I tried to connect ADF to GitHub to source control the code and had real trouble.

I'm using Microsoft Edge and I could connect to my repo but I got these errors:

{{< image src="import-existing-resources.png" caption="No Permissions to commit" >}}

{{< image src="2023-03-28_11-11-57.jpg" caption="Don't have permissions to perform action: commit" >}}

## Goose Chase

I tried all kinds of things to resolve this including creating OAuth tokens manually, and trying to connect them up to ADF but none of it worked.

I then opened Azure Data Factory Studio in Chrome and got a pop-up asking me to verify my GitHub credentials. Strange, I didn't get this in Edge. I entered my GitHub credentials authorizing ADF to connect to my GitHub repo with all the permissions it required and everything worked fine.

I went back to Edge, but I still got the same problem.

## Solution

The solution for Microsoft Edge was to [clear my browser cache](https://learn.microsoft.com/en-us/answers/questions/1192555/cant-import-live-resources-to-github-repo) I know, weird, but it worked for me. When I navigated back to the Git connection page in ADF, I got this popup.

{{< image src="2023-03-30_17-26-12.jpg" caption="Don't have permissions to perform action: commit" >}}

After entering my credentials again, it worked fine.

Hope this helps!
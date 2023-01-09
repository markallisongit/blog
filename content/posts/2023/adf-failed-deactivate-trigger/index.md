---
title: "Adf Failed To Deactivate Trigger"
date: 2023-01-09T13:21:56Z
lastmod: 2023-01-09T13:21:56Z
draft: false
author: Mark
tags: [azure-data-factory]
lightgallery: false
---

A colleague had an issue this week with Azure Data Factory (ADF) in that a change to a trigger could not be published. "Ah, I know what this is", I thought. Those of you familiar with ADF will know that changes to published triggers cannot be made if the trigger is enabled.

## Troublshooting Steps

I began troublshooting by first of all disabling the trigger. This also resulted in failure. I then proceeded to detach the trigger from the pipeline, copy out the JSON definition and then save and publish, but also got the same error.

Next step was to try and dig down into the error and see if there were any inner exceptions that may give more information on the failure so in the Azure portal I looked at deployments for the resource group where the ADF is contained but just saw this error.

```json
{
  "code": "DeploymentFailed",
  "message": "At least one resource deployment operation failed. Please list deployment operations for details. Please see https://aka.ms/DeployOperations for usage details.",
  "details": [
    {
      "code": "TriggerEnabledCannotUpdate",
      "message": "Cannot update enabled Trigger; the trigger needs to be disabled first. "
    }
  ]
}
```

## ADF Trigger Types

I then looked closer and noticed that the trigger was a Storage Events trigger. I tried again to disable it and saw this error message in ADF.

{{< image src="2023-01-09_12-48-33.jpg" caption="Failed to deactivate Trigger" >}}

This was then followed by this message: `"Failed to unsubscribe to events for event trigger"`

{{< image src="2023-01-09_12-48-28.jpg" caption="Failed to unsubscribe to events" >}}

## Storage account

This got me thinking about the storage account. I looked at the storage account where the trigger was listening to and noticed that the account had a delete lock on it to prevent people accidentally deleting things in it. It turns out that deleting a trigger requires a deletion of a subscription to the events on the storage account. This was causing the issue.

## Resolution

Removing the Delete Lock on the storage account and then publishing again was successful. The Delete Lock was preventing me from deleting the Storage Events Trigger. I Added the Delete Lock back again after the trigger was deleted.
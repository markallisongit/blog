---
title: "When to Use Cmdletbinding in Powershell"
date: 2017-06-11T17:23:02Z
lastmod: 2017-06-11T17:23:02Z
draft: false
author: Mark
tags: [powershell]
categories: [powershell]
lightgallery: true
---
## Clean Code

I am a big proponent of clean code. I use PowerShell a lot for automation, and want code to be clean. You are automating everything, right? If not, please see a slide from a recent meetup:

{{< image src="IMG_20170606_191942.jpg" caption="Disturbing" >}}


For me, clean code in PowerShell means (and not limited to):

1. Small self-contained functions that have a single responsibility
1. Number of arguments to a function kept as small as possible
1. Consistent formatting
1. No duplication of code
1. Modules that hide internal functions, and only expose what’s needed

## Common Parameters

One way to make code a bit cleaner is to make use of PowerShell’s common parameters. If you would like a refresher as to what these are, there is extensive documentation in PowerShell itself which you can access with

`Get-Help about_CommonParameters`

Here’s a snippet from the help file:

```
The following list displays the common parameters. Their aliases are listed
in parentheses.

   -Debug (db)
    -ErrorAction (ea)
    -ErrorVariable (ev)
    -InformationAction
    -InformationVariable
    -OutVariable (ov)
    -OutBuffer (ob)
    -PipelineVariable (pv)
    -Verbose (vb)
    -WarningAction (wa)
    -WarningVariable (wv

The risk mitigation parameters are:
    -WhatIf (wi)
    -Confirm (cf)
```

All of these become available to you in your functions when you use `[CmdletBinding()]` at the top of the function. There are some gotchas though, so let’s walk through it.

Consider the following code:

```powershell
function Get-MessageFromInternalFunction {
    Write-Output "Output from internal function"
    Write-Verbose "Verbose Message from internal function"    
}

function Get-Message {
    [cmdletbinding()]
    param([switch]$UseInternal)
    Write-Output "`nOutput message"
    Write-Verbose "This is a verbose message"
    if ($UseInternal) {
        Get-MessageFromInternalFunction
    }
}
```

If we dot source this file and call the function `Get-Message` with no parameters we get:

{{< image src="2017-06-10 21_03_35-Windows PowerShell.png" caption="Get-Message output" >}}

In the above example we did not specify the `–UseInternal` parameter, so the function doesn’t call the inner function `Get-MessageFromInternalFunction`. Notice that the **Verbose** message was not printed. That is because the parameter `–Verbose` was not passed to the function AND the preference variable `$VerbosePreference` is set to the default of `SilentlyContinue`. For information about preference variables see the help with

`get-help about_preference_variables`

If we pass in `–Verbose` now we should see the verbose output:

{{< image src="2017-06-10 21_08_55-Windows PowerShell.png" caption="Get-Message verbose output" >}}

Now, what do you think will happen if we call `Get-Message` with parameter `–UseInternal` and `–Verbose`? Have a think about it, because it surprised me.

{{< image src="2017-06-10 21_11_20-Windows PowerShell.png" caption="Surprised?" >}}

Notice that we did not specify `CmdletBinding` in our inner function, but the verbose messages were printed anyway.

So, back to our clean code idea earlier, does that mean that a PowerShell module designer can write all public functions with CmdletBinding and not have to bother with internal functions? Maybe. However there’s some subtle things I want to show you that make life a bit easier if you put CmdletBinding in all your functions.

## CmdletBinding everywhere

Let’s change the code in our inner function and add `CmdletBinding`. If we call `Get-Message` with the same parameters as before it behaves the same way.

What if you wanted to call your `Get-Message` function and see your verbose messages, but you want to suppress verbose messages in your inner (or internal) functions? If you don’t specify `CmdletBinding` in your internal functions you can’t do it. Consider this code, especially lines 2 and 14:

```powershell
function Get-MessageFromInternalFunction {
    [cmdletbinding()]
    param()
    Write-Output "Output from internal function"
    Write-Verbose "Verbose Message from internal function"    
}

function Get-Message {
    [cmdletbinding()]
    param([switch]$UseInternal)
    Write-Output "`nOutput message"
    Write-Verbose "This is a verbose message"
    if ($UseInternal) {
        Get-MessageFromInternalFunction -Verbose:$False
    }
}
```

If we call `Get-Message –UseInternal –Verbose` now:

{{< image src="2017-06-10 21_20_09-Windows PowerShell.png" caption="Suppressed unwanted messages" >}}

We see our verbose message from our public functions, but we have suppressed verbose messages in our inner functions. Might be useful, might not be useful, but good to know.

## Preference Variables

We need to be aware of the behaviour of preference variables and that users of your modules may have it set to non-defaults. The default for `–Verbose` is `SilentlyContinue` which means don’t print any verbose messages unless the Verbose parameter is set. What if I had run the above function with `$VerbosePreference = 'Continue'`? The verbose messages get printed without having to use `–Verbose` as a parameter.

Notice that the `-Verbose:$False` parameter is respected even when `$VerbosePreference` is set to `'Continue'`.

If we now call `Get-Message –UseInternal`:

{{< image src="2017-06-10 21_24_37-Windows PowerShell.png" caption="Suppressed unwanted messages" >}}

Verbose messages in the outer function are displayed without specifying `–Verbose` as a parameter, but the verbose messages in the inner function are suppressed.

## Recommendation

Use `CmdletBinding` in all your public and internal functions.

Write clean code.

Automate everything.
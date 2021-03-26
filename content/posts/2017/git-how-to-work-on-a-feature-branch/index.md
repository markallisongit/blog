---
title: "Git How to Work on a Feature Branch"
date: 2017-05-30T18:03:09Z
lastmod: 2017-05-30T18:03:09Z
draft: true
author: Mark
tags: [git,source-control]
categories: [git]
lightgallery: true
---
## How to work on a feature branch but pull in later commits from another branch?

On a client site last week the question was raised: I want to work on a feature for a project which will take longer than other people merging their branches into the dev branch. I therefore want to merge any changes on the dev branch into mine, test my changes before pushing back to the dev branch, and then and ultimately master for a release.

We are using a git flow methodology whereby the development manager will merge feature branches from developers’ branches via pull requests into the dev branch. Tests are run and if they pass, we merge into a release branch for that Sprint and run further integration tests. When these pass, the release is deployed to production and the release branch is merged into master and tagged as that release.

In an attempt to keep it simple, let’s walk through a demo of how working in parallel with another SQL developer on a database project might work, but we will omit the release and hotfix branches and instead merge from dev to master rather than via dev->release->master.

## Set up the Repo

So, let’s create a new project called `git-merge-demo` and initialise the project with a git repo.

{{< image src="2017-05-28-19_13_36.png" caption="Create git repo" >}}

Let’s create a new table, new stored procedure and a publish profile. We need to add the existing `.gitignore` file and tweak that from the defaults. Add an Existing item and then browse to the .gitignore file in the repository. Comment out the line *.[Pp]ublish.xml because we want the publish profile to be source controlled. In **Team Explorer –> Changes** we can see that there are six changes since we created the repo to commit and then push up to GitHub:

{{< image src="2017-05-28-19_52_07.png" caption="Changes" >}}

Once committed we can see we made a commit starting with hash value **fe82ee96** (from now on I will just use the first four characters **fe82**):

{{< image src="2017-05-28-19_52_56.png" caption="Commit" >}}

This commits the file to our local repository but now we need to push it to the remote repository (GitHub). This was created for the demo: https://github.com/markallisongit/git-merge-demo

To add the remote to the local project simply run this in the root of the project on the command line (or it can be done within Visual Studio).

`git remote add origin https://github.com/markallisongit/git-merge-demo.git`

Two database objects were added to the project locally, one called **MasterTable** and one called **MasterProc**.

I can then Sync and Publish the changes to GitHub with this commit:

{{< image src="2017-05-28-19_52_56.png" caption="Changes pushed" >}}

## Create the Dev branch

Now that we have created and pushed the master branch, we should create the dev branch and push that to GitHub. At the bottom right select master and then select **New Branch**

{{< image src="2017-05-28-12_50_57.png" caption="New branch" >}}

Type in the name of the branch and **Create Branch**. We are now in the dev branch *locally*.

{{< image src="2017-05-28-12_52_32.png" caption="Dev branch" >}}

If we now go to **Team Explorer**, and **Sync and Publish** the branch it pushes up to GitHub

{{< image src="2017-05-28-12_53_33.png" caption="Pushed dev branch" >}}

All good so far, we have our solution on the remote and we are in the dev branch with our initial objects.

{{< image src="2017-05-28-12_55_41.png" caption="Initial objects" >}}

## Create two feature branches

In a similar way we created the dev branch let’s create a **feature1** and a **feature2** branch, and then push those to GitHub.

If we look on GitHub now we can see the branches on the branches tab:

{{< image src="2017-05-28-12_59_56.png" caption="Github branches" >}}

and locally it looks like this in **Team Explorer –> Branches**:

{{< image src="2017-05-28-13_01_02.png" caption="Local branches" >}}


## Make some changes to feature1

Let’s add a new table to **feature1** and a new column to the master table. This will comprise the first set of changes to **feature1**. The solution now looks like this:

{{< image src="2017-05-28-20_00_49.png" caption="Feature1" >}}

Let’s commit those changes locally by going to **Team Explorer, Changes**, entering a commit message. Then push to GitHub. The History now looks like this:

{{< image src="2017-05-28-20_05_06.png" caption="Local history" >}}

We can see here that the commit hash for **feature1** is **c174**.

## Switch to feature2 and make changes for feature2 

Let’s suppose another developer has taken the dev branch and is working on **feature2**. Let’s create a new table for **feature2** and add a new column to the **MasterTable**. First click at the bottom right on the current branch and then select branch **feature2**.

{{< image src="2017-05-28-13_11_29.png" caption="Switch to feature2" >}}

If you are following along on your own machine, you will notice that when switching to **feature2**, that the table **Feature1Table** and changes to **MasterTable** have been reverted to the dev branch commit. This is exactly what we want because we are developing **feature2** independently of **feature1**, and are branching from **dev**.

We can now make our changes for **feature2** and then commit and push to GitHub. The branch **feature2** now looks like this:

{{< image src="2017-05-28-20_18_09.png" caption="Feature2" >}}

OK, let’s commit those and push to GitHub by going to **Team Explorer –> Changes**, type in a commit message and **commit all**.

{{< image src="2017-05-28-13_17_46.png" caption="Commit all" >}}

This resulted in commit **48ee** and here’s the history for **feature2**, notice that **feature1** is not listed, because none of the code from **feature1** is in **feature2** right now.

{{< image src="2017-05-28-20_19_21.png" caption="Feature2 history" >}}

Meanwhile the developer on **feature1** needs to make another change to their feature. For this change I am going to use my laptop instead of my desktop to illustrate how different people on different machines can develop on the same project together.

## Adding code to feature1 on my laptop

As this project doesn’t exist on my laptop I need to pull all branches from GitHub to it and then switch to the **feature1** branch. Using the GitHub plugin, I click on **Clone** and then choose my GitHub project:

{{< image src="2017-05-28-15_33_32.png" caption="Clone" >}}

In **Team Explorer**, then select branches and in the remotes section choose the branch to switch to. Then select Checkout

{{< image src="2017-05-28-15_37_26.png" caption="Checkout feature1" >}}

Now in **Solution Explorer** we can see that only **feature1** is there.

{{< image src="2017-05-28-20_25_54.png" caption="Feature1 in Solution Explorer" >}}

Let’s add a new Column to **Feature1Table** called **Created** and give it a default of `SYSDATETIME()`

{{< image src="2017-05-28-15_42_23.png" caption="Feature1Table" >}}

Let’s commit that on the laptop and push to GitHub.

{{< image src="2017-05-28-15_44_14.png" caption="Pushed feature1" >}}

As a developer of **feature1** we are happy with this change and now consider it complete. The auto-triggered builds and tests on the build server have passed so we create a Pull Request for the development manager to merge **feature1** into the **dev** branch for further integration tests with other people’s code. The history for **feature1** looks like this and we can see our latest commit with hash **062e**:

{{< image src="2017-05-28-20_29_39.png" caption="Feature1 history" >}}

## Create Pull Request 1

On GitHub the developer creates the pull request like so:

{{< image src="2017-05-28-15_48_46.png" caption="Compare and pull request" >}}

{{< image src="2017-05-28-20_31_34.png" caption="Create pull request" >}}


The development manager should then be notified that there is a pull request waiting for review.

## Merging feature1 into dev branch

After peer review, the **feature1** branch is deemed to be ready for the next stage so it is approved and merged into **dev**. The development manager has three choices now:

1. **Create a Merge Commit** (preserves all commits from the feature1 branch into the dev branch)
1. **Squash and Merge** (squashes all the commits together from feature1 into one single commit on the dev branch)
1. **Rebase** and Merge (commits from feature1 are rebased onto the dev branch and fast forwarded)

I believe that any squash commits should be done by the developer before the pull request and not by the development manager, so at this stage we select **create a merge commit**. We can now see that this has been merged into **dev**.

{{< image src="2017-05-28-20_32_59.png" caption="Feature1 merged into dev" >}}

Notice that merging a pull request creates a new commit in the base branch, in this case the **dev** branch with commit **360b**. We can now *delete* the **feature1** branch as it is not required anymore.

At this point the developer on feature 2 needs to get the latest changes from dev onto the **feature2** branch and do some work on that and then merge back.

## Merge dev onto feature2 branch

We are merging into a feature branch and not a main branch like dev or master so we do not need the approval or sanction of the development manager to do this. In order to merge **dev** into **feature2** on our local repo we simply merge locally by going to **Team Explorer, Branches**. Select the branch you want to merge from and to and then click **Merge**. This is what we do for our example:

{{< image src="2017-05-28-20_45_24.png" caption="Merge dev into feature2" >}}

When trying to merge, we get two conflicts. Don’t panic!

{{< image src="2017-05-28-20_48_12.png" caption="Merge conflicts" >}}

We need to look at each conflict in turn and resolve them.

### Conflict 1: sqlproj file

Let’s compare the files by clicking compare files

{{< image src="2017-05-28-20_50_01.png" caption="Resolve conflicts" >}}

{{< image src="2017-05-28-20_51_11.png" caption="Resolve sqlproj conflict" >}}

Because we are merging the changes made in **feature1** into **feature2**, we need to make sure that both Feature tables are in the sqlproj file.

In Team Explorer, Click **Merge**.

Tick the items you want in the result of the merge conflict. We want both tables.

{{< image src="2017-05-28-21_02_44.png" caption="Resolve sqlproj conflict" >}}

Click **Accept Merge** at the top of the window to merge the file.

### Conflict 2: MasterTable.sql

Conflict 2 is trickier because the merge tool did not detect that column [SomeText] in the table is the same (probably to do with the CRLF problem!). Let’s tick the left side and then manually add the **Feature2Col** by copying and pasting that into the result. Here’s how it looked when the tool was opened:

{{< image src="2017-05-28-21_06_11.png" caption="Conflict 2" >}}

And here is how it looks after the merge work has been done, but before clicking **Accept Merge**.

{{< image src="2017-05-28-21_07_33.png" caption="Before accepting merge" >}}

We now click **Accept Merge**.

## Successful merge

In Solution Explorer, if we now look at **MasterTable** and the other tables we can see the merge has been successful.

{{< image src="2017-05-28-21_08_59.png" caption="Successful merge" >}}

Both feature tables are there, and all the columns from both feature branches are in **MasterTable**. Now all we do is go back to Team Explorer and commit the merge to the **feature2** branch.

{{< image src="2017-05-28-21_11_00.png" caption="Commit merge" >}}

The history now looks like this on **feature2** branch.

{{< image src="2017-05-28-21_12_51.png" caption="Feature 2 history" >}}

## Feature2 change

Let’s make our **feature2** change that we wanted to base off the changes made in the **dev** branch. Stored procedure **Feature2Proc** was created.

{{< image src="2017-05-28-21_17_39.png" caption="Feature2Proc" >}}

Let’s commit that change and raise a pull request to merge it back into the **dev** branch.

{{< image src="2017-05-28-21_19_45.png" caption="Commit ee1f" >}}

## Pull Request 2 into dev branch

After we’ve pushed **feature2** branch to GitHub we can now raise a pull request to merge that into the **dev** branch.

{{< image src="2017-05-28-21_21_23.png" caption="Pull request 2" >}}

The merge was successful with commit hash **64c7** and we can now delete the **feature2** branch.

{{< image src="2017-05-28-21_22_47.png" caption="Pull request 2 merged into dev" >}}

## Merge back to master

Now that **feature1** and **feature2** is complete and merged into **dev**, we can run our integration tests on the dev branch to test everything still works. If that passes we can merge back to master with a new pull request from dev to master.

{{< image src="2017-05-28-21_28_11.png" caption="Pull request 3 (dev to master)" >}}

Merge back to master was successful with commit hash **cb2c** and we will keep the dev branch for further dev work.

{{< image src="2017-05-28-21_29_09.png" caption="Merged to master" >}}

## Summary

The above workflow can be summarised with the branches and commits in this diagram, which will hopefully make it easier to follow what happened.

{{< image src="2017-05-28-21_51_12.png" caption="Full history" >}}

* **feature1** and **feature2** branches were created from commit **fe82** from dev/master
* a change was then made to **feature1** and pushed as **c174**
* not long after a change was made to **feature2** and pushed as **48ee**
* another change was made to **feature1** as **062e**. The developer then requested this get merged into **dev** with commit **360b**.
* the developer on **feature2** wants the latest features on the dev branch in the **feature2** branch so pulls those and merges those changes into the **feature2** branch
* during the merge there were two conflicts which were resolved manually and committed as **c7b9**
* some further work was done and pushed as **ee1f**
* a pull request was raised to merge **ee1f** back to the **dev** branch. This succeeded with no merge conflicts as commit **64c7**
* a pull request was raised to merge the **dev** branch back to **master** as commit **cb2c**

Here’s the commit history in **master** from within Visual Studio

{{< image src="2017-05-28-21_49_18.png" caption="Full history of master" >}}

Try it out for yourself and create a free GitHub account, or if you don’t want stuff made public, create yourself a VM and install GitLab (which is what I use at home for pet projects).

## Addendum
After all that merging, the project does actually deploy to a real SQL Server. This is the database after it has been deployed in SSMS:

{{< image src="2017-05-28-22_00_45.png" caption="The deployed project" >}}

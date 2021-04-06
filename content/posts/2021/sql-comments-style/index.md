---
title: "Sql Comments Style"
date: 2021-04-06T17:42:16+01:00
lastmod: 2021-04-06T17:42:16+01:00
draft: true
author: Mark
tags: [sql-server,sentry]
lightgallery: true
---
## Should we stop using `--` in SQL comments?

Interesting blog post from [Brent Ozar](https://www.brentozar.com/archive/2021/04/never-ever-ever-start-t-sql-comments-with-two-dashes/) on whether we should stop using `--` for SQL Comments. I use these comments a lot because they are quick and easy for me to type. I don't like voluminous comments but this is a good point.

If clicking the link is too much effort for you, he is saying you should do this

```tsql
SELECT *
FROM dbo.Users
WHERE DisplayName = N'Brent Ozar'
/* This line is a comment */
AND Location = N'Iceland'
ORDER BY Reputation DESC;
```

instead of this

```tsql
SELECT *
FROM dbo.Users
WHERE DisplayName = N'Brent Ozar'
-- This line is a comment
AND Location = N'Iceland'
ORDER BY Reputation DESC;
```

## Seems fine in Sentry One

I just tried it in **Sentry One** and it looks fine to me. 

{{< image src="2021-04-06_17-40-56.jpg" caption="Sentry One comments" >}}

However, if I remember, I will stop using them from now on. However it's a big burden. `/* */` is six key presses (remember the shift) and `--` is only two on the same key, so the typing overhead is substantial. 😊

## What about PowerShell?
Makes me wonder about `PowerShell` as well because that is not a compiled language, it is interpreted. I never run monitoring tools against PowerShell code though, so maybe one-liner comments are fine?

Consider the following code.

```powershell
# get the content
$content = get-content ./content/posts/2021/sql-comments-style/index.md

# show number of lines in the content
$content.Count
```

I can't see a problem with that, can you? Let me know in the comments below.
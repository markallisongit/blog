---
title: Loving Hugo
date: 2021-03-15T12:02:11Z
lastmod: 2021-03-19T17:30:59
draft: false
author: Mark
categories: [blog]
tags: [blog, hugo]
---

## Hugo is great

Even though I'm late to the party, having not blogged for a while (see my older posts [here](https://sabin.io/blog/author/Mark%20Allison)), I came across a bug in Hugo today. To get a little bit more performance from my site I decided to use the `--minify` option in the `hugo` command for the `production` build on netlify's build server in `netlify.toml` as you can see [here](https://github.com/markallisongit/blog/blob/f21a89b727b2d2f84d0dc54ea0724d61e3adf9f8/netlify.toml#L3).

My navbar didn't have icons in it before, and I thought it would look nicer with some icons added. On my local server it looked fine:

{{< figure class="img-fluid" src="navbar-local-build.png" caption="local" >}}

but when deployed to netlify, the spaces between the icon and text were removed. Seems like I came across an ugly minify bug in hugo.

{{< figure class="img-fluid" src="navbar-minified.png" caption="deployed with --minify" >}}

### Great support

Literally less than an hour after me posting this to the [Hugo support forum](https://discourse.gohugo.io/t/my-navbar-looks-different-after-deployment/31758), the main developer [bep](https://discourse.gohugo.io/u/bep/summary) replied and told me it was a bug. Shortly after, it was [scheduled to be fixed](https://github.com/gohugoio/hugo/issues/8332) in the very next release of Hugo! 

Amazing :slightly_smiling_face: 

Loving this platform!
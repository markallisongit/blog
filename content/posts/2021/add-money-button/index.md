---
title: "How to Add Money Button to a Hugo Site"
date: 2021-04-03T15:14:27+01:00
lastmod: 2021-04-03T15:44:27+01:00
draft: false
author: Mark
tags: [money-button, hugo, bitcoin]
lightgallery: false
---
## Money Button

[Money button](https://www.moneybutton.com/home) is a little widget that allows for micro-payments to be sent over the internet using Bitcoin (BSV). If you want to try this on your own Hugo site, simply follow these steps.

The code for this website can be viewed here: https://github.com/markallisongit/blog

### 1. Add a tip Partial

Add a partial piece of html that includes the Money Button script by creating a file called `tip.html` and place this in your `layouts/partials` directory similar to:

```javascript
{{ if .Site.Params.Tips.enabled }}
<script src="https://www.moneybutton.com/moneybutton.js"></script>

<div id='money-button-js'></div>
<script>
  const div = document.getElementById('money-button-js')
  moneyButton.render(div, {
    to: "{{ .Site.Params.Tips.paymail }}",
    amount: "{{ .Site.Params.Tips.amount }}",
    currency: "{{ .Site.Params.Tips.currency }}",
    label: "Tip jar",
    buttonId: "{{ .Permalink }}",
    buttonData: "{{ .Title }}",
    type: "tip",
    onPayment: function (arg) { console.log('onPayment', arg) },
    onError: function (arg) { console.log('onError', arg) }
  })
</script>

<p>Send a tip. Try it!</p>
{{ end }}
```

### 2. Include in `single.html`

If you want to include money button in your theme, then simply add the partial code into your `single.html` file where you want it to appear like this:

`{{ partial "tip.html" . }}`

Change this in a copy of the `single.html` file in your own layouts folder rather than changing the theme. This allows you to override the theme with your own changes.

### 3. Add Money Button to config file

Finally, change your `config.toml` or `config.yaml` file to include the parameters above so you can change them easily later.

Parameters you will need to add to the `params` section of your config are (this is YAML):

```yaml
  tips:
    enabled: true
    paymail: marquee@moneybutton.com
    amount: 0.10
    currency: GBP    
```

Change these values for your site.

* The `enabled` flag will toggle the Money Button widget on all pages on your site.
* `paymail` is the Paymail address where you want the money to be sent to.
* `amount` is the the amount in the denominated currency
* `currency` is the currency code you want to use.

## Why send Bitcoin?

Bitcoin allows for very small online payments to be made  peer-to-peer without going through a third party. Check out the [whitepaper](https://craigwright.net/bitcoin-white-paper.pdf) to learn more about it.

{{< admonition warning >}} 
**Bitcoin BTC** has deviated from the whitepaper and is no longer Bitcoin. This can be confusing to newcomers. The only coin that is faithful to the whitepaper, and therefore can be called Bitcoin, is **Bitcoin BSV**.
{{< /admonition >}}
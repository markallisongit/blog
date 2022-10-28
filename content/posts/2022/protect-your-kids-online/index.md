---
title: "Protect Your Kids Online"
date: 2022-10-28T20:46:34+01:00
lastmod: 2022-10-28T20:46:34+01:00
draft: false
author: Mark
tags: [networking, family, firewall, router]
lightgallery: false
---
As the "IT guy" I sometimes get asked how to protect kids online from malware and adult content. This article will show you how to easily implement a solution.

I recently bought a new router so I could segment my home network and get prepared for FTTP internet, and I thought I'd share with you how I set it up to protect my family home. Maybe it will help you.

I've been using [pfSense](https://www.pfsense.org/) for many years as an open source firewall/router and it's been absolutely great. Rock solid, highly recommended. However, I've decided to use a fork of the project called [OPNsense](https://opnsense.org/) on my new [router hardware](https://eu.protectli.com/vault-6-port/) and I've been very happy with it.

## How websites are loaded

When you browse to a web site, the address of the site needs to be translated into an IP address so that the information can be routed across the internet to your device. This is done using name servers (aka DNS servers), which translates the name of the site to an IP address.

If the IP address for a website cannot be found from its name, it cannot be loaded in the browser. Indeed many large scale internet outages are caused by problems with DNS. Recently, the pfsense website was down for hours due to problems with DNS.

{{<tweet 1585611012627202048 >}}

Discord was down earlier this year due to DNS.

{{< tweet 1539146744671240192 >}}

Many [others](https://techcrunch.com/2021/07/22/a-dns-outage-just-took-down-a-good-chunk-of-the-internet/) too.

## Using DNS to filter traffic

There are many services that will use DNS to protect your home network, some free and some paid. I have for a long time used [OpenDNS](https://www.opendns.com/home-internet-security/), but their service was taken over by Cisco Umbrella and which is paid. A couple of years ago [CloudFlare](https://www.cloudflare.com/) released the family version of their free, popular, ultra-fast `1.1.1.1` DNS service, so this is what I use now.

## The easy solution

Most computers in the home obtain an  IP address from the DHCP server built into the ISP-supplied modem/router. I strongly recommend splitting this out into a separate device so you can have more control. See the links above.

### Steps

In the DHCP server settings of your router set the DNS servers to `1.1.1.3` and `1.0.0.3`. IPv6 versions are `2606:4700:4700::1113`, `2606:4700:4700::1003`. You are using IPv6 right? ;) When your kids' devices connect to the router they will be assigned the safer DNS servers.

That's it. 

Try it yourself, reboot your device (or for the tech-savvy flush your DNS cache) and browse to these sites to test:

* https://malware.testcategory.com/ 
* https://nudity.testcategory.com/

My browser looks like this when I go to those sites.

{{< image src="2022-10-28_21-18-12.jpg" caption="This site can't be reached" >}}

## Teenagers

The more technical among you will realise that this will only foil the non-technical folk. Smarter people, i.e. your teenage kids will easily get around it by setting DNS manually in their device settings like this:

{{< image src="2022-10-28_21-23-08.jpg" caption="Setting DNS manually in Windows 10" >}}

This will use Google's servers which does not have any filtering.

## Use the firewall to enforce Cloudflare DNS

What if you could block all DNS servers in the world except the family friendly CloudFlare DNS? That would solve it, right? I will show you how it's done in OPNsense which is very similar to the popular pfSense.

Firewall rules are usually evaluated top-down in order, and when a rule evaluates to true, it stops processing further rules.

1. Navigate to firewall rules and allow DNS requests to the firewall.

{{< image src="2022-10-28_21-28-01.jpg" caption="Allow DNS requests to your firewall" >}}

2. Set up a firewall alias that lists the friendly DNS servers you want to use.

{{< image src="2022-10-28_21-31-03.jpg" caption="Firewall alias" >}}

3. Allow DNS requests to that DNS server too by referencing the alias.

{{< image src="2022-10-28_21-34-13.jpg" caption="Allow DNS requests to servers listed in the alias" >}}

4. Block DNS traffic to anywhere else

{{< image src="2022-10-28_21-36-56.jpg" caption="Block all other DNS servers" >}}

Here are my floating firewall rules (applied to every interface on the router).

{{< image src="2022-10-28_21-49-48.jpg" caption="All floating rules (click to enlarge)" >}}

The tech-savvy among you will know, that even this can be bypassed by a determined person, but they will require administrator permissions on the device to do so. I'm not going to tell you how to get around it but there is a way with admin permissions. This solution will be pretty good, but nothing is ever 100%.

I like to think that if my kids have to work hard to get around these blocks, then I'm sending them a message.

Of course there are other methods that I used when mine were younger like:

* Talking to them about not being able to unsee what you see on the internet
* Putting any device that's internet connected in a common area (living room, kitchen, etc.)

## TL; DR

1. Get a decent router
1. Configure the DHCP server to use `1.1.1.3` and `1.0.0.3` as DNS servers
1. Set up firewall rules to allow requests to those servers and block DNS requests to anything else
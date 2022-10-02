---
title: "I Set up IPv6 at Home"
date: 2022-10-01T11:06:31+01:00
lastmod: 2022-10-01T11:06:31+01:00
draft: false
author: Mark
tags: [ipv6, networking]
lightgallery: true
---

## IPv4 

As you may already know [IANA](https://www.iana.org/), the global Internet Assigned Numbers Authority, have exhausted the IPv4 address space.

Today, we are forced to use Network Address Translation (NAT) for home and mobile environments to translate the public IP address given to us by our ISP to internal private non-routable v4 addresses on our home devices. This works but is messy and problems will only increase as the number of devices in the world grows. We have already run out of IPv4 address space and some ISPs are implementing horrible solutions to get round it by using things like carrier grade NAT (CGN).

## IPv6

Almost immediately after IPv4 was rolled out, people realized that the address space would not be enough, and began work on IPv6 with various RFCs in the late 90s. The new version of the internet protocol was [released on July 14th, 1999](https://www.iana.org/reports/1999/ipv6-announcement.html).

IPv6 has been out for nearly 25 years now and is [gradually being adopted](https://www.google.com/intl/en/ipv6/statistics.html).

{{< image src="2022-10-01_14-35-04.jpg" caption="Global IPv6 adoption. Source: [Google](https://www.google.com/intl/en/ipv6/statistics.html)" >}}

## What I learned about IPv6

I live in the UK and my ISP is [Zen Internet](https://www.zen.co.uk) who will provide you a massive IPv6 /48 address range if you [email them](mailto:ipv6@zen.co.uk). I asked them to set it up and then spent some time to understand how this protocol works. It really does make life a lot easier. The number of Public IPs I now have though just blows my mind.

**I now have 1,208,925,819,614,629,174,706,176 Public IP addresses.**

That's one septillion, two hundred and eight sextillion, nine hundred and twenty-five quintillion, eight hundred nineteen quadrillion, six hundred fourteen trillion, six hundred and twenty-nine billion, one hundred and seventy-four million, seven hundred six thousand, one hundred and seventy-six.

That's 65,536 subnets with four billion IPv4 entire internets in each subnet, all inside my network. Whooaaa!

That's not even including the private non-routable Unique Local (ULA) address space which is `FD00::/8` or another local 1,329,227,995,784,915,872,903,807,060,280,344,576 addresses which I can also use internally.

We really shouldn't run out this time! I've heard it said that there are enough Public IP addresses for every atom on earth to have its own IP address with another 100 earths left over.

I set it up on my home router and tested it out with [https://test-ipv6.com/](https://test-ipv6.com/). I will post another article soon on how to do this with pfSense and Zen Internet.

{{< image src="2022-10-01_13-33-22.jpg" caption="IPv6 test results (click to enlarge)" >}}

Things I learnt:

### 1. Don't be uncomfortable with public IPs

{{< admonition warning "All your devices are publicly addressable" true >}}
When using IPv6, every IPv6-enabled device on your home network that connects to your router, depending on how it's configured, will get one (or more) internet-routable public IP addresses.{{< /admonition >}}

This bothered me at first until I realized that NAT is not really a security feature, it's just plain annoying. The firewall rules will protect you from intruders. This can be tested with the [scanner here](https://ipv6.chappell-family.com/ipv6tcptest/).

{{< image src="2022-10-01_13-38-16.jpg" caption="IPv6 port scan results (click to enlarge)" >}}

Firewall seems to be doing its job.

### 2. My PC has multiple IPv6 addresses

The next thing I noticed is that it's totally normal to have many IPv6 addresses for every network interface on your machine. Most machines only have one interface, but some have more than that.

My Windows Desktop has three IPv6 addresses which I will explain shortly. If you run this in PowerShell:

 ``` powershell
 Get-NetIPAddress -InterfaceAlias 'Ethernet' -AddressFamily IPv6 | select IPAddress
 ```
shows
```
IPAddress
---------
fe80::8d91:ba6b:b24d:9b41%4
2a02:1243:5687:0:9c09:2c7a:7c78:9ffc
2a02:1243:5687:0:8d91:ba6b:b24d:9b41
```

or using command prompt:

```
ipconfig /all

Ethernet adapter vEthernet (HyperV):

   Connection-specific DNS Suffix  . : localdomain
   Description . . . . . . . . . . . : Hyper-V Virtual Ethernet Adapter #2
   Physical Address. . . . . . . . . : A8-xx-xx-xx-xx-80
   DHCP Enabled. . . . . . . . . . . : Yes
   Autoconfiguration Enabled . . . . : Yes
   IPv6 Address. . . . . . . . . . . : 2a02:1243:5687:0:8d91:ba6b:b24d:9b41(Preferred)
   Temporary IPv6 Address. . . . . . : 2a02:1243:5687:0:9c09:2c7a:7c78:9ffc(Preferred)
   Link-local IPv6 Address . . . . . : fe80::9c09:ba6b:b24d:9b41%4(Preferred)
   IPv4 Address. . . . . . . . . . . : 10.0.0.79(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Lease Obtained. . . . . . . . . . : 01 October 2022 13:52:02
   Lease Expires . . . . . . . . . . : 01 October 2022 15:52:01
   Default Gateway . . . . . . . . . : fe80::528c:b1ff:fe02:ba6b%4
                                       10.0.0.1
   DHCP Server . . . . . . . . . . . : 10.0.0.1
   DHCPv6 IAID . . . . . . . . . . . : 296264025
   DHCPv6 Client DUID. . . . . . . . : 00-01-00-01-26-1F-81-1B-A8-A1-59-36-92-80
   DNS Servers . . . . . . . . . . . : 10.0.0.1
                                       2a02:1243:5687::1
   NetBIOS over Tcpip. . . . . . . . : Enabled
   Connection-specific DNS Suffix Search List :
                                       localdomain

```


#### Address 1: Link-local

`fe80::8d91:ba6b:b24d:9b41%4`

The first address is called the link-local address and is generated by your PC and can only be used for machines on your local subnet. It is not routable internally or over the internet. The `%4` on the end is the interface ID on your machine and not really part of the address.

#### Address 2: Temporary public address

`2a02:1243:5687:0:9c09:2c7a:7c78:9ffc`

When making outbound connections, the PC will rotate it's public IP for privacy reasons, although I don't really understand why this is regarded as private because the first three parts of the address are staticly assigned by my ISP, which can be used for tracking. The only benefit is it hides which *device* on my home network the traffic came from.

This address can be switched off by using PowerShell as Administrator with:

```powershell
Set-NetIPv6Protocol -UseTemporaryAddresses Disabled
```

You will now appear to websites on the internet from your static IP address (address 3 above).

#### Address 3: Static Public IP address

`2a02:1243:5687:0:8d91:ba6b:b24d:9b41`

This address is not used for outbound connections unless temporary addresses have been disabled, and is normally used for inbound connections so people can route to you from outside your network if desired. Let's say you want to run a server for example, you would use this address.

### 3. My address on the internet is THIS PC!

Going to https://api64.ipify.org/ shows the current public address of my PC.

{{< image src="2022-10-01_14-12-38.jpg" caption="My temporary public IP address" >}}

It does feel weird seeing my PC's IP address showing up on external web sites.

### 4. DHCP is no longer required for most networks

As part of Stateless Automatic Address Configuration (SLAAC) in IPv6, addresses are self-assigned and do not need to be handed out by a DHCP server. DHCPv6 can be used if really needed, but it's not required, and Android doesn't even support DHCP on IPv6. It's SLAAC only.

### 5. Static public IP has the same suffix as Link-Local

I noticed that the static public IP address suffix will match identically to my link-local suffix.

i.e. the /64 suffix for Address 1 matches /64 suffix for Address 3:

fe80::**8d91:ba6b:b24d:9b41**

=

2a02:1243:5687:0:**8d91:ba6b:b24d:9b41**

### 6. Temporary addresses can be switched off

If you want a static IP for your device as you appear on the internet, the temporary privacy address can be disabled with

```powershell
Set-NetIPv6Protocol -UseTemporaryAddresses Disabled
```

### 7. Most home networks will have /64 subnets

What does this mean? The IPv6 address is split up into eight groups separated by a colon. Zen Internet have allocated me a /48 network.

`2a02:1243:5687:0:8d91:ba6b:b24d:9b41`

`[network] [subnet] [interface]`

The first three groups (48 bits) is the network prefix given to you by your ISP `2a02:1243:5687`. The fourth group is the subnet, which you can divide up at home into LAN, WIFI, DMZ, or whatever, I'm just using `0` for my LAN. The last four groups is the interface or host ID on that subnet `8d91:ba6b:b24d:9b41`.

### 8. Merging company networks is easier

Let's say two companies merge together and they need to join their networks. In the past this was a nightmare because of the tiny range of IPv4 private address space. Most companies use the `10.x.x.x/8` range of addresses, which compared to IPv6 is a drop in the ocean.

In IPv6 using ULA addresses (`FD00::/8`) will make the likelihood of address space collision very small indeed. I also wonder if some companies would even bother with ULA as the global address space is so vast in number, may as well use those. Using ULA though does isolate you from ISP related changes to your address space, so there are benefits.

## Conclusion

If your ISP offers it at no cost, then go for it. Benefits:

* No more NAT (Network Address Translation)
* No more dynamic home public IP addresses
* Auto-configuration with SLAAC
* No more private IP address range collisions when joining up networks
* Better multicast
* Simple, more efficient routing
* Built-in authentication and privacy support
* True Quality of service (QoS) support
* No more DHCP or horrible 169.254.x.x addresses

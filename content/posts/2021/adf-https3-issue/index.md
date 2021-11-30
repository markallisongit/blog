---
title: "ADF HTTP/3 Issue"
date: 2021-11-30T07:44:13Z
lastmod: 2021-11-30T07:44:13Z
draft: false
author: Mark
tags: [azure, azure-data-factory]
lightgallery: false
---
One of my ADF pipelines started failing recently where a Generic REST API Linked Service gave the following error:

`525: SSL handshake failed`

Digging deeper into the logs, I see a message from Cloudflare.

```
It appears that the SSL configuration used is not compatible with Cloudflare. This could happen for a several reasons, including no shared cipher suites.
```

## HTTP/3 QUIC

There had been no code changes in ADF, but something on the source side had changed. After working with the data provider, it turns out that Cloudflare was using HTTP/3 which causes the ADF connection to fail.

There's more information on HTTP/3 and QUIC [here](https://blog.cloudflare.com/http3-the-past-present-and-future/)


## Forcing HTTP/2 in ADF

To force the REST API connection over HTTP/2 instead of HTTP/3, the data provider advised me to specify TLS1.2 which is not supported on HTTP/3. How to do that? I asked on [stack overflow](https://stackoverflow.com/questions/70114044/how-to-set-tls-version-in-azure-data-factory-generic-rest-linked-service) and got a helpful answer back.

In the Linked Service, a new property was added `EncryptionMethod=1` which forces TLS1.2, which forces HTTP/2.

Since specifying that property for this particular linked service, the problem has been fixed.
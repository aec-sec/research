---
title: "DNS"
description: "Technical reference for the Domain Name System, covering DNS architecture, record types, enumeration, zone transfers, reverse lookups and common security considerations."
port: "53"
transport: "TCP/UDP"
category: "Name Resolution"
tags:
  - DNS
  - Enumeration
  - Infrastructure
  - Reconnaissance
draft: false
---

## Overview

DNS, or the **Domain Name System**, is a distributed naming system primarily used to translate human-readable domain names into IP addresses.

For example:

```text
www.example.com → 93.184.216.34
```

DNS is fundamental to modern networks and is commonly encountered during both external and internal security assessments.

DNS normally operates on **UDP port 53**, although **TCP port 53** is also used in several situations.

| Port | Transport | Purpose |
| --- | --- | --- |
| 53 | UDP | Standard DNS queries |
| 53 | TCP | Zone transfers and responses requiring TCP |

---

## DNS Architecture

DNS uses a hierarchical namespace.

A simplified lookup hierarchy is:

```text
.
└── com
    └── example
        ├── www
        ├── mail
        └── api
```

The major components include:

- Root DNS servers
- Top-Level Domain (TLD) servers
- Authoritative name servers
- Recursive resolvers
- DNS clients

### Recursive Resolver

A recursive resolver receives DNS requests from clients and performs the necessary queries to obtain an answer.

Common public recursive resolvers include services operated by major Internet infrastructure providers.

### Authoritative Name Server

An authoritative DNS server contains DNS records for a particular DNS zone and can provide authoritative responses for that namespace.

---

## DNS Record Types

DNS supports numerous record types.

### A Record

Maps a hostname to an IPv4 address.

```text
www.example.com.    IN    A    192.0.2.10
```

### AAAA Record

Maps a hostname to an IPv6 address.

```text
www.example.com.    IN    AAAA    2001:db8::10
```

### CNAME Record

Creates an alias pointing one hostname to another.

```text
portal.example.com.    IN    CNAME    web.example.com.
```

### MX Record

Identifies mail servers responsible for receiving email for a domain.

```text
example.com.    IN    MX    10 mail.example.com.
```

The numerical value represents the mail server priority. Lower values have higher priority.

### NS Record

Identifies authoritative name servers for a DNS zone.

```text
example.com.    IN    NS    ns1.example.com.
```

### TXT Record

Stores arbitrary text information.

TXT records are commonly used for technologies such as:

- SPF
- DKIM
- DMARC
- Domain verification
- Service configuration

### PTR Record

PTR records perform reverse DNS resolution, mapping an IP address back to a hostname.

```text
10.2.0.192.in-addr.arpa.    IN    PTR    server.example.com.
```

### SOA Record

The Start of Authority record contains administrative information about a DNS zone.

It commonly includes:

- Primary name server
- Administrative contact
- Zone serial number
- Refresh interval
- Retry interval
- Expiry value
- Negative caching TTL

---

## Basic Enumeration

DNS enumeration can reveal hosts, infrastructure, mail servers and other information about a target environment.

### dig

Query an A record:

```bash
dig example.com
```

Request a specific record type:

```bash
dig example.com A
```

Query MX records:

```bash
dig example.com MX
```

Query name servers:

```bash
dig example.com NS
```

Query TXT records:

```bash
dig example.com TXT
```

Request a concise response:

```bash
dig +short example.com
```

### host

Basic hostname resolution can also be performed using `host`:

```bash
host example.com
```

Query mail servers:

```bash
host -t MX example.com
```

Query name servers:

```bash
host -t NS example.com
```

### nslookup

DNS queries can also be performed with:

```bash
nslookup example.com
```

A specific DNS server can be queried:

```bash
nslookup example.com 8.8.8.8
```

---

## Querying a Specific DNS Server

During an assessment it can be useful to query a specific DNS server directly.

Using `dig`:

```bash
dig @192.0.2.53 example.com
```

Query a particular record:

```bash
dig @192.0.2.53 example.com MX
```

This is particularly useful when testing internal DNS infrastructure or comparing responses from different resolvers.

---

## Reverse DNS

Reverse DNS can identify hostnames associated with IP addresses.

Using `dig`:

```bash
dig -x 192.0.2.10
```

Using `host`:

```bash
host 192.0.2.10
```

IPv4 reverse DNS uses the:

```text
in-addr.arpa
```

namespace.

IPv6 reverse DNS uses:

```text
ip6.arpa
```

---

## Zone Transfers

DNS zone transfers allow DNS information to be replicated between authoritative DNS servers.

Two important mechanisms are:

| Type | Description |
| --- | --- |
| AXFR | Full zone transfer |
| IXFR | Incremental zone transfer |

An AXFR request can be tested using:

```bash
dig AXFR example.com @ns1.example.com
```

or:

```bash
dig @ns1.example.com example.com AXFR
```

If an unauthorised zone transfer is permitted, the response may expose a significant portion of the DNS namespace.

This can reveal information such as:

- Hostnames
- Internal naming conventions
- Mail infrastructure
- Development systems
- VPN endpoints
- Administrative systems
- Legacy infrastructure

Authoritative DNS servers should therefore restrict zone transfers to explicitly authorised secondary DNS servers.

---

## Subdomain Enumeration

DNS enumeration frequently involves identifying additional hostnames within a domain.

Potential examples include:

```text
www.example.com
mail.example.com
vpn.example.com
portal.example.com
dev.example.com
staging.example.com
api.example.com
```

Enumeration can involve passive sources as well as authorised active DNS queries.

A simple lookup can be performed with:

```bash
dig +short www.example.com
```

For larger authorised assessments, dedicated enumeration tooling can be used to identify additional DNS names.

---

## DNS Recursion

Recursive DNS servers perform DNS resolution on behalf of clients.

A DNS server exposed to untrusted networks should not generally provide unrestricted recursive resolution unless that behaviour is intentional.

A server can be queried directly:

```bash
dig @192.0.2.53 example.org
```

If it resolves unrelated external domains for arbitrary clients, recursion may be enabled.

Unrestricted recursion can increase exposure to:

- DNS amplification abuse
- Resource consumption
- Unauthorised use of the resolver

---

## DNS Over TCP

Although DNS is commonly associated with UDP, TCP is also an important part of DNS operation.

TCP may be used for:

- Zone transfers
- Responses that cannot be delivered appropriately over UDP
- DNSSEC-related responses
- Other situations requiring reliable transport

A DNS query can explicitly use TCP with:

```bash
dig +tcp example.com
```

Security assessments should therefore consider both:

```text
53/UDP
53/TCP
```

rather than assuming DNS exists exclusively over UDP.

---

## DNSSEC

DNSSEC provides mechanisms for validating the authenticity and integrity of DNS data using cryptographic signatures.

Common DNSSEC-related record types include:

| Record | Purpose |
| --- | --- |
| DNSKEY | Publishes DNSSEC public keys |
| DS | Establishes delegation trust |
| RRSIG | Contains cryptographic signatures |
| NSEC / NSEC3 | Provides authenticated denial of existence |

DNSSEC primarily protects against forged DNS responses. It does not encrypt DNS queries.

---

## Security Testing Considerations

When assessing a DNS service, areas of interest can include:

- Exposed DNS services
- Unrestricted zone transfers
- Open recursive resolution
- Information disclosure through DNS records
- Internal hostnames exposed externally
- Unnecessary DNS records
- Reverse DNS information
- DNSSEC configuration
- TCP and UDP exposure
- Subdomain enumeration
- Dangling DNS records
- Split-horizon DNS behaviour

---

## Useful Commands

Basic lookup:

```bash
dig example.com
```

Concise lookup:

```bash
dig +short example.com
```

Name servers:

```bash
dig example.com NS
```

Mail servers:

```bash
dig example.com MX
```

TXT records:

```bash
dig example.com TXT
```

SOA record:

```bash
dig example.com SOA
```

Reverse lookup:

```bash
dig -x 192.0.2.10
```

Query a specific server:

```bash
dig @192.0.2.53 example.com
```

Force TCP:

```bash
dig +tcp example.com
```

Test an authorised zone transfer:

```bash
dig @ns1.example.com example.com AXFR
```

---

## Key Points

- DNS primarily uses **UDP and TCP port 53**.
- A records map names to IPv4 addresses.
- AAAA records map names to IPv6 addresses.
- PTR records provide reverse DNS mappings.
- MX records identify mail infrastructure.
- NS records identify authoritative name servers.
- TXT records commonly contain email-security and verification information.
- AXFR provides full DNS zone transfers.
- Unrestricted zone transfers can disclose substantial infrastructure information.
- DNS enumeration is valuable during both external and internal security assessments.
- TCP port 53 should not be ignored when assessing DNS infrastructure.
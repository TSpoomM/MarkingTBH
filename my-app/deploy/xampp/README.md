# XAMPP deploy notes

This project is a Next.js server app, not a static HTML/PHP app. XAMPP should
act as the public web server, while Next.js keeps running behind Apache.

Public URL:

```text
http://<server-ip>/markingsticker
```

Next.js local URL on the server:

```text
http://127.0.0.1:3000/markingsticker
```

## 1. Build and run Next.js

Run this in the project folder on the server:

```bat
npm.cmd install
npm.cmd run build
npm.cmd run start -- -H 127.0.0.1 -p 3000
```

For production, run the start command with a process manager or Windows service
tool so it starts again after reboot.

## 2. Enable Apache modules

In XAMPP Apache config, make sure these modules are enabled:

```apache
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
```

Restart Apache after changing modules.

## 3. Add the Apache folder

Create this folder:

```text
C:/xampp/htdocs/markingsticker
```

Copy `deploy/xampp/.htaccess` into that folder.

The `.htaccess` proxies every request under `/markingsticker` to the local
Next.js server. It should not be copied into the project root.

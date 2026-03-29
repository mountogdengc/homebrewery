# Troubleshooting

Common issues encountered during local development.

---

## Routes returning the wrong page (or redirecting to `/`)

**Symptom:** You add a new Express route (e.g. `app.get('/my-route', ...)`), but visiting it in the browser shows the React SPA landing page instead of your handler's response, or redirects to `/`.

**Cause:** Vite's dev middleware (`vite.middlewares`) is registered early in the middleware stack and acts as a catch-all for HTML requests. If your route is registered *after* the Vite middleware, Vite intercepts the request and serves the SPA's `index.html` before Express ever sees your handler.

There is also a catch-all at the end of `app.js` that redirects any unmatched route to `/`:

```js
if(!req.route) return res.redirect('/');
```

**Fix:** Register routes that serve standalone HTML (non-SPA pages, prototypes, static tools) **before** the Vite middleware block in `server/app.js`:

```js
// Standalone routes — must be BEFORE Vite middleware
app.get('/playtest', (req, res) => {
    res.sendFile(path.resolve(process.cwd(), 'prototypes/willowlight-playtest.html'));
});

if (vite) {
    app.use(vite.middlewares);
}
```

Routes that participate in the SPA (i.e. they call `next()` and let the React renderer handle the response) can go after Vite — only routes that send their own response need to go before it.

---

## `NODE_ENV` not set / features not working locally

**Symptom:** Local-only features don't appear, authentication behaves unexpectedly, or the app refuses to start.

**Cause:** The app checks `NODE_ENV` to decide whether to enable local-only code paths (e.g. local login, skipping SSL). If it's not set to `local`, those paths are disabled.

**Fix:** Set the environment variable permanently:

- **Windows:** System Properties > Environment Variables > New system variable: `NODE_ENV` = `local`
- **macOS/Linux:** Add `export NODE_ENV=local` to your shell profile (`.bashrc`, `.zshrc`, etc.)

Or set it temporarily per session:

- PowerShell: `$env:NODE_ENV="local"`
- CMD: `set NODE_ENV=local`
- Bash: `export NODE_ENV=local`

After changing system environment variables, restart your terminal and dev server.

---

## Restarting the dev server

The dev server is started with `npm start`, which runs `node server.js`. It listens on **port 8000** by default.

**To stop it:** Press `Ctrl+C` in the terminal where it's running.

**If you don't know which terminal it's in**, or need to kill it from elsewhere:

- **Find the process:**
  ```
  netstat -ano | findstr :8000
  ```
  This shows the PID (last column) of whatever is listening on port 8000.

- **Kill it by PID:**
  ```
  taskkill /PID <pid> /F
  ```

- **Or kill all node processes** (careful — this kills everything named `node.exe`, including unrelated tools):
  ```
  taskkill /IM node.exe /F
  ```

**To restart:** Run `npm start` again from the project root.

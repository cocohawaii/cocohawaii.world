# How to Preview Website in Cursor's Browser

## Step 1: Start the Development Server

1. **Open Cursor's Integrated Terminal:**
   - Press `` Ctrl+` `` (backtick key, usually above Tab)
   - OR go to: `Terminal` → `New Terminal`

2. **In the terminal, run:**
   ```bash
   npm run dev
   ```

3. **Wait for the server to start:**
   - You'll see: `▲ Next.js 14.x.x`
   - Then: `✓ Ready in X seconds`
   - Look for: `Local: http://localhost:3001`

## Step 2: Open in Cursor's Simple Browser

1. **Press `Ctrl+Shift+P`** to open Command Palette

2. **Type:** `Simple Browser`

3. **Select:** `Simple Browser: Show` (or `Simple Browser: Open`)

4. **When prompted for URL, enter:**
   ```
   http://localhost:3001
   ```

5. **Press Enter**

The website will now open in Cursor's built-in browser preview! 🎉

## Troubleshooting

- **If npm is not found:** Make sure Node.js is installed and in your PATH
- **If server won't start:** Check the terminal for error messages
- **If Simple Browser doesn't open:** Make sure the server is running first (Step 1)

## Quick Test

Once open, try visiting:
- `http://localhost:3001` - Homepage
- `http://localhost:3001/collections` - Collections page
- `http://localhost:3001/debug` - Debug page (shows API status)



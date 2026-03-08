# Running Multiple Websites

## Your Setup

- **Port 3000**: Your other website ("The Sanctuary")
- **Port 3001**: Coco Hawaii Website (this project)

## How to Run Both Sites

### Option 1: Run Each Site in Separate Terminals

**Terminal 1 - The Sanctuary (Port 3000):**
```bash
cd "path/to/the-sanctuary-project"
npm run dev
# Or if it doesn't specify port, it will use 3000 by default
```

**Terminal 2 - Coco Hawaii (Port 3001):**
```bash
cd "C:\Users\Stan\My Websites On Cursor\CocoHawaii Website 2026"
npm run dev
```

### Option 2: Use Different Ports

If you want to change the Coco Hawaii port, edit `package.json`:

```json
"scripts": {
  "dev": "next dev -p 3002",  // Change to any port you want
  "start": "next start -p 3002"
}
```

## Accessing Your Sites

- **The Sanctuary**: http://localhost:3000
- **Coco Hawaii**: http://localhost:3001

## Troubleshooting

### If you see the wrong website:

1. **Check which port you're accessing**
   - Make sure you're going to `localhost:3001` for Coco Hawaii
   - Not `localhost:3000` (that's The Sanctuary)

2. **Restart the correct server**
   - Stop any running servers (Ctrl+C)
   - Navigate to the correct project folder
   - Run `npm run dev` in that folder

3. **Check what's running on each port**
   ```powershell
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   ```

4. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or open in incognito/private window

## Current Configuration

- ✅ Coco Hawaii is configured to run on port **3001**
- ✅ Your other site should run on port **3000** (default)
- ✅ Both can run simultaneously without conflicts

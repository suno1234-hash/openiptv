# OpenIPTV Troubleshooting Guide

Common issues and their solutions.

---

## 🚨 Playlist Loading Issues

### "Failed to fetch playlist" Error

**Problem:** Getting "Failed to fetch" when adding playlist URL.

**Solutions:**

1. **Check the URL is correct**
   ```
   ✅ Correct: http://example.com/playlist.m3u8
   ❌ Wrong: http://example.com/playlist/
   ```

2. **Verify URL ends with .m3u8 or .m3u**
   - Must have proper file extension
   - Check for typos in the URL

3. **Server might be down**
   - Try the URL in a browser directly
   - If it downloads a file, the URL is valid
   - If you get an error, the server might be offline

4. **Network connection**
   - Check your internet connection
   - Try on a different network
   - Disable VPN if using one

5. **Restart dev server**
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   npm run dev
   ```

### "No channels found in playlist"

**Problem:** Playlist loads but no channels appear.

**Solutions:**

1. **Check playlist format**
   - Playlist must be in M3U8 format
   - Must contain #EXTINF lines
   - Must have valid stream URLs

2. **View playlist contents**
   ```bash
   curl http://your-playlist-url.m3u8
   ```
   
   Should look like:
   ```m3u8
   #EXTM3U
   #EXTINF:-1,Channel Name
   http://stream.url/channel.m3u8
   ```

3. **Try a different playlist**
   - Test with a known working playlist first
   - Verify the format is correct

---

## 🎬 Video Playback Issues

### Video won't play

**Solutions:**

1. **Enable autoplay in browser**
   - Chrome: Settings → Privacy → Site Settings → Autoplay
   - Safari: Preferences → Websites → Auto-Play
   - Set to "Allow"

2. **Check stream URL**
   - Some streams may be offline
   - Try a different channel
   - Click "Retry" button if shown

3. **Browser compatibility**
   - Update to latest browser version
   - Try Chrome, Firefox, or Safari
   - Clear browser cache

4. **Check console for errors**
   - Open Developer Tools (F12)
   - Look for error messages
   - Share errors if asking for help

### Video buffers constantly

**Solutions:**

1. **Check internet speed**
   - Minimum 5 Mbps recommended
   - Test at fast.com

2. **Lower quality manually**
   - Click settings in player
   - Select lower quality

3. **Close other apps**
   - Free up bandwidth
   - Close streaming apps/downloads

### No sound

**Solutions:**

1. **Check volume**
   - Player volume slider
   - System volume
   - Browser tab not muted

2. **Check stream**
   - Some streams may not have audio
   - Try different channel

---

## 💾 Data & Storage Issues

### Favorites not saving

**Solutions:**

1. **Check browser storage**
   - Settings → Privacy → Cookies and Site Data
   - Enable for localhost/your domain

2. **IndexedDB enabled**
   - Don't use private/incognito mode for persistent data
   - Regular browsing mode required

3. **Clear and re-add**
   ```javascript
   // In browser console (F12)
   indexedDB.deleteDatabase('freetv')
   // Then refresh page
   ```

### Lost data after closing browser

**Solutions:**

1. **Don't use Incognito Mode**
   - Use regular browser window
   - Data clears after incognito session

2. **Check browser settings**
   - "Clear data on exit" might be enabled
   - Disable that setting

---

## 🖥️ Development Issues

### Port 3000 already in use

**Error:** `Port 3000 is already in use`

**Solutions:**

```bash
# Option 1: Kill the process
lsof -ti:3000 | xargs kill -9

# Option 2: Use different port
npm run dev -- -p 3001

# Option 3: Find and kill manually
lsof -i :3000
# Note the PID
kill -9 <PID>
```

### "Module not found" errors

**Error:** `Cannot find module 'xyz'`

**Solutions:**

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or just install
npm install
```

### TypeScript errors

**Error:** TypeScript compilation errors

**Solutions:**

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build

# If still errors, check tsconfig.json
```

### Styles not loading

**Problem:** App looks broken, no styling

**Solutions:**

```bash
# 1. Clear cache
rm -rf .next

# 2. Reinstall Tailwind
npm install -D tailwindcss postcss autoprefixer

# 3. Restart dev server
npm run dev
```

---

## 🌐 Browser-Specific Issues

### Safari Issues

**Problem:** Video won't play in Safari

**Solutions:**

1. **Native HLS should work**
   - Safari has native HLS support
   - Check Safari version (14+)

2. **Enable autoplay**
   - Safari → Preferences → Websites → Auto-Play
   - Set to "Allow All Auto-Play"

3. **Check for errors**
   - Develop → Show JavaScript Console
   - Look for security warnings

### Firefox Issues

**Problem:** Video player loading issues

**Solutions:**

1. **Update Firefox**
   - Need version 90+
   - Help → About Firefox

2. **Enable MSE**
   - Should be enabled by default
   - about:config → media.mediasource.enabled → true

### Mobile Browser Issues

**Problem:** Not working on mobile

**Solutions:**

1. **Use Chrome or Safari**
   - Best mobile support
   - Update to latest version

2. **Disable data saver**
   - Can interfere with streaming
   - Turn off in browser settings

3. **Check mobile data**
   - Ensure sufficient data allowance
   - Try on WiFi first

---

## 🔧 Advanced Troubleshooting

### Check API Proxy

The app uses an API proxy to bypass CORS. Verify it's working:

```bash
# Test the proxy endpoint
curl "http://localhost:3000/api/proxy-playlist?url=http://example.com/playlist.m3u8"

# Should return playlist content
```

### Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors (red text)
4. Look for network errors in Network tab

### Check Network Requests

1. Open DevTools (F12)
2. Go to Network tab
3. Try adding playlist
4. Look for failed requests (red)
5. Click failed request to see details

### Clear All Data

If nothing works, reset everything:

```javascript
// Open browser console (F12) and run:

// Clear IndexedDB
indexedDB.deleteDatabase('freetv')

// Clear localStorage
localStorage.clear()

// Then refresh page
location.reload()
```

---

## 📱 Mobile-Specific Issues

### Can't install as PWA

**Problem:** No "Add to Home Screen" option

**Solutions:**

1. **PWA features coming soon**
   - Current MVP doesn't have full PWA yet
   - Use in browser for now

2. **Browser support**
   - iOS Safari: Share → Add to Home Screen
   - Android Chrome: Menu → Add to Home Screen

### Touch controls not working

**Problem:** Can't interact with player on mobile

**Solutions:**

1. **Tap player area**
   - Controls should appear
   - May need to tap again

2. **Try landscape mode**
   - Rotate device
   - Better control visibility

---

## 🆘 Still Having Issues?

### Before Asking for Help

Gather this information:

1. **Browser & Version**
   - Chrome 120? Safari 17? Firefox 121?

2. **Operating System**
   - macOS 14? Windows 11? iOS 17?

3. **Error Messages**
   - Exact error text
   - Screenshot if possible

4. **Steps to Reproduce**
   - What did you do?
   - What happened?
   - What should have happened?

5. **Console Errors**
   - Open DevTools (F12)
   - Copy errors from Console tab

### Get Help

1. **Check documentation**
   - README.md
   - QUICKSTART.md
   - BUILD_SUMMARY.md

2. **Search issues**
   - GitHub Issues tab
   - Someone may have same problem

3. **Create new issue**
   - Include all info above
   - Be specific and detailed

---

## 💡 Tips to Avoid Issues

### Best Practices

✅ **DO:**
- Use latest browser version
- Test on multiple browsers
- Keep playlist URLs valid
- Check internet connection first
- Save playlist URLs somewhere safe
- Use regular browser window (not incognito)

❌ **DON'T:**
- Use expired/invalid URLs
- Use private/incognito mode for regular use
- Clear browser data unnecessarily
- Disable JavaScript
- Use very old browsers
- Expect all streams to work (some may be offline)

### Regular Maintenance

```bash
# Update dependencies monthly
npm outdated
npm update

# Clear cache occasionally
rm -rf .next
npm run dev

# Check for updates
git pull origin main
npm install
```

---

## 📊 Performance Issues

### App running slow

**Solutions:**

1. **Close other tabs**
   - Free up memory
   - One video stream at a time

2. **Clear browser cache**
   - Settings → Privacy → Clear Cache

3. **Restart browser**
   - Close completely
   - Reopen

4. **Check system resources**
   - Close unnecessary apps
   - Check CPU/RAM usage

### High CPU usage

**Solutions:**

1. **Lower video quality**
   - Settings in player
   - Select lower resolution

2. **Hardware acceleration**
   - Enable in browser settings
   - Chrome: Settings → System → Use hardware acceleration

---

## 🔐 Security Warnings

### "Not Secure" warning

**Normal for development**
- localhost doesn't use HTTPS
- Safe in development
- Production will have HTTPS

### Certificate errors in production

**Solutions:**

1. **Check SSL certificate**
   - Should auto-configure on Vercel/Netlify
   - May need to wait 5-10 minutes

2. **Force HTTPS**
   - Add in next.config.js if needed

---

## 📞 Quick Fixes Checklist

Try these in order:

- [ ] Refresh the page (Cmd/Ctrl + R)
- [ ] Hard refresh (Cmd/Ctrl + Shift + R)
- [ ] Close and reopen browser
- [ ] Clear browser cache
- [ ] Try different browser
- [ ] Check internet connection
- [ ] Restart dev server
- [ ] Clear .next folder
- [ ] Reinstall dependencies
- [ ] Check for typos in URL

---

**Still stuck? Open an issue with details!**

# Testing Quick Reference Card

**Print this out or keep on phone while testing!**

---

## 🖥️ DESKTOP TESTING (5 minutes per section)

### Service Worker Check
```
DevTools (F12) → Application → Service Workers
✓ Registered and running
✓ Status: "activated and running"
✓ Green indicator
```

### Install Check
```
Address bar → Install icon (⬇️ in circle)
✓ Click → Dialog appears
✓ Click Install
✓ App in taskbar/Applications
```

### Offline Test
```
DevTools → Network → Check "Offline"
✓ Pages load instantly
✓ Offline banner visible
✓ Graceful error handling
✓ Uncheck to go back online
```

### Performance
```
DevTools → Lighthouse
✓ Run audit (Mobile)
✓ Performance > 90
✓ PWA > 95
```

---

## 📱 ANDROID (Chrome Mobile)

### Layout ✓
- [ ] Bottom nav visible
- [ ] Sidebar hidden
- [ ] Navigation works
- [ ] Scrolling smooth

### Photos Online ✓
- [ ] "Take Photo" works
- [ ] "Choose File" works
- [ ] Preview shows
- [ ] Queue shows status

### Offline ✓
- [ ] Airplane Mode ON
- [ ] Offline banner shows
- [ ] Can take photos
- [ ] Airplane Mode OFF
- [ ] Photos auto-upload

### Touch ✓
- [ ] Buttons 44px+ tall
- [ ] Inputs 48px+ tall
- [ ] Instant feedback
- [ ] No accidental taps

---

## 🍎 iOS (Safari)

### Install ✓
- [ ] Share → "Add to Home Screen"
- [ ] Tap "Add"
- [ ] Icon on home screen
- [ ] Launch full-screen

### Photos ✓
- [ ] Can take photos
- [ ] Can choose from library
- [ ] Preview shows
- [ ] Queue visible

### Offline ✓
- [ ] Airplane Mode ON
- [ ] App still works
- [ ] Take photos
- [ ] Airplane Mode OFF
- [ ] Photos upload

### Input ✓
- [ ] No zoom on tap
- [ ] Keyboard appears
- [ ] Text readable
- [ ] Can select dropdowns

---

## 🚨 QUICK TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Service worker not registered | Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac) |
| Install button missing | Need HTTPS (localhost works for testing) |
| Photos not uploading | Check Network tab for failed requests |
| App won't go offline | Clear cache, hard refresh, wait for SW to load |
| Photos missing after sync | Refresh browser, check server database |

---

## 📊 CHECKLIST FORMAT

For each section, mark:
- **✓** = PASS
- **✗** = FAIL
- **N/A** = Not Applicable
- **☐** = Not tested yet

---

## 📝 NOTES TO TRACK

**When something fails**:
1. Note the exact test item
2. Write what happened
3. Note if it's blocking deployment
4. Include device/browser info

Example:
```
FAIL: Photos upload on iOS
- Attempted: Take photo and upload
- Result: Stuck on "Uploading" status
- Device: iPhone 12, iOS 16.5
- Blocking: Maybe
- Note: Retry works, just slow
```

---

## ⏱️ TIMING GUIDE

| Section | Time | Device |
|---------|------|--------|
| Desktop Service Worker | 15 min | Chrome |
| Desktop Install | 10 min | Chrome |
| Desktop Offline | 20 min | Chrome |
| Desktop Performance | 15 min | Chrome |
| **Subtotal** | **60 min** | |
| Android Layout | 15 min | Android |
| Android Photos | 20 min | Android |
| Android Offline | 20 min | Android |
| Android Touch | 10 min | Android |
| **Subtotal** | **65 min** | |
| iOS Install | 10 min | iPhone |
| iOS Photos | 15 min | iPhone |
| iOS Offline | 15 min | iPhone |
| iOS Input | 10 min | iPhone |
| **Subtotal** | **50 min** | |
| **TOTAL** | **175 min ≈ 3 hours** | |

---

## 🎯 CRITICAL TESTS (Must Pass)

1. ✅ Service worker registers
2. ✅ App installs to home screen
3. ✅ Works offline completely
4. ✅ Photos queue offline
5. ✅ Photos auto-upload online
6. ✅ Touch targets adequate
7. ✅ No console errors
8. ✅ Performance good

If ANY critical test fails, note and fix before deployment.

---

## 📱 MOBILE DEVICE LOCAL ACCESS

**To access your local app from phone**:

```bash
# 1. Find your computer's IP
ipconfig getifaddr en0        # macOS
hostname -I                    # Linux

# 2. Run app on your IP
npm run dev -- --host 0.0.0.0

# 3. On phone, visit:
http://YOUR_IP:5173
```

**For HTTPS (recommended)**:
```bash
# Use ngrok
npm install -g ngrok
npm run dev
ngrok http 5173
# Share ngrok URL with phone
```

---

## 💾 SAVE YOUR RESULTS

1. Fill out `PHASE3C_TESTING_CHECKLIST.xlsx`
2. Add notes for any failures
3. Save with today's date
4. Keep for deployment record

**File naming**: `TESTING_RESULTS_2026-03-26.xlsx`

---

## 🚀 DEPLOYMENT READINESS

Only deploy if:
- [ ] All critical tests PASS
- [ ] No console errors
- [ ] Performance meets targets
- [ ] No data loss observed
- [ ] Photos sync reliably
- [ ] Offline mode works
- [ ] Cross-device compatibility verified

---

## 📞 NEED HELP?

Check the full guides:
- **Detailed Steps**: `TESTING_GUIDE_STEPBYSTEP.md`
- **Complete Deployment**: `PHASE3C_TESTING_DEPLOYMENT.md`
- **Troubleshooting**: See Phase 3C guide under "Troubleshooting Guide"

---

**Happy Testing! 🎉**

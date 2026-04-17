# ✅ Photo Upload Implementation Checklist

## Phase 1: Backend Setup (Do This in Supabase)

### Database
- [ ] Open Supabase SQL Editor
- [ ] Copy & paste the SQL from PHOTO_SETUP_GUIDE.md Step 1
- [ ] Run the query
- [ ] Verify `update_photos` table appears in Tables section
- [ ] Verify RLS policies are enabled (padlock icon)

### Storage
- [ ] Go to Storage in Supabase
- [ ] Create new bucket named `daily-update-photos`
- [ ] Set bucket to **Public**
- [ ] Click Create

### Storage Policies
- [ ] Go to bucket → Policies tab
- [ ] Create 3 policies (copy from PHOTO_SETUP_GUIDE.md Step 2)
- [ ] Policy 1: "Authenticated users can upload"
- [ ] Policy 2: "Anyone can view photos"
- [ ] Policy 3: "Users can delete their own"
- [ ] Verify all 3 policies appear in list

---

## Phase 2: Code Integration (Do This Locally)

### Files Already Created ✅
These are ready to use:
- [x] `src/lib/photoService.js` - Photo operations
- [x] `src/components/PhotoUploader.jsx` - Upload UI
- [x] `src/components/PhotoGallery.jsx` - Display UI
- [x] `src/pages/Updates.ENHANCED.jsx` - Full page with photos

### Choose Your Integration Path

#### Path A: Minimal Integration (Recommended for Testing)
1. [ ] Keep your current `src/pages/Updates.jsx`
2. [ ] Add these imports at the top:
   ```javascript
   import PhotoUploader from '../components/PhotoUploader'
   import PhotoGallery from '../components/PhotoGallery'
   import { getPhotosForUpdate } from '../lib/photoService'
   ```
3. [ ] In the JSX where photos should display, add:
   ```javascript
   {updatePhotos[update.id]?.length > 0 && (
     <PhotoGallery
       photos={updatePhotos[update.id]}
       userId={user.id}
       onPhotoDeleted={() => fetchData()}
     />
   )}
   ```
4. [ ] Update your `fetchUpdates()` to use the new service:
   ```javascript
   if (data && data.length > 0) {
     const photoMap = {}
     for (const update of data) {
       const photos = await getPhotosForUpdate(update.id)
       photoMap[update.id] = photos
     }
     setUpdatePhotos(photoMap)
   }
   ```

#### Path B: Full Replacement (Cleanest)
1. [ ] Backup current: `cp src/pages/Updates.jsx src/pages/Updates.BACKUP.jsx`
2. [ ] Replace: `cp src/pages/Updates.ENHANCED.jsx src/pages/Updates.jsx`
3. [ ] Delete: `rm src/pages/Updates.ENHANCED.jsx`

### Testing Locally
1. [ ] Start dev server: `npm run dev`
2. [ ] Navigate to Daily Updates page
3. [ ] Click "Log Update"
4. [ ] Fill in form and create update
5. [ ] Click "Add Photos" section
6. [ ] Drag & drop an image OR click to select
7. [ ] See preview before upload
8. [ ] Upload completes (see success toast)
9. [ ] Photos appear in gallery immediately
10. [ ] Test hover actions (preview, download, delete)
11. [ ] Test delete photo with confirmation
12. [ ] Verify in Supabase Storage bucket photos appear

---

## Phase 3: Deployment

- [ ] Test all photo operations
- [ ] Commit code changes: `git add -A && git commit -m "Add photo upload feature"`
- [ ] Push to production: `git push`
- [ ] Build for production: `npm run build`
- [ ] Deploy (wherever you host)

---

## Phase 4: Post-Deployment Verification

- [ ] Login to production app
- [ ] Create a daily update
- [ ] Upload photos
- [ ] Verify photos display
- [ ] Test delete photo
- [ ] Check Supabase Storage has files
- [ ] Verify `update_photos` table has records

---

## Common Issues & Fixes

### Issue: "Cannot upload photo"
**Solution**: Check Supabase storage policies
- [ ] Go to bucket → Policies
- [ ] Verify "upload" policy exists
- [ ] Policy condition should be `bucket_id = 'daily-update-photos'`

### Issue: "Photos don't show after upload"
**Solution**: Check update_photos table and RLS
- [ ] Go to Supabase → Table Editor → update_photos
- [ ] Verify rows were inserted
- [ ] Check RLS SELECT policy is enabled
- [ ] Verify `auth.role() = 'authenticated'`

### Issue: "Storage bucket not found"
**Solution**: Verify bucket exists
- [ ] Go to Supabase → Storage
- [ ] Look for `daily-update-photos` bucket
- [ ] If missing, create it (must be Public)

### Issue: "File too large error"
**Solution**: Size limit is 5MB
- [ ] Compress image before upload
- [ ] Or increase limit in `photoService.js` line 7:
   ```javascript
   const MAX_FILE_SIZE = 5 * 1024 * 1024 // Change this
   ```

### Issue: "Only certain users can see photos"
**Solution**: Check RLS policies
- [ ] Verify SELECT policy uses `auth.role() = 'authenticated'`
- [ ] Not `auth.uid() = ...` (that would be private)

---

## Rollback Instructions (If Needed)

### If Using Path A (Minimal Integration)
1. [ ] Remove PhotoUploader/PhotoGallery imports
2. [ ] Remove JSX components
3. [ ] Keep old photo logic

### If Using Path B (Full Replacement)
1. [ ] Restore from backup: `cp src/pages/Updates.BACKUP.jsx src/pages/Updates.jsx`
2. [ ] Delete ENHANCED version

### Database Rollback
1. [ ] Go to Supabase SQL Editor
2. [ ] Run:
   ```sql
   DROP TABLE IF EXISTS public.update_photos CASCADE;
   ```
3. [ ] Delete `daily-update-photos` storage bucket

---

## Success Criteria

✅ Your photo feature is working when:
- [ ] Can create daily update
- [ ] Can drag-drop photos to uploader
- [ ] Photos upload successfully
- [ ] Photos appear in gallery grid
- [ ] Can preview photos (click zoom)
- [ ] Can download photos
- [ ] Can delete photos (with confirmation)
- [ ] Photos persist after page refresh
- [ ] Other users can view photos (if not private)
- [ ] Supabase shows files in storage bucket
- [ ] Supabase shows records in update_photos table

---

## Timeline Estimate

| Phase | Est. Time |
|-------|-----------|
| Backend Setup | 10-15 min |
| Code Integration | 10-20 min |
| Local Testing | 10-15 min |
| **Total** | **30-50 min** |

---

## Need Help?

### Reference Files
- `PHOTO_SETUP_GUIDE.md` - Detailed backend setup
- `PHOTO_INTEGRATION_GUIDE.md` - Detailed code integration
- `PROJECT_STATUS.md` - Overall project status

### Key Files to Review
- `src/lib/photoService.js` - How photo operations work
- `src/components/PhotoUploader.jsx` - Upload UI logic
- `src/components/PhotoGallery.jsx` - Gallery display logic

---

## 🎉 Next Features After Photos

Once photos are working, consider:

1. **Photo Analytics**
   - Most photos per project
   - Photos per user
   - Storage usage tracking

2. **Enhanced Gallery**
   - Timeline view
   - Filter by date
   - Search by project
   - Before/after pairs

3. **Reports with Photos**
   - Export PDF with photos
   - Project progress report
   - Photo galleries in reports

4. **Customer Features**
   - Let customers see project photos
   - Photo timelines on portal
   - Progress galleries

---

**Last Updated**: 2026-03-24
**Version**: 1.0
**Status**: Ready to Implement ✅


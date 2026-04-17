# 📸 Photo Upload Setup Guide

## Step 1: Create Supabase Storage Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click **Create a new bucket**
3. Name it: `daily-update-photos`
4. Keep it **Public** (so customers can view photos)
5. Click **Create bucket**

---

## Step 2: Set Bucket Policies

Go to **Bucket Details** → **Policies** → **Custom policies**

### Policy 1: Allow authenticated users to upload
```sql
create policy "Authenticated users can upload photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'daily-update-photos' AND
  auth.role() = 'authenticated'
);
```

### Policy 2: Allow public to view
```sql
create policy "Anyone can view photos"
on storage.objects
for select
to public
using (bucket_id = 'daily-update-photos');
```

### Policy 3: Allow users to delete their own photos
```sql
create policy "Users can delete their own photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'daily-update-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Step 3: Database Update (Add Photos Table)

Add this to your Supabase SQL:

```sql
-- Photos table linked to daily updates
CREATE TABLE IF NOT EXISTS public.update_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID REFERENCES public.daily_updates(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.update_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view photos for authenticated updates"
  ON public.update_photos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can upload photos to their updates"
  ON public.update_photos FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own photos"
  ON public.update_photos FOR DELETE
  USING (auth.uid() = uploaded_by);
```

---

## Step 4: Environment Variables

No new env vars needed - your existing Supabase key has storage permissions.

---

## File Structure

After setup, files will be stored as:
```
daily-update-photos/
├── {user_id}/{update_id}/{filename}
```

This structure maintains security and organization.

---

## Next Steps

1. Run the SQL above in Supabase
2. Create the Supabase bucket
3. Update your `src/lib` with the photo utilities
4. Update the Updates page component

The code files will handle the rest! ✨


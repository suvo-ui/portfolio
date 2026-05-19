# Cloudinary Media Setup

The backend can store all new public uploads in Cloudinary by setting:

```env
MEDIA_STORAGE_DRIVER=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

The upload routes keep the same API responses as before:

- artwork and hero uploads return `url` and `image_variants`
- workshop image uploads return `image_url` and `image_variants`
- workshop video uploads return `video_url`
- course video uploads store a Cloudinary URL in `course_page.video_path`

Images are still optimized locally into `thumb`, `card`, and `large` WebP
variants before upload, so the frontend image selection logic does not need to
change.

## Migration

Keep the existing Supabase variables while copying old media:

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
```

Run a dry run first:

```powershell
cd backend
$env:DRY_RUN='1'; npm.cmd run migrate:media-cloudinary
```

After reviewing the planned rows, run the real migration:

```powershell
$env:DRY_RUN='0'; npm.cmd run migrate:media-cloudinary
```

After the migration completes, verify there are no remaining Supabase media references before deleting buckets:

```powershell
npm.cmd run verify:media-cloudinary
```

Leave Supabase Storage files in place until the live site has been verified.

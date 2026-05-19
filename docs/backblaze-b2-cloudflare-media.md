# Backblaze B2 + Cloudflare Media Setup

This app can store uploaded media in Backblaze B2 and serve it through a
Cloudflare-proxied media hostname. The backend stores clean public URLs such as
`https://media.example.com/artworks/...`, while Cloudflare rewrites requests to
Backblaze's public bucket path behind the scenes.

## 1. Backblaze B2

1. Create a public B2 bucket, for example `paper-slayer-media`.
2. Upload one small test file to the bucket.
3. Open the test file through Backblaze and copy the friendly download host,
   for example `f000.backblazeb2.com`.
4. Create an Application Key restricted to the media bucket with read/write
   access.
5. Copy the bucket S3 endpoint and region, for example:

```env
B2_S3_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
```

## 2. Cloudflare DNS

Create a proxied CNAME:

```text
Type: CNAME
Name: media
Target: f000.backblazeb2.com
Proxy status: Proxied
```

Use your actual Backblaze friendly download host as the target.

## 3. Cloudflare URL Rewrite

Create a URL Rewrite Transform Rule:

```text
When:
  http.host eq "media.example.com"

Rewrite path:
  Dynamic
  concat("/file/paper-slayer-media", http.request.uri.path)
```

Replace `media.example.com` and `paper-slayer-media` with the real hostname and
bucket name. This maps:

```text
https://media.example.com/artworks/example.webp
```

to the Backblaze origin path:

```text
/file/paper-slayer-media/artworks/example.webp
```

## 4. Cloudflare Cache Rule

Create a cache rule for the media hostname:

```text
When:
  http.host eq "media.example.com"

Cache eligibility:
  Eligible for cache

Edge TTL:
  Respect origin headers
```

The backend writes uploaded media with long `Cache-Control` headers, so
Cloudflare can cache the portfolio assets aggressively.

## 5. Backend Environment

Set these values locally and in production:

```env
MEDIA_STORAGE_DRIVER=b2
B2_S3_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
B2_KEY_ID=your-b2-application-key-id
B2_APPLICATION_KEY=your-b2-application-key
B2_BUCKET_NAME=paper-slayer-media
B2_PUBLIC_BASE_URL=https://media.example.com
```

Keep the existing Supabase variables while migrating:

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
```

## 6. Migration

Run a dry run first:

```powershell
cd backend
$env:DRY_RUN='1'; npm.cmd run migrate:media-b2
```

After the planned rows look right, run the real migration:

```powershell
$env:DRY_RUN='0'; npm.cmd run migrate:media-b2
```

Do not delete Supabase Storage files until the public pages and new uploads have
been verified through Cloudflare.

## 7. Verification

Check one migrated media URL:

```powershell
curl.exe -I https://media.example.com/artworks/example.webp
```

Look for Cloudflare response headers such as `cf-cache-status`, and confirm the
URL returns `200`.

# portfolio

## Media storage

The backend stores public uploads in Backblaze B2 and serves them through a
Cloudflare-proxied media hostname. See
[docs/backblaze-b2-cloudflare-media.md](docs/backblaze-b2-cloudflare-media.md).

Cloudinary remains documented for legacy deployments and migrations in
[docs/cloudinary-media.md](docs/cloudinary-media.md).

Run the 30-day orphan cleanup from production cron:

```powershell
cd backend
$env:DRY_RUN='1'; npm.cmd run cleanup:media
```

Use `DRY_RUN=0` for the scheduled cleanup run after reviewing dry-run output.

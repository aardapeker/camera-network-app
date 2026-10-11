# S3 Backup Setup Guide

Follow these steps when setting up the backup system on a new AWS account (e.g. moving to a company account).

---

## 1. Create an S3 Bucket

1. Go to **AWS Console → S3 → Create bucket**
2. Settings:
   - **Bucket name**: `fielddesk-backups` (or any name — update `AWS_S3_BUCKET` env var to match)
   - **Region**: choose one close to your server (e.g. `eu-north-1` Stockholm, `eu-central-1` Frankfurt)
   - **Block all public access**: ✅ ON (keep default — bucket must be private)
   - **Versioning**: off (not needed, we manage retention ourselves)
   - **Encryption**: default (SSE-S3) is fine
3. Click **Create bucket**

---

## 2. Create an IAM User

1. Go to **AWS Console → IAM → Users → Create user**
2. **User name**: `fielddesk-backup-s3-user` (or similar)
3. **Access type**: select **Programmatic access only** (no console access needed)
4. Skip adding to a group for now — attach policy directly in the next step
5. Click **Create user**

---

## 3. Attach an IAM Policy

After creating the user, go to the user → **Add permissions → Attach policies directly → Create inline policy** (or create a managed policy).

Use this minimal policy (replace `YOUR_BUCKET_NAME` with your actual bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListBucket",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:HeadBucket"
      ],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME"
    },
    {
      "Sid": "ReadWriteObjects",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```

**Why each permission:**
- `ListBucket` / `HeadBucket` — health check and listing backups
- `GetObject` — downloading backups for restore
- `PutObject` — uploading new backups
- `DeleteObject` — pruning old backups (keeps last 30)

---

## 4. Generate Access Keys

1. Go to the IAM user → **Security credentials** tab
2. Click **Create access key**
3. Select **Application running outside AWS**
4. Download or copy the **Access key ID** and **Secret access key**
5. Store them securely — you will not be able to see the secret key again

---

## 5. Configure Environment Variables

Add the credentials to your `.env` file (never commit this file):

```env
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_S3_BUCKET=fielddesk-backups
AWS_S3_REGION=eu-north-1
```

These are passed to the backend Docker container via `compose.dev.yml` / `compose.yml`.

---

## 6. Bucket Structure

The application stores files in S3 with this layout:

```
fielddesk-backups/
├── db/
│   ├── backup-2026-02-22T00-00.sql.gz   ← PostgreSQL dump (pg_dump custom format)
│   ├── backup-2026-02-23T00-00.sql.gz
│   └── ...                              ← last 30 kept, older auto-deleted
└── images/
    └── users/
        ├── alice/
        │   ├── profile-picture/
        │   └── blueprints/
        └── bob/
            └── ...
```

- **DB dumps**: full dump on every backup (auto daily at midnight UTC, or manual)
- **Images**: incremental — only files modified since the last backup are uploaded

---

## Notes

- The auto backup runs at **midnight UTC** (`0 0 0 * * *`). Adjust the cron in `BackupServiceImpl.java` if you need a different time.
- Only the last **30 DB dumps** are kept. Images are never auto-deleted from S3.
- If S3 credentials are missing or invalid, the backup/restore UI shows a warning banner and all backup actions are disabled.

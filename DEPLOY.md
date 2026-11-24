# Deploy on Cloudflare Pages (from your phone)

Takes about 10 minutes. Everything is free tier. Use your phone browser and go to **dash.cloudflare.com**. If the menu is hidden, tap **☰** at the top left.

## 1. Create the database (D1)

1. Menu → **Storage & Databases** → **D1 SQL Database**.
2. Tap **Create** (or **Create database**).
3. Name: `fourth-dimension`. Location: leave it on automatic. Tap **Create**.
4. Open the new database, then the **Console** tab.
5. Open `migrations/0001_init.sql` in this repo on GitHub, tap **Raw**, and copy all of it.
6. Paste it into the Console and tap **Execute**.
7. Do the same with `migrations/0002_comment_owners.sql`. It adds the columns that let readers edit and delete their own comments.

   (Steps 5–7 are optional. The site creates the tables and columns itself on its first comment or reaction. If 0002 says "duplicate column name", the site already did it, so there's nothing to do.)

## 2. Connect the repo

1. Menu → **Workers & Pages** → **Create** → **Pages** tab → **Connect to Git**.
   (If you only see a Workers screen, look for the link "Looking to deploy Pages? Get started".)
2. Choose **GitHub** and allow access to `projectx0050/the-fourth-dimension`. Select it and tap **Begin setup**.
3. Fill in:
   - **Project name:** `thefourthdimension` (this gives `thefourthdimension.pages.dev`)
   - **Production branch:** `main`
   - **Framework preset:** `Astro`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Open **Environment variables (advanced)** and add `NODE_VERSION` = `22`.
   (The repo's `.nvmrc` already asks for Node 22. This just makes sure.)
5. Tap **Save and Deploy**. Wait for the build to finish.

## 3. Bind the database to the site

1. Workers & Pages → **thefourthdimension** → **Settings** → **Bindings** → **Add** → **D1 database**.
2. **Variable name:** `DB` (capitals, exactly that). **D1 database:** `fourth-dimension`. Tap **Save**.
3. Do this for **Production**. If there is a Preview environment selector, do it there too if you want comments on preview links.
4. Optional but recommended: Settings → **Variables and Secrets** → **Add**. Name it `IP_SALT`, choose type **Secret**, and set the value to any long random text. This keeps the stored IP fingerprints unguessable.
5. Bindings only apply to new builds. Go to **Deployments**, open the menu (**⋯**) on the latest deployment, and tap **Retry deployment**.

## 4. Check it

- Open https://thefourthdimension.pages.dev, open an article, tap a reaction and post a test comment.
- If you see "Comments and reactions aren't switched on yet", the `DB` binding is missing or you skipped the redeploy in step 3.5.

## Every day after that

Push to `main` and Cloudflare rebuilds the site by itself.

## Already live? Adding edit/delete

If the site and database were set up before readers could edit or delete their own comments, you don't need to do anything. On its next request the site adds the two new columns (`owner_hash`, `edited_at`) by itself. To do it by hand instead, run `migrations/0002_comment_owners.sql` in the D1 Console as in step 1.

Comments posted before this change have no owner, so nobody can edit or delete them except you, using the SQL below.

## Moderating comments

Readers can edit and delete their own comments, but only from the browser they posted from. There is no sign-in: the browser keeps a random ID, and the database stores only a hash of it. If a reader clears their browser data or switches phones, they can't change their old comments any more. You can always change any comment here.

D1 → `fourth-dimension` → **Console**:

```sql
-- latest comments (edited_at is set when the reader edited it)
SELECT id, slug, name, body, created_at, edited_at FROM comments ORDER BY id DESC LIMIT 50;
-- hide one (keeps a record)
UPDATE comments SET hidden = 1 WHERE id = 123;
-- or delete it
DELETE FROM comments WHERE id = 123;
```

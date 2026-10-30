# Stroll

A small web app where you walk, virtually, to somewhere amazing: the Emerald City, Santiago, Neverland, Camelot, Atlantis, the Dark Mountain, the end of the Appalachian Trail. Pick a destination, log your miles, and watch a storybook scene carry you along the trail. Walk on your own, or share an invite link and pool miles with friends. Storybook style, built for phones.

The office edition is the original journey: a team walk from Layton, Utah to the North Pole, 3,381 miles due north, following the stops on the "Elves on a Self-Care Journey" poster.

What it does today:

- Sign in with Google (one tap, progress is kept across devices)
- Choose a destination and start a solo journey, or start a group and share an invite link. A friend who joins your solo journey turns it into a group walk.
- Add your miles (walking, running, treadmill), or the calories you burned doing anything else (yoga, swimming, biking, lifting): every 100 calories counts as 1 mile. The Add miles tab lists typical calories for common activities.
- See your progress: an animated storybook scene with its own scenery for every destination (a hiker walks past wooden signposts; the elf walks the North Pole route), a wooden mile marker, and a "Did you know?" fact for each stop (the office's North Pole route shows the poster's "Remember" self-care notes instead)
- See your own total miles
- An Awards tab: team badges for every stop and border on the route, plus personal badges for streaks, milestones, early-bird and night-owl walks, weekends, a marathon-length entry and Elf of the Week. Badges unlock with a pop-up the moment miles are added, and relock if the miles that earned them are removed.
- A celebration when the team reaches the Pole

Runs on Cloudflare Pages with a small database (Cloudflare D1). No monthly cost at this size.

---

## Setup — about 30 minutes

You need: a Cloudflare account, a GitHub account, and a Google account. Do the steps in this order.

### Step 1 — Create the database

1. In the Cloudflare dashboard, open **Storage & Databases → D1** and click **Create database**. Name it `north-pole-walk`.
2. Open the database. Copy its **Database ID** (a long string of letters and numbers). You'll paste it in Step 3.
3. Click the **Console** tab. Open the file `schema.sql` from this folder, copy everything in it, paste it into the console, and run it. This creates the tables.

### Step 2 — Set up Google sign-in

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a new project (name it anything, like "North Pole Walk").
2. Open **APIs & Services → OAuth consent screen** (Google sometimes labels this **Google Auth Platform**). Choose **External**, fill in the app name and your email, and save. You don't need to add any scopes.
3. Set the app to **In production** (there's a "Publish app" button). This lets anyone with a Google account sign in. No review is needed, because the app only asks for name and email.
4. Open **APIs & Services → Credentials → Create credentials → OAuth client ID**. Choose **Web application**. Leave the origins empty for now — you'll add your site address in Step 5.
5. Copy the **Client ID**. It ends in `.apps.googleusercontent.com`.

### Step 3 — Paste both IDs into the project

Open `wrangler.toml`. Under the production section:

- `GOOGLE_CLIENT_ID` — paste the Client ID from Step 2
- `database_id` — paste the Database ID from Step 1

Save the file.

**Previews use a second, separate database.** Cloudflare builds a preview site for every branch other than `main`. The `[env.preview]` section of `wrangler.toml` points those previews at a *test* database so trying things out on a preview never touches the real walks. To set it up once: create a second D1 database (name it `stroll-test`), run `schema.sql` in its console, and paste its Database ID into the `[[env.preview.d1_databases]]` line marked `CHANGE ME`. Then add the preview address (shown in Cloudflare's deployment list, like `https://my-branch.north-pole-walk.pages.dev`) to the Google client's authorized origins in Step 5.

### Step 4 — Put the code on GitHub and deploy

1. Create a new GitHub repository and upload this whole folder to it (everything except `node_modules`, if that exists).
2. In Cloudflare, open **Workers & Pages → Create → Pages → Connect to Git** and pick the repository.
3. Build settings: Framework preset **None**, build command **empty**, build output directory **`public`**. Deploy.
4. When it finishes, you'll have a site address like `https://north-pole-walk.pages.dev`. Copy it.

### Step 5 — Tell Google where the site lives

1. Back in Google Cloud → **Credentials**, open the OAuth client you made.
2. Under **Authorized JavaScript origins**, add your site address exactly, like `https://north-pole-walk.pages.dev` (no slash at the end).
3. Save. Google can take a few minutes to apply this.

If you later add a custom domain to the site, add that address here too. Each branch preview you want to sign in on needs its address here as well.

### Updating an existing database

When a change needs new columns, it comes with a numbered file in `migrations/`. Run that file once in the D1 console of each database that already exists (the live one and `stroll-test`). A brand-new database just runs `schema.sql`, which already includes everything. Run a migration *before* merging the code that needs it: adding a column never bothers the older code.

### Step 6 — Start the journey

1. Open your site. Sign in with Google.
2. Give your team a name and tap **Begin the journey**.
3. Open the **Team** tab and send the invite link to everyone. They tap it, sign in with Google, and they're on the team.
4. Everyone adds miles from the **Add miles** tab. Watch the marker move.

---

## How the pieces fit (if you want to learn this side of things)

- **`public/`** — the website people see. Plain HTML, CSS, and JavaScript. No build tools. `app.js` draws the screens; `journey.js` holds every destination with its stops, facts and badges; `scene.js` draws the side-scrolling scene, with a theme per destination; `badges.js` holds the award icons.
- **`functions/`** — the small backend. Each file in `functions/api/` is one web address under `/api/`. For example, `functions/api/miles.js` handles `POST /api/miles`, which is how miles get saved, and `functions/api/awards.js` answers `GET /api/awards`. The award rules live in `functions/lib/awards.js`; they are worked out fresh from the mile entries every time (nothing is stored), using Denver time for days, weeks and times of day. Cloudflare runs these for you; there's no server to manage.
- **D1** — the database. It's a normal SQL database (SQLite) that Cloudflare hosts. `schema.sql` describes its five tables: users, sessions, teams, team_members, mile_entries. A "team" row is any walk: `kind` is `solo` for one person's journey or `team` for a group.
- **`docs/`** — where the app stands, the ordered build list, and the plan for automatic step syncing.
- **`wrangler.toml`** — the settings file. It tells Cloudflare which database to connect and your Google client ID.
- **Sign-in** — Google gives the browser a signed token. The browser sends it to `functions/api/auth/google.js`, which asks Google to confirm it's real, saves the person in the `users` table, and sets a cookie so they stay signed in for 90 days.

A good first thing to tinker with: open `public/journey.js` and change a "Did you know?" fact, or add a new stop. To add a whole destination, copy one of the journey objects, give it a new id, and list the id in `JOURNEY_ORDER`; the scenery comes from the `theme` you pick.

## Running it on your own computer (optional)

```
npm install
npm run db:local
npm run dev
```

Then open `http://localhost:8788`. For Google sign-in to work locally, add `http://localhost:8788` as an authorized origin in Google (Step 5). The local database is separate from the live one.

## If something isn't working

- **The sign-in button does nothing, or shows an error popup** — the site address isn't in Google's authorized origins yet (Step 5), or Google hasn't applied it yet. Wait a few minutes and try again.
- **The cover page says "Almost ready"** — one of the two `CHANGE ME` lines in `wrangler.toml` still has the placeholder, or the database isn't connected. Fix it and push to GitHub; the site redeploys on its own.
- **Errors after signing in** — the tables probably weren't created. Repeat Step 1, part 3.
- **Someone's invite link doesn't work** — invite codes are case-insensitive, but the link must be the full address, e.g. `https://your-site.pages.dev/join/ABC123`.

## What's next

See `docs/STATUS.md` for the ordered build list and `docs/step-sync-plan.md` for automatic step counting (Apple Health first).

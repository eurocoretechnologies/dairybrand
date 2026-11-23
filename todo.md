# Owner tasks

Everything the code needs from you before launch. Tick items off as you go.
Values in `[brackets]` on the site are placeholders until these are done.

## 1. Merge the pull requests (in order)

- [ ] Merge PR #1 (foundation) into `main`
- [ ] Merge PR #2 (storefront); it retargets to `main` after #1
- [ ] Merge PR #3 (order flow)
- [ ] Merge PR #4 (owner dashboard)

## 2. Supabase

- [ ] Create the project: region **South Asia (Mumbai)**; keep the database password safe
- [ ] SQL Editor: run `supabase/migrations/20261120000000_init.sql`
- [ ] SQL Editor: run `supabase/migrations/20261122000000_place_order.sql`
- [ ] SQL Editor: run `supabase/migrations/20261123000000_owner_dashboard.sql` (also turns on live order alerts)
- [ ] SQL Editor: run `supabase/seed.sql` (sample content to edit)
- [ ] Authentication → Sign In / Providers: turn **off** "Allow new users to sign up"
- [ ] Authentication → URL Configuration: set Site URL to the production domain
- [ ] Create the owner login: Authentication → Users → Add user, then in the SQL Editor:
      `update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"owner"}' where email = 'OWNER_EMAIL';`
- [ ] Copy from Project Settings → API Keys: Project URL, publishable (anon) key, secret (service_role) key
- [ ] Optional: Database → Webhooks → POST to `https://DOMAIN/api/revalidate` with header
      `Authorization: Bearer REVALIDATE_SECRET`, on insert/update/delete of `products`,
      `product_variants`, `product_images`, `banners`, `reviews`, `settings`, `serviceable_pincodes`

## 3. Resend (order emails)

- [ ] Create an account at resend.com
- [ ] Domains → add the brand domain and add the DNS records it shows (SPF, DKIM) at your domain registrar; wait for "Verified"
- [ ] API Keys → create a key with "Sending access"
- [ ] Decide the sender, e.g. `Ksheera <orders@yourdomain.in>`

## 4. Vercel

- [ ] Import `eurocoretechnologies/dairybrand`; Node.js 22.x; production branch `main`
- [ ] Generate two secrets (run twice): `openssl rand -hex 32`
- [ ] Add environment variables (Production and Preview unless noted):

| Variable                            | Value                                               |
| ----------------------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`          | Supabase Project URL                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`     | Supabase publishable / anon key                     |
| `SUPABASE_SERVICE_ROLE_KEY`         | Supabase secret / service_role key (mark Sensitive) |
| `NEXT_PUBLIC_SITE_URL`              | `https://yourdomain.in`                             |
| `DEFAULT_PALETTE`                   | `peacock-brass`                                     |
| `NEXT_PUBLIC_ALLOW_PALETTE_PREVIEW` | `false` in Production, `true` in Preview            |
| `REVALIDATE_SECRET`                 | first generated secret                              |
| `IP_HASH_SALT`                      | second generated secret (mark Sensitive)            |
| `RESEND_API_KEY`                    | Resend API key (mark Sensitive)                     |
| `EMAIL_FROM`                        | e.g. `Ksheera <orders@yourdomain.in>`               |

- [ ] Add the custom domain under Settings → Domains
- [ ] Redeploy after adding variables

## 5. Content and business details

Edit in Supabase → Table Editor unless noted.

- [ ] Final brand name and logo (code: `src/content/site.ts`, `BRAND`)
- [ ] `settings` → `whatsapp_number` (digits only, e.g. `919812345678`)
- [ ] `settings` → `owner_email` (receives new-order emails)
- [ ] `settings` → `contact` (phone, email, address) and `fssai_licence`
- [ ] `settings` → `batch` (number and churned date) and `announcement`
- [ ] Products: names, descriptions, sizes, prices (in paise: ₹1,450 = `145000`), which are live
- [ ] Product photos: upload to Storage → `product-images`, then add rows to `product_images`
- [ ] `serviceable_pincodes`: replace the two sample Pune pincodes with your real delivery area
- [ ] Delivery charge rules (currently confirmed on WhatsApp; tell us if you want them shown)
- [ ] `banners`: real offers; replace `[10]%` and `[WINTER10]` or turn the banner off
- [ ] `reviews`: delete the samples; add real reviews only with the customer's permission
- [ ] Farm and founder details: `[farm name]`, `[village]`, founder quote (code: `src/content/site.ts`, `STORY`)
- [ ] Legal business name for the footer (code: `src/content/site.ts`, `BRAND.legalName`)
- [ ] Policy text: shipping, refund and cancellation, privacy, terms (or ask us to draft them)
- [ ] Farm photos for the "Our gaushala" section

## 6. Owner dashboard

- [ ] Sign in at `https://DOMAIN/admin/login` with the owner login from step 2
- [ ] Bookmark `/admin` on the owner's phone (it works as a phone layout too)
- [ ] Forgotten password: Supabase → Authentication → Users → the owner → "Send password recovery"
- [ ] Customer asks to delete their data (DPDP): tell the site team; it is removed in Supabase, not from the dashboard
- [ ] Never set `DEMO_CONTENT=true` on Vercel (it is for local development only)

## 7. Before launch

- [ ] Place a real test order on the live site and check the owner email arrives
- [ ] Check the customer receipt email (give an email address in the test order)
- [ ] Keep `/admin` open in a tab and place another test order: it should appear with a chime
- [ ] Confirm, mark paid and cancel a test order from the dashboard; export a CSV
- [ ] Open a product link on WhatsApp to check the share preview

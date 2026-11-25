-- Sample content for local development and preview deployments.
-- Prices, pincodes, settings and reviews are PLACEHOLDERS until the client
-- supplies real values (see the PRD's open questions). Reviews use the
-- literal name "[Customer name]" so no invented testimonial can pass as real.

insert into public.products (slug, name, name_hi, category, short_desc, description, highlights, details, badge, sort_order) values
('a2-gir-cow-ghee', 'A2 Gir Cow Ghee', 'गिर गाय का बिलोना घी', 'ghee',
 'Hand-churned bilona ghee from A2 Gir cow milk.',
 'Hand-churned from whole-milk curd and slow-heated over a wood fire. Grainy, golden and deeply aromatic.',
 '[{"title":"A2","body":"Gir cow milk"},{"title":"Bilona","body":"Hand-churned"},{"title":"Glass","body":"No plastic"}]',
 '[{"title":"Ingredients","body":"100% A2 Gir cow milk ghee. Nothing added."},{"title":"How it is made","body":"Whole milk is set into curd overnight, hand-churned with a wooden bilona into makhan, then slow-heated over a wood fire until golden."},{"title":"Storage","body":"Keep the lid closed, away from sunlight and moisture. Always use a clean, dry spoon. No refrigeration needed."}]',
 'Bestseller', 10),
('a2-fresh-milk', 'A2 Fresh Milk', 'ताज़ा दूध', 'milk',
 'Fresh A2 milk in a returnable glass bottle.', null, '[]', '[]', null, 20),
('malai-paneer', 'Malai Paneer', 'मलाई पनीर', 'paneer',
 'Soft paneer made fresh every day.', null, '[]', '[]', 'Made daily', 30),
('buffalo-ghee', 'Buffalo Ghee', 'भैंस का घी', 'ghee',
 'Rich, white buffalo ghee.', null, '[]', '[]', null, 40),
('matka-dahi', 'Matka Dahi', 'मटका दही', 'dahi',
 'Thick curd set in a clay pot.', null, '[]', '[]', null, 50),
('white-makhan', 'White Makhan', 'सफ़ेद मक्खन', 'makhan',
 'Fresh hand-churned white butter.', null, '[]', '[]', null, 60);

insert into public.product_variants (product_id, label, price_paise, sku, is_default, sort_order)
select p.id, v.label, v.price_paise, v.sku, v.is_default, v.sort_order
from (values
  ('a2-gir-cow-ghee', '250 ml', 78000, 'GHEE-A2-250', false, 1),
  ('a2-gir-cow-ghee', '500 ml', 145000, 'GHEE-A2-500', true, 2),
  ('a2-gir-cow-ghee', '1 L', 275000, 'GHEE-A2-1000', false, 3),
  ('a2-fresh-milk', '1 L glass', 11000, 'MILK-A2-1000', true, 1),
  ('malai-paneer', '200 g', 14000, 'PANEER-200', true, 1),
  ('buffalo-ghee', '500 ml', 85000, 'GHEE-BUF-500', true, 1),
  ('matka-dahi', '400 g', 9000, 'DAHI-400', true, 1),
  ('white-makhan', '200 g', 22000, 'MAKHAN-200', true, 1)
) as v(slug, label, price_paise, sku, is_default, sort_order)
join public.products p on p.slug = v.slug;

insert into public.banners (eyebrow, title, body, cta_label, cta_href, theme_variant, sort_order) values
('Winter ghee festival', 'Flat [10]% off every 1 L jar.',
 'The season''s first bilona batches are here. Use code [WINTER10] when you order.',
 'Shop ghee', '/products/a2-gir-cow-ghee', 'primary', 1),
('Coming soon', 'Fresh A2 milk, every morning.',
 'Daily or alternate-day subscriptions in returnable glass bottles.',
 'Join the waitlist', '/order', 'surface', 2),
('Festive gifting', 'Gift a jar of gold.',
 'Bilona ghee and white makhan in a handmade wooden box.',
 'Order a gift box', '/order', 'accent', 3);

insert into public.reviews (customer_name, city, product_id, rating, body, is_featured, published)
select '[Customer name]', r.city, p.id, 5, r.body, r.featured, true
from (values
  ('a2-gir-cow-ghee', 'Ahmedabad', true, 'Sample review. Replace with a real customer review shared with permission.'),
  ('malai-paneer', 'Pune', false, 'Sample review. Replace with a real customer review shared with permission.'),
  ('a2-fresh-milk', 'Mumbai', false, 'Sample review. Replace with a real customer review shared with permission.')
) as r(slug, city, featured, body)
join public.products p on p.slug = r.slug;

insert into public.serviceable_pincodes (pincode, area, city) values
('411001', 'Camp (sample)', 'Pune'),
('411045', 'Baner (sample)', 'Pune');

insert into public.settings (key, value, is_public) values
('palette', '"peacock-brass"', true),
('announcement', '"Now taking orders — every order is confirmed personally on WhatsApp before dispatch."', true),
('whatsapp_number', '"910000000000"', true),
('batch', '{"number": "014", "churned_on": null}', true),
('contact', '{"phone": null, "email": null, "address": null}', true),
('fssai_licence', 'null', true),
('owner_email', '"owner@example.com"', false);

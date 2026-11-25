// Real WOP photos -> public/img/<key>-<w>.{avif,webp} + src/data/images.json (sizes for width/height attrs)
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const orig = path.resolve(root, '../assets/orig');
const masters = path.resolve(root, '../masters-12k');
const dropped = fs.existsSync(path.join(masters, 'dropped.txt')) ? fs.readFileSync(path.join(masters, 'dropped.txt'), 'utf8').split(/\s+/).filter(Boolean) : [];
const out = path.join(root, 'public/img');
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(path.join(root, 'src/data'), { recursive: true });

// key -> [file, alt]  (alts describe what is visible; no invented project names)
const L = {
  hero: ['IMG_4953-scaled.jpg', 'West Ontario Paving crew laying fresh asphalt on a commercial lot'],
  speedy: ['IMG_9815.jpg', 'Freshly paved commercial parking lot'],
  house: ['IMG_9804.jpg', 'New asphalt driveway in front of a two-car garage'],
  roller: ['IMG_9724.jpg', 'Asphalt freshly paved in a commercial lot'],
  lot: ['IMG_9723.jpg', 'Finished commercial parking lot'],
  orange: ['repaving-commercial-property-with-asphalt.jpg', 'Repaving a commercial property with asphalt'],
  curve: ['asphalt-driveway-repaved-500.jpg', 'Freshly paved asphalt driveway'],
  row: ['new-asphalt-driveway-2.jpg', 'New asphalt driveway installed'],
  row2: ['new-asphalt-driveway-1.jpg', 'New asphalt driveway in front of townhomes'],
  tearup: ['tearing-up-old-walkway.jpg', 'Removing an old walkway before new work'],
  smooth: ['unnamed-12-1.jpg', 'Smoothing a driveway freshly paved with asphalt'],
  skid: ['unnamed-7-1.jpg', 'Skid steer on a residential job'],
  paver: ['unnamed-5-1.jpg', 'Asphalt paver on site'],
  edge: ['IMG_9262.jpg', 'Skid steer spreading gravel base'],
  machine: ['IMG_7191.jpg', 'Paving equipment in the yard'],
  truckcab: ['IMG_1980.jpg', 'West Ontario Paving Ltd. dump truck'],
  loader: ['IMG_1978.jpg', 'Loader filling a dump truck'],
  skid2: ['IMG_1976.jpg', 'Skid steer breaking up old concrete'],
  trucks: ['f964a98d-2567-438b-a437-7733bb9e1a6c.jpg', 'Two West Ontario Paving dump trucks on site'],
  night: ['87e70d1f-6032-4fa5-955a-64bed3f0f0e8.jpg', 'West Ontario Paving truck at dusk'],
  trucks2: ['14b408e6-626e-428f-af58-534952493fb5.jpg', 'Dump trucks at a job site'],
  truck: ['West-Ontario-Paving-truck.jpg', 'West Ontario Paving Ltd. truck'],
  drive3: ['asphalt-paved-driveway.jpg', 'Asphalt paved driveway with concrete curb'],
  townroll: ['new-asphalt-driveway.jpg', 'New asphalt driveway in front of townhomes'],
  u1: ['unnamed-1.jpg', 'Driveway being paved'],
  u0: ['unnamed.jpg', 'Paver laying asphalt'],
  walk: ['unnamed-15.jpg', 'Commercial walkway work'],
  u14: ['unnamed-14.jpg', 'Commercial frontage paving'],
  curve2: ['unnamed-13.jpg', 'Freshly paved driveway using asphalt'],
  roller2: ['unnamed-12.jpg', 'Roller compacting a new driveway'],
  base: ['unnamed-11.jpg', 'Grading the base for a new lot'],
  dump: ['unnamed-10.jpg', 'Dump truck unloading'],
  dump2: ['unnamed-9.jpg', 'Dump truck on a new lot'],
  open: ['unnamed-8.jpg', 'Long asphalt drive'],
  skid3: ['unnamed-7.jpg', 'Skid steer at work'],
  paver2: ['unnamed-5.jpg', 'Asphalt paver beside a home'],
  stairs: ['stone-walkway-stairs.jpg', 'Stone walkway steps'],
};
// v2: 12K masters (masters-12k/<key>.jpg) served up to 5120 w; AVIF <= 2000 w (encode cost), WebP all sizes
const widths = [480, 900, 1400, 2000, 2800, 3840, 5120];
// v3: not shipped (byte/near duplicates or soft upscale): u0, paver(=paver2), roller2(=smooth), row(~row2)
const skip = ['u0', 'paver', 'roller2', 'row'];
const AVIF_MAX = 2800;
const meta = {};
const jobs = [];
for (const [key, [file, alt]] of Object.entries(L)) {
  if (dropped.includes(key) || skip.includes(key)) continue; // upscale looked painted -> not shipped
  const mp = path.join(masters, `${key}.jpg`);
  const useM = fs.existsSync(mp) && !dropped.includes(key);
  const src = useM ? mp : path.join(orig, file);
  const m = await sharp(src, { limitInputPixels: false }).rotate().metadata();
  const W = m.width, H = m.height;
  const ws = useM ? widths : [...new Set(widths.filter((w) => w < W).concat([W]))].sort((a, b) => a - b);
  for (const w of ws) jobs.push([src, key, w]);
  meta[key] = { w: W, h: H, alt, ws, file, master: useM };
}
// v3 grade: ONE subtle, natural treatment for every served photo. Partial grey-world white balance (40%),
// a touch of warmth, slight contrast, saturation -8%. No stylised filters, nothing replaced.
const grade = async (src) => {
  const st = await sharp(src, { limitInputPixels: false }).rotate().resize(256).stats();
  const m = st.channels.slice(0, 3).map((c) => c.mean); const avg = (m[0] + m[1] + m[2]) / 3;
  const g = m.map((v) => Math.min(1.08, Math.max(0.92, 1 + 0.4 * (avg / v - 1))));
  g[0] *= 1.015; g[2] *= 0.985;
  return { g, m };
};
const byKey = {};
for (const [, key] of jobs) byKey[key] = byKey[key] || jobs.filter((j) => j[1] === key);
const runKey = async (key) => {
  const list = byKey[key]; const src = list[0][0];
  const todo = list.filter(([, , w]) => !fs.existsSync(path.join(out, `${key}-${w}.webp`)) || (w <= AVIF_MAX && !fs.existsSync(path.join(out, `${key}-${w}.avif`))));
  const { g } = await grade(src);
  meta[key].grade = g.map((v) => +v.toFixed(3));
  if (!todo.length) return;
  const top = Math.max(...list.map((j) => j[2]));
  const base = await sharp(src, { limitInputPixels: false }).rotate().resize({ width: top, kernel: 'lanczos3' })
    .recomb([[g[0], 0, 0], [0, g[1], 0], [0, 0, g[2]]]).linear(1.05, -5).modulate({ saturation: 0.92 })
    .toColourspace('srgb').png({ compressionLevel: 0 }).toBuffer();
  for (const [, , w] of todo) {
    const buf = w === top ? base : await sharp(base).resize({ width: w, kernel: 'lanczos3' }).sharpen({ sigma: 0.4 }).toBuffer();
    const fw = path.join(out, `${key}-${w}.webp`), fa = path.join(out, `${key}-${w}.avif`);
    if (!fs.existsSync(fw)) await sharp(buf).webp({ quality: w > 2000 ? 74 : 78, effort: 4 }).toFile(fw);
    if (w <= AVIF_MAX && !fs.existsSync(fa)) await sharp(buf).avif({ quality: 52, effort: 4 }).toFile(fa);
  }
  console.log('done', key, new Date().toISOString());
};
const keys = Object.keys(byKey);
let i = 0;
await Promise.all(Array.from({ length: 5 }, async () => { while (i < keys.length) await runKey(keys[i++]); }));
const ogSrc = fs.existsSync(path.join(masters, 'hero.jpg')) ? path.join(masters, 'hero.jpg') : path.join(orig, L.hero[0]);
// tiny blurred placeholder for hero + a jpg OG image
if (!fs.existsSync(path.join(root, 'public/og.jpg'))) await sharp(ogSrc, { limitInputPixels: false }).rotate().resize(1200, 630, { fit: 'cover', position: 'centre' }).jpeg({ quality: 82 }).toFile(path.join(root, 'public/og.jpg'));
fs.writeFileSync(path.join(root, 'src/data/images.json'), JSON.stringify(meta, null, 1));
console.log(Object.keys(meta).length, 'images');

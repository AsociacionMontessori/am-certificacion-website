// Stage only the Sandbox document and its Gatsby assets, never commercial pages.
const fs = require('node:fs');
const path = require('node:path');
const source = path.resolve(__dirname, '../../public');
const target = path.resolve(__dirname, '../hosting-paypal-sandbox');
const page = 'checkout/paypal-sandbox/index.html';
if (!fs.existsSync(path.join(source, page))) throw new Error('Build Sandbox first');
if (fs.existsSync(target)) throw new Error('Preserve/rename previous staging before regeneration');
fs.cpSync(source, target, {recursive: true, filter(file) {
  const relative = path.relative(source, file).split(path.sep).join('/');
  if (!relative) return true;
  if (relative.endsWith('.html')) return relative === page;
  if (relative.startsWith('page-data/')) {
    return ['page-data/app-data.json', 'page-data/checkout', 'page-data/checkout/paypal-sandbox',
      'page-data/checkout/paypal-sandbox/page-data.json', 'page-data/sq'].includes(relative) || relative.startsWith('page-data/sq/');
  }
  if (/sitemap|robots\.txt|\.map$/.test(relative)) return false;
  return true;
}});
fs.writeFileSync(path.join(target, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
console.log('Prepared Sandbox-only Hosting document and assets.');

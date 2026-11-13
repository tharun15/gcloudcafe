import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Language Configuration & Single-Language Canonical Integrity Suite', () => {
  const rootDir = path.resolve(__dirname, '..');
  const publicDir = path.join(rootDir, 'public');

  it('verifies config/_default/languages.toml defines English as sole active language (Italian removed)', () => {
    const langToml = fs.readFileSync(path.join(rootDir, 'config/_default/languages.toml'), 'utf-8');
    expect(langToml).toContain('[en]');
    expect(langToml).toContain('content/english');
    expect(langToml).not.toContain('[it]');
    expect(langToml).not.toContain('content/italian');
  });

  it('verifies Italian content directory and config files are completely removed', () => {
    expect(fs.existsSync(path.join(rootDir, 'content/italian'))).toBe(false);
    expect(fs.existsSync(path.join(rootDir, 'config/_default/menus.it.toml'))).toBe(false);
    expect(fs.existsSync(path.join(rootDir, 'i18n/it.yaml'))).toBe(false);
    expect(fs.existsSync(path.join(rootDir, 'static/images/og/it'))).toBe(false);
    expect(fs.existsSync(path.join(publicDir, 'it'))).toBe(false);
  });

  it('verifies English navigation menus and i18n translation files exist', () => {
    const menusEnPath = path.join(rootDir, 'config/_default/menus.en.toml');
    expect(fs.existsSync(menusEnPath)).toBe(true);

    const i18nEnPath = path.join(rootDir, 'i18n/en.yaml');
    expect(fs.existsSync(i18nEnPath)).toBe(true);
  });

  it('verifies language switcher component is preserved in header', () => {
    const headerPath = path.join(rootDir, 'layouts/partials/essentials/header.html');
    const headerHtml = fs.readFileSync(headerPath, 'utf-8');

    expect(headerHtml).toContain('components/language-switcher');

    const switcherPath = path.join(rootDir, 'layouts/partials/components/language-switcher.html');
    expect(fs.existsSync(switcherPath)).toBe(true);

    const switcherHtml = fs.readFileSync(switcherPath, 'utf-8');
    expect(switcherHtml).toContain('data-lang-switcher');
    expect(switcherHtml).toContain('fa-globe');
  });
});


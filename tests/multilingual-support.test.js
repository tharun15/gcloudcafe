import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Multilingual Capabilities & Italian Language Support Suite', () => {
  const rootDir = path.resolve(__dirname, '..');
  const publicDir = path.join(rootDir, 'public');

  it('verifies config/_default/languages.toml defines both English and Italian languages', () => {
    const langToml = fs.readFileSync(path.join(rootDir, 'config/_default/languages.toml'), 'utf-8');
    expect(langToml).toContain('[en]');
    expect(langToml).toContain('[it]');
    expect(langToml).toContain('content/italian');
    expect(langToml).toContain('Italiano');
  });

  it('verifies Italian navigation menus and i18n translation files exist', () => {
    const menusItPath = path.join(rootDir, 'config/_default/menus.it.toml');
    expect(fs.existsSync(menusItPath)).toBe(true);

    const menusIt = fs.readFileSync(menusItPath, 'utf-8');
    expect(menusIt).toContain('Chi Siamo');
    expect(menusIt).toContain('Contatti');
    expect(menusIt).toContain('Serie');

    const i18nItPath = path.join(rootDir, 'i18n/it.yaml');
    expect(fs.existsSync(i18nItPath)).toBe(true);

    const i18nIt = fs.readFileSync(i18nItPath, 'utf-8');
    expect(i18nIt).toContain('Leggi di più');
    expect(i18nIt).toContain('Categorie');
  });

  it('verifies public/it/ builds with Italian homepage and translated navigation', () => {
    const itIndexPath = path.join(publicDir, 'it/index.html');
    expect(fs.existsSync(itIndexPath)).toBe(true);

    const itHtml = fs.readFileSync(itIndexPath, 'utf-8');
    expect(itHtml).toContain('Chi Siamo');
    expect(itHtml).toContain('Contatti');
    expect(itHtml).toContain('Serie');
  });

  it('verifies language switcher component is integrated in header for desktop and mobile', () => {
    const headerPath = path.join(rootDir, 'layouts/partials/essentials/header.html');
    const headerHtml = fs.readFileSync(headerPath, 'utf-8');

    expect(headerHtml).toContain('components/language-switcher');
    expect(headerHtml).toContain('Mobile Language Switcher');
    expect(headerHtml).toContain('Language / Lingua');

    const switcherPath = path.join(rootDir, 'layouts/partials/components/language-switcher.html');
    expect(fs.existsSync(switcherPath)).toBe(true);

    const switcherHtml = fs.readFileSync(switcherPath, 'utf-8');
    expect(switcherHtml).toContain('data-lang-switcher');
    expect(switcherHtml).toContain('fa-globe');
  });

  it('verifies translated Italian edition of flagship blog post builds in public/it/blog/', () => {
    const itPostPath = path.join(publicDir, 'it/blog/gemini-agent-platform-express-mode-bootstrapping-offvia/index.html');
    expect(fs.existsSync(itPostPath)).toBe(true);

    const itPostHtml = fs.readFileSync(itPostPath, 'utf-8');
    expect(itPostHtml).toContain('Da Vertex AI a Gemini Enterprise Agent Platform');
  });
});

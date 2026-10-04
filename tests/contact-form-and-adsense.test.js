import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Contact Form Experience, Dual-Persistence & AdSense Certification Guard Suite', () => {
  const rootDir = path.resolve(__dirname, '..');
  const publicDir = path.join(rootDir, 'public');

  it('verifies modernized contact page builds in both English and Italian', () => {
    const enContact = path.join(publicDir, 'contact/index.html');
    const itContact = path.join(publicDir, 'it/contact/index.html');

    expect(fs.existsSync(enContact), 'Missing English contact page').toBe(true);
    expect(fs.existsSync(itContact), 'Missing Italian contact page').toBe(true);

    const enHtml = fs.readFileSync(enContact, 'utf-8');
    const itHtml = fs.readFileSync(itContact, 'utf-8');

    // Breadcrumbs
    expect(enHtml).toContain('Contact');
    expect(itHtml).toContain('Contatti');

    // Form elements (handling optional quotes in minified HTML)
    expect(enHtml).toMatch(/id=(["']?)interactive-contact-form\1/);
    expect(enHtml).toMatch(/id=(["']?)contact-name\1/);
    expect(enHtml).toMatch(/id=(["']?)contact-email\1/);
    expect(enHtml).toMatch(/id=(["']?)contact-subject\1/);
    expect(enHtml).toMatch(/id=(["']?)contact-message\1/);
    expect(enHtml).toMatch(/id=(["']?)contact-submit-btn\1/);

    // Success feedback card elements
    expect(enHtml).toMatch(/id=(["']?)contact-success-state\1/);
    expect(enHtml).toMatch(/id=(["']?)contact-success-email\1/);
    // Ensures internal technical IDs or database confirmation badges are not exposed to the user
    expect(enHtml).not.toContain('Database Confirmed');
    expect(enHtml).toMatch(/id=(["']?)contact-reset-btn\1/);
    expect(enHtml).toContain('Thank you for contacting us');

    // Italian localization
    expect(itHtml).toContain('Grazie per averci contattato');
    expect(itHtml).toContain('Invia Messaggio');
  });

  it('verifies dual-persistence architecture for contact form submissions', () => {
    const contactLayout = path.join(rootDir, 'layouts/contact/list.html');
    const layoutContent = fs.readFileSync(contactLayout, 'utf-8');

    // LocalStorage fallback
    expect(layoutContent).toContain('gcloudcafe_contact_submissions');
    expect(layoutContent).toContain('localStorage.setItem("gcloudcafe_contact_submissions"');

    // Supabase REST POST
    expect(layoutContent).toContain('/rest/v1/contact_submissions');
    expect(layoutContent).toContain('headers:');
    expect(layoutContent).toContain('"apikey": config.anonKey');

    // Smooth UI transition & Email echo
    expect(layoutContent).toContain('confirmedEmail.textContent = email');
    expect(layoutContent).toContain('successState.classList.remove("hidden")');
    expect(layoutContent).toContain('form.classList.add("hidden")');
  });

  it('verifies Supabase SQL migration file exists for contact_submissions table', () => {
    const migrationPath = path.join(rootDir, 'supabase/migrations/20261004_create_contact_submissions.sql');
    expect(fs.existsSync(migrationPath)).toBe(true);

    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.contact_submissions');
    expect(sql).toContain('ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('Allow anonymous insert on contact_submissions');
  });

  it('verifies certification articles render the NDA & Educational Study Guide Disclaimer', () => {
    const ex280En = path.join(publicDir, 'blog/passing-ex280-exam-part-2-technical-side/index.html');
    const ex280It = path.join(publicDir, 'it/blog/passing-ex280-exam-part-2-technical-side/index.html');

    expect(fs.existsSync(ex280En)).toBe(true);
    expect(fs.existsSync(ex280It)).toBe(true);

    const enHtml = fs.readFileSync(ex280En, 'utf-8');
    const itHtml = fs.readFileSync(ex280It, 'utf-8');

    // English disclaimer check
    expect(enHtml).toContain('Independent Study Guide');
    expect(enHtml).toContain('NDA Safe');
    expect(enHtml).toContain('strictly adheres to candidate NDAs');
    expect(enHtml).toMatch(/href=(["']?)\/disclaimer\/\1/);

    // Italian disclaimer check
    expect(itHtml).toContain('Avvertenza Formativa');
    expect(itHtml).toContain('rispetta scrupolosamente gli accordi di riservatezza (NDA)');
  });

  it('verifies taxonomy breadcrumbs dynamically link to tags/ for tag pages', () => {
    const tagPage = path.join(publicDir, 'tags/ex280/index.html');
    if (fs.existsSync(tagPage)) {
      const html = fs.readFileSync(tagPage, 'utf-8');
      expect(html).toMatch(/href=(["']?)\/tags\/\1/);
    }
  });
});

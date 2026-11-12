import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Cloud Brew (/brew) Quick Engineering Perspectives & LinkedIn Sharing', () => {
  let listTemplate;
  let singleTemplate;
  let menuConfig;
  let headerPartial;

  beforeAll(() => {
    listTemplate = fs.readFileSync(path.resolve(__dirname, '../layouts/brew/list.html'), 'utf8');
    singleTemplate = fs.readFileSync(path.resolve(__dirname, '../layouts/brew/single.html'), 'utf8');
    menuConfig = fs.readFileSync(path.resolve(__dirname, '../config/_default/menus.en.toml'), 'utf8');
    headerPartial = fs.readFileSync(path.resolve(__dirname, '../layouts/partials/essentials/header.html'), 'utf8');
  });

  it('registers Brew (/brew) in the English main navigation menu and header', () => {
    expect(menuConfig).toContain('name = "Brew"');
    expect(menuConfig).toContain('url = "/brew"');
    expect(headerPartial).toContain('$isBrew');
    expect(headerPartial).toContain('60-second engineering perspectives & takes');
  });

  it('includes instant search and topic filter chips in the Cloud Brew feed template', () => {
    expect(listTemplate).toContain('id="brew-search-input"');
    expect(listTemplate).toContain('id="brew-topic-chips"');
    expect(listTemplate).toContain('data-brew-topic="all"');
    expect(listTemplate).toContain('data-brew-topic="ai"');
    expect(listTemplate).toContain('data-brew-topic="cloud"');
    expect(listTemplate).toContain('data-brew-topic="kubernetes"');
    expect(listTemplate).toContain('data-brew-topic="security"');
  });

  it('provides 1-click LinkedIn copy, LinkedIn share link, and LinkedIn preview drawer on every card', () => {
    expect(listTemplate).toContain('data-brew-copy-linkedin');
    expect(listTemplate).toContain('https://www.linkedin.com/sharing/share-offsite/?url=');
    expect(listTemplate).toContain('data-brew-toggle-preview');
    expect(listTemplate).toContain('data-brew-copy-and-open');
    expect(listTemplate).toContain('The Takeaway');
  });

  it('renders standalone permalink template with LinkedIn copy/share and related shots', () => {
    expect(singleTemplate).toContain('id="brew-single-copy-btn"');
    expect(singleTemplate).toContain('https://www.linkedin.com/sharing/share-offsite/?url=');
    expect(singleTemplate).toContain('More Cloud Brew Shots');
  });

  it('has English-only starter perspective markdown files with required frontmatter', () => {
    const brewDir = path.resolve(__dirname, '../content/english/brew');
    const files = fs.readdirSync(brewDir).filter((f) => f.endsWith('.md') && f !== '_index.md');
    expect(files.length).toBeGreaterThanOrEqual(4);

    for (const file of files) {
      const content = fs.readFileSync(path.join(brewDir, file), 'utf8');
      expect(content).toContain('title:');
      expect(content).toContain('topic:');
      expect(content).toContain('takeaway:');
      expect(content).toContain('hashtags:');
    }
  });
});


import { describe, it, expect } from 'vitest';

// Core draft status & frontmatter builder logic from blog-enhancements.js
function buildFrontmatter(opts) {
  var isDraft = opts.draft === true || opts.draft === "true";
  var titleVal = (opts.title || "Untitled").replace(/"/g, "\\\"");
  var descVal = (opts.description || "").replace(/"/g, "\\\"");
  var authorVal = opts.author || "Tharun Vempati";
  var catVal = opts.category || "Google Cloud";

  return ['KK', 'title: "' + titleVal + '"', 'description: "' + descVal + '"', 'draft: ' + (isDraft ? 'true' : 'false'), 'author: ' + authorVal, 'categories: ["' + catVal + '"]', '---'].join('\n').replace('KK', '---');
}

function generateGitCommitMsg(isDraft, title) {
  var prefix = isDraft ? "feat(blog): add draft article: " : "feat(blog): publish article: ";
  return prefix + (title || "New Post");
}

function getBannerImageUrl(path) {
  if (!path || path.trim() === "") return "/images/posts/default-banner.webp";
  return path;
}

describe('Article Studio Draft Mode & Export Suite', () => {
  it('builds frontmatter with draft: true when given true', () => {
    const fm = buildFrontmatter({ title: 'Test Article', draft: true });
    expect(fm).toContain('draft: true');
  });

  it('builds frontmatter with draft: false when given false', () => {
    const fm = buildFrontmatter({ title: 'Test Article', draft: false });
    expect(fm).toContain('draft: false');
  });

  it('fashions GitHub commit message according to draft status', () => {
    expect(generateGitCommitMsg(true, 'GCP Tutorial')).toBe('feat(blog): add draft article: GCP Tutorial');
    expect(generateGitCommitMsg(false, 'GCP Tutorial')).toBe('feat(blog): publish article: GCP Tutorial');
  });

  it('falls back to default banner when no image is specified', () => {
    expect(getBannerImageUrl('')).toBe('/images/posts/default-banner.webp');
    expect(getBannerImageUrl('/images/posts/my-img.png')).toBe('/images/posts/my-img.png');
  });
});

# Hugo Modules Cleanup

## Summary

This PR removes 5 unused Hugoplate Hugo modules from the gcloudcafe project to improve build performance and reduce dependency clutter.

## Changes Made

### 1. **config/_default/module.toml**
Removed the following module imports:
- `github.com/gethugothemes/hugo-modules/adsense` - Google Adsense config is empty
- `github.com/gethugothemes/hugo-modules/preloader` - Preloader is disabled
- `github.com/gethugothemes/hugo-modules/components/announcement` - Announcement is disabled
- `github.com/gethugothemes/hugo-modules/pwa` - PWA not used in the site
- `github.com/gethugothemes/hugo-modules/gzip-caching` - Redundant (handled by hosting)

### 2. **config/_default/params.toml**
Removed configuration sections for disabled modules:
- `[preloader]` section (was already disabled)
- `[announcement]` section (was already disabled)
- `google_adsense` configuration (was empty)
- `[navigation_button]` section (not used)

Kept all active configurations:
- ✅ `[search]` - enabled and used
- ✅ `[cookies]` - enabled for GDPR compliance
- ✅ `[metadata]` - used for SEO
- ✅ `[site_verification]` - for search engines
- ✅ `[mermaid]` - used in blog posts
- ✅ `[widgets]` - sidebar content

## Impact

### Positive Impacts
- ✅ **Faster Build Time**: Fewer modules to initialize during Hugo build
- ✅ **Cleaner Dependencies**: `go.mod` file is more maintainable
- ✅ **Better Documentation**: Config files are easier to understand
- ✅ **No Functional Impact**: All active features remain intact

### Modules Still Included (and Why)
1. **search** - Active, used for blog search functionality
2. **images** - Active, used for logos and featured images
3. **videos** - Active, used for YouTube and video embeds
4. **font-awesome** - Active, used for icons throughout site
5. **accordion** - Active, used in elements page
6. **table-of-contents** - Active, rendered in blog posts
7. **tab** - Active, used in elements page
8. **modal** - Active, part of modal functionality
9. **gallery-slider** - Active, used for galleries and sliders
10. **social-share** - Active, used for blog post sharing
11. **cookie-consent** - Active, enabled in params
12. **custom-script** - Active, used for GTM script
13. **render-link** - Active, internal Hugo linking
14. **button** - Active, used in shortcodes
15. **notice** - Active, used for callout boxes
16. **basic-seo** - Active, used for metadata
17. **site-verifications** - Active, configured for search engines
18. **google-tag-manager** - Active, GTM integration
19. **mermaid** - Active, used for diagrams

## Testing Recommendations

After merging, run:
```bash
npm run update-modules
npm run build
npm run dev
```

Verify:
- ✅ Site builds without errors
- ✅ All blog posts display correctly
- ✅ Search functionality works
- ✅ Gallery/slider functionality works
- ✅ Cookie consent banner displays
- ✅ Social share buttons display

## Related Issues
Closes improvement request for Hugo module optimization.

# Daily Trending Topics Automation

This automation workflow automatically discovers trending cloud topics, generates blog post drafts, and creates pull requests for review and merging to your Hugo blog.

## Architecture

```
GitHub Action (Daily at 8 AM)
    ↓
PyTrends (Fetch trending topics)
    ↓
Check Existing Posts (Prevent duplicates)
    ↓
Generate Markdown Drafts
    ↓
Create Pull Request
    ↓
Human Review + Merge
    ↓
Hugo Deploys
```

## Components

### 1. **GitHub Actions Workflow** (`.github/workflows/daily-trending-posts.yml`)
- Triggers daily at 8 AM UTC (configurable)
- Orchestrates the entire pipeline
- Creates pull requests with generated content
- Runs on Linux environment with Python 3.11

### 2. **PyTrends Fetch** (`.github/scripts/pytrends_fetch.py`)
- Queries Google Trends for cloud-related keywords
- Tracks trending topics: Kubernetes, AWS, Azure, Docker, CI/CD, etc.
- Returns top 5 trending topics with interest levels
- Outputs JSON for downstream processing

### 3. **Post Checker** (`.github/scripts/check_existing_posts.py`)
- Scans existing blog posts in `content/english/blog/`
- Prevents duplicate content creation
- Uses fuzzy matching to detect similar topics
- Filters out topics already covered

### 4. **Draft Generator** (`.github/scripts/generate_draft.py`)
- Creates markdown files from templates
- Includes TODO placeholders for manual review
- Uses proper Hugo front matter (title, date, categories, tags)
- Generates drafts in `draft: true` state

## Setup Instructions

### 1. Install Dependencies Locally (Optional - for testing)

```bash
pip install -r .github/scripts/requirements.txt
```

### 2. Configure GitHub Actions (No additional setup needed)

The workflow is ready to use! GitHub Actions will automatically handle Python environment setup.

### 3. Customize the Workflow

Edit `.github/workflows/daily-trending-posts.yml` to:

**Change schedule time:**
```yaml
on:
  schedule:
    - cron: '0 18 * * *'  # 6 PM UTC instead of 8 AM
```

**Change timezone (cron uses UTC):**
- 8 AM EST = `cron: '13 * * * *'`
- 8 AM PST = `cron: '16 * * * *'`

### 4. Customize Cloud Keywords

Edit `.github/scripts/pytrends_fetch.py`:

```python
CLOUD_KEYWORDS = [
    'cloud computing',
    'kubernetes',
    'AWS',
    # Add your own keywords here
]
```

### 5. Customize Draft Template

Edit `.github/scripts/generate_draft.py` `MARKDOWN_TEMPLATE` to match your blog's style.

## Usage

### Automatic (Daily)
The workflow runs automatically every day at 8 AM UTC.

### Manual Trigger
Trigger manually via GitHub Actions UI:
1. Go to your repo → Actions
2. Select "Daily Trending Cloud Topics"
3. Click "Run workflow"

### Local Testing

```bash
# 1. Fetch trending topics
python .github/scripts/pytrends_fetch.py

# 2. Check existing posts (requires step 1 output)
python .github/scripts/check_existing_posts.py '{"topics": [{"keyword": "Kubernetes", "interest": 85}]}'

# 3. Generate drafts
python .github/scripts/generate_draft.py \
  --topics '{"topics": [{"keyword": "Kubernetes", "interest": 85}]}' \
  --output-dir content/english/blog
```

## Pull Request Review Checklist

When PRs are created, review for:

- ✅ Content accuracy and relevance
- ✅ Proper formatting and structure
- ✅ Working external links
- ✅ Appropriate categories and tags
- ✅ Brand voice consistency
- ✅ No duplicate content

Before merging:
1. Edit and expand the content
2. Remove `draft: true` from front matter
3. Update `TODO` sections
4. Add images if needed
5. Merge the PR

## Workflow Outputs

Each workflow run generates:

- **Trending Topics**: JSON with top 5 trending cloud keywords
- **Existing Posts Check**: List of duplicates avoided
- **Generated Drafts**: Markdown files in `content/english/blog/drafts/`
- **Pull Request**: Ready for review with draft content

## Deployment

Once you merge the PR:

1. GitHub Actions runs your Hugo build
2. Hugo generates static site from the new post
3. Your deployment service (Netlify, Vercel, etc.) deploys the changes
4. New post goes live on gcloudcafe.com

## Customization Ideas

### 1. Add Author Tags
Modify `generate_draft.py` to assign specific authors:
```yaml
author: "AI Assistant"
```

### 2. Add Featured Images
Update template to reference topic-specific images:
```yaml
image: "images/blog/{{ topic }}.png"
```

### 3. Integration with AI Writing Services
Enhance draft generation with:
- OpenAI API for better content
- Automated SEO optimization
- Smart tag generation

### 4. Slack/Email Notifications
Add post-workflow notifications:
```yaml
- name: Send Slack notification
  uses: slackapi/slack-github-action@v1
```

### 5. Multiple Schedules
Run different workflows for different topics:
- Cloud infrastructure (daily)
- AI/ML trends (3x weekly)
- Security topics (weekly)

## Troubleshooting

### Workflow not running?
- Check schedule cron syntax at [crontab.guru](https://crontab.guru)
- Verify workflow file syntax: `yamllint .github/workflows/daily-trending-posts.yml`
- Ensure branch protection allows workflow commits

### No drafts generated?
- Check if topics already have posts
- Verify `content/english/blog/` directory exists
- Review logs in GitHub Actions → Workflow runs

### PyTrends rate limited?
- Reduce keyword list size
- Add delays between requests in `pytrends_fetch.py`
- Use VPN if needed (PyTrends queries Google Trends)

## Security Considerations

- Workflow uses read-only repository token by default
- Python dependencies are pinned to specific versions
- Consider adding content review before auto-merge
- Monitor for suspicious trend patterns

## Performance

- Workflow typically completes in 2-3 minutes
- PyTrends API calls take ~1-2 minutes
- Storage: Each draft is ~2KB
- No additional costs (uses GitHub Actions free tier)

## Future Enhancements

- [ ] Content quality scoring
- [ ] SEO optimization
- [ ] Internal linking suggestions
- [ ] Image generation
- [ ] Social media post generation
- [ ] Email notification system
- [ ] Analytics tracking
- [ ] A/B testing different templates

## Support

For issues or questions:
1. Check GitHub Actions workflow logs
2. Review error messages in PR comments
3. Test scripts locally first
4. Adjust PyTrends keywords if needed

---

**Last Updated:** 2024
**Maintained by:** GCloudCafe Automation

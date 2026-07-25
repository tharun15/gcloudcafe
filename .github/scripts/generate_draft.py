#!/usr/bin/env python3
"""
Generate markdown drafts for trending topics.
Uses a template structure and AI-friendly placeholders.
"""

import json
import sys
import os
from datetime import datetime, timedelta
from pathlib import Path
import logging
import argparse

# Handle import of slugify with fallback
try:
    from slugify import slugify
except ImportError:
    logging.warning("python-slugify not found, using simple slug generator")
    def slugify(text):
        return text.lower().replace(' ', '-').replace('/', '-').replace('.', '')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BLOG_CONTENT_DIR = 'content/english/blog'

MARKDOWN_TEMPLATE = """---
title: "{title}"
meta_title: "{title}"
description: "{description}"
date: {date}
image: "images/blog/cloud-trending.png"
categories: ["Cloud", "Technology", "Trending"]
author: "GCloudCafe"
tags: ["{tag1}", "{tag2}", "trending"]
draft: true
---

## Overview

This is an auto-generated draft about **{title}**. Please review and expand this content with your expertise.

## Key Points

- **What it is**: {title} is a trending topic in cloud computing and technology infrastructure.
- **Relevance**: Understanding {title_lower} is important for modern cloud practitioners.
- **Current Trend**: Based on recent search trends, this topic is gaining significant interest.

## Why This Matters

[TODO: Add context about why this trend is important]

## Getting Started

[TODO: Add beginner-friendly introduction]

## Best Practices

1. [TODO: Add best practice]
2. [TODO: Add best practice]
3. [TODO: Add best practice]

## Tools and Resources

- [TODO: Add resource]
- [TODO: Add resource]
- [TODO: Add resource]

## Challenges and Considerations

[TODO: Add challenges]

## Conclusion

[TODO: Add conclusion]

## Further Reading

- [TODO: Add links to external resources]

---

**Note:** This is an auto-generated draft. Please review, verify all claims, add proper references, and expand with your expertise before publishing.
"""

def generate_draft(topic, output_dir):
    """Generate a markdown draft for a single topic."""
    try:
        # Create output directory if it doesn't exist
        Path(output_dir).mkdir(parents=True, exist_ok=True)

        title = topic['keyword']
        filename = f"{slugify(title)}.md"
        filepath = Path(output_dir) / filename

        # Skip if file already exists
        if filepath.exists():
            logger.warning(f"Draft already exists: {filename}")
            return None

        # Prepare template variables
        tag1 = topic['keyword'].split()[0].lower()
        tag2 = 'cloud' if 'cloud' not in topic['keyword'].lower() else 'technology'
        date = datetime.now().isoformat()

        # Generate content
        content = MARKDOWN_TEMPLATE.format(
            title=title,
            description=f"An exploration of {title} and its role in modern cloud computing.",
            date=date,
            tag1=tag1,
            tag2=tag2,
            title_lower=title.lower()
        )

        # Write file
        with open(filepath, 'w') as f:
            f.write(content)

        logger.info(f"Created draft: {filename}")
        return {
            'filename': filename,
            'title': title,
            'path': str(filepath)
        }

    except Exception as e:
        logger.error(f"Error generating draft for {topic}: {str(e)}")
        return None

def generate_drafts(topics_json, output_dir):
    """Generate markdown drafts for all topics."""
    try:
        # Handle case where topics_json might be None or empty
        if not topics_json or topics_json.strip() == '':
            logger.warning("No topics provided for draft generation")
            result = {'draft_created': 'false', 'count': 0}
            print(json.dumps(result))
            return result
            
        topics_data = json.loads(topics_json)
        topics = topics_data.get('topics', [])

        if not topics:
            logger.warning("No topics in JSON data")
            result = {'draft_created': 'false', 'count': 0}
            print(json.dumps(result))
            return result

        created_drafts = []
        for topic in topics:
            draft = generate_draft(topic, output_dir)
            if draft:
                created_drafts.append(draft)

        result = {
            'draft_created': 'true' if created_drafts else 'false',
            'count': len(created_drafts),
            'drafts': created_drafts,
            'topic_title': created_drafts[0]['title'] if created_drafts else 'Trending Topics',
            'topics_added': ', '.join([d['title'] for d in created_drafts]) if created_drafts else 'None',
            'draft_list': '\n'.join([f"- {d['title']} (`{d['filename']}`)" for d in created_drafts]) if created_drafts else 'No drafts created'
        }

        print(json.dumps(result))

        # Set GitHub output
        if os.getenv('GITHUB_OUTPUT'):
            with open(os.getenv('GITHUB_OUTPUT'), 'a') as f:
                f.write(f"draft_created={'true' if created_drafts else 'false'}\n")
                f.write(f"topic_title={result['topic_title']}\n")
                f.write(f"topics_added={result['topics_added']}\n")
                f.write(f"draft_list={result['draft_list']}\n")

        return result

    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON input: {str(e)}")
        result = {'draft_created': 'false', 'count': 0, 'error': str(e)}
        print(json.dumps(result))
        return result
    except Exception as e:
        logger.error(f"Unexpected error generating drafts: {str(e)}")
        result = {'draft_created': 'false', 'count': 0, 'error': str(e)}
        print(json.dumps(result))
        return result

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generate markdown drafts for trending topics')
    parser.add_argument('--topics', required=True, help='JSON string with topics')
    parser.add_argument('--output-dir', default=BLOG_CONTENT_DIR, help='Output directory for drafts')

    args = parser.parse_args()
    generate_drafts(args.topics, args.output_dir)

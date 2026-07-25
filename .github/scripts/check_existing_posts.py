#!/usr/bin/env python3
"""
Check if blog posts already exist for the trending topics.
Prevents duplicate content creation.
"""

import json
import sys
import os
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BLOG_CONTENT_DIR = 'content/english/blog'

def normalize_topic(topic):
    """Normalize topic name for filename matching."""
    return topic.lower().replace(' ', '-').replace('/', '-')

def get_existing_posts():
    """Get list of existing blog post titles and slugs."""
    existing = {}
    
    blog_path = Path(BLOG_CONTENT_DIR)
    if not blog_path.exists():
        logger.warning(f"Blog directory not found: {BLOG_CONTENT_DIR}")
        return existing

    for md_file in blog_path.glob('*.md'):
        if md_file.name == '_index.md':
            continue
            
        # Extract slug from filename
        slug = md_file.stem
        existing[slug] = md_file
        logger.info(f"Found existing post: {slug}")

    return existing

def check_existing_posts(topics_json):
    """Check which topics already have blog posts."""
    try:
        topics_data = json.loads(topics_json)
        existing_posts = get_existing_posts()
        
        new_topics = []
        duplicate_topics = []

        for topic in topics_data.get('topics', []):
            topic_slug = normalize_topic(topic['keyword'])
            
            # Check for exact match
            if topic_slug in existing_posts:
                duplicate_topics.append(topic['keyword'])
                logger.info(f"Post already exists for: {topic['keyword']}")
                continue
            
            # Check for partial matches (avoid similar topics)
            found_similar = False
            for existing_slug in existing_posts.keys():
                if topic_slug in existing_slug or existing_slug in topic_slug:
                    duplicate_topics.append(topic['keyword'])
                    logger.info(f"Similar post found for: {topic['keyword']}")
                    found_similar = True
                    break
            
            if not found_similar:
                new_topics.append(topic)

        result = {
            'new_topics': new_topics,
            'duplicate_topics': duplicate_topics,
            'new_count': len(new_topics),
            'duplicate_count': len(duplicate_topics)
        }

        print(json.dumps(result))
        
        # Set GitHub output for workflow
        if os.getenv('GITHUB_OUTPUT'):
            with open(os.getenv('GITHUB_OUTPUT'), 'a') as f:
                f.write(f"new_topics={json.dumps(new_topics)}\n")
                f.write(f"duplicate_count={len(duplicate_topics)}\n")

        return result

    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON input: {str(e)}")
        result = {'new_topics': [], 'duplicate_topics': [], 'error': str(e)}
        print(json.dumps(result))
        return result

if __name__ == '__main__':
    if len(sys.argv) > 1:
        topics_json = sys.argv[1]
    else:
        # Read from stdin if no argument provided
        topics_json = sys.stdin.read()
    
    check_existing_posts(topics_json)

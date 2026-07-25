#!/usr/bin/env python3
"""
Fetch trending cloud-related topics using PyTrends.
Outputs JSON with trending topics and search volumes.
"""

import json
from datetime import datetime
import logging
from pytrends.request import TrendReq

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Keywords to search for trending cloud topics
CLOUD_KEYWORDS = [
    'cloud computing',
    'kubernetes',
    'AWS',
    'Google Cloud',
    'Azure',
    'serverless',
    'containers',
    'microservices',
    'DevOps',
    'infrastructure as code',
    'terraform',
    'OpenShift',
    'Docker',
    'CI/CD',
]

def get_trending_topics():
    """Fetch trending topics related to cloud technologies."""
    try:
        pytrends = TrendReq(hl='en-US', tz=360)
        trending_topics = []

        for keyword in CLOUD_KEYWORDS:
            try:
                # Get interest over time for the keyword
                pytrends.build_payload([keyword], timeframe='today 1-m', geo='US')
                interest_data = pytrends.interest_over_time()

                if not interest_data.empty:
                    current_interest = interest_data[keyword].iloc[-1]
                    
                    trending_topics.append({
                        'keyword': keyword,
                        'interest': int(current_interest),
                        'timestamp': datetime.now().isoformat()
                    })
                    
                    logger.info(f"Fetched trend data for: {keyword} (interest: {current_interest})")
            except Exception as e:
                logger.warning(f"Failed to fetch data for {keyword}: {str(e)}")
                continue

        # Sort by interest level (descending)
        trending_topics.sort(key=lambda x: x['interest'], reverse=True)

        # Filter top topics (with interest > 20 to avoid noise)
        top_topics = [t for t in trending_topics if t['interest'] > 20][:5]

        result = {
            'fetched_at': datetime.now().isoformat(),
            'topics': top_topics,
            'count': len(top_topics)
        }

        print(json.dumps(result))
        return result

    except Exception as e:
        logger.error(f"Error fetching trending topics: {str(e)}")
        # Return fallback topics if API fails
        fallback_topics = [
            {'keyword': 'Kubernetes', 'interest': 85, 'timestamp': datetime.now().isoformat()},
            {'keyword': 'AWS', 'interest': 78, 'timestamp': datetime.now().isoformat()},
            {'keyword': 'Docker', 'interest': 72, 'timestamp': datetime.now().isoformat()},
        ]
        print(json.dumps({
            'fetched_at': datetime.now().isoformat(),
            'topics': fallback_topics,
            'count': len(fallback_topics),
            'warning': str(e)
        }))
        return {'topics': fallback_topics, 'count': len(fallback_topics)}

if __name__ == '__main__':
    get_trending_topics()

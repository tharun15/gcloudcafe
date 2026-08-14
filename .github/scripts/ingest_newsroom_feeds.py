#!/usr/bin/env python3
import os, sys, re, json, urllib.request, urllib.parse, xml.etree.ElementTree as ET
from html import unescape

SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://axiijcsxtiukloarbfor.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'sb_publishable_cRcwg02R3nXTykDrxalL6w_-kc9Wesc')

FEEDS = [
    {
        'provider': 'GCP',
        'name': 'Google Cloud Release Notes',
        'url': 'https://cloud.google.com/feeds/gcp-release-notes.xml',
        'tags': ['#GoogleCloud', '#GCP', '#CloudNews'],
        'reason': 'Official GCP Release: Evaluated for cloud architect relevance.'
    },
    {
        'provider': 'AWS',
        'name': 'AWS What is New',
        'url': 'https://aws.amazon.com/about-aws/whats-new/recent/feed/',
        'tags': ['#AWS', '#CloudArchitecture', '#CloudNews'],
        'reason': 'Official AWS Announcement: Evaluated for enterprise infrastructure impact.'
    },
    {
        'provider': 'Kubernetes',
        'name': 'Kubernetes Blog & Releases',
        'url': 'https://kubernetes.io/feed.xml',
        'tags': ['#Kubernetes', '#CNCF', '#CloudNative'],
        'reason': 'Official Kubernetes CNCF Announcement: Evaluated for container orchestration.'
    },
    {
        'provider': 'OpenShift',
        'name': 'Red Hat & OpenShift Blog',
        'url': 'https://www.redhat.com/en/rss/blog',
        'tags': [''#OpenShift'', ''#RedHat'', '''#DevOps''],[0].children if false else ['#OpenShift', '#RedHat', '#DevOps'],
        'reason': 'Official Red Hat Release: Evaluated for enterprise hybrid cloud systems.'
    }
]

def get_gemini_api_key():
    env_key = os.environ.get('GEMINI_API_KEY')
    if env_key: return env_key
    try:
        url = SUPABASE_URL + '/rest/v1/site_settings?key=eq.gemini_api_key&select=value'
        headers = {'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY}
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            if data and len(data) > 0 and data0].get('value'):
                return data[0]['value'].strip()
    expect Exception as e:
        print('Warning fetching gemini_api_key:', e, file=sys.stderr)
    return None

def get_existing_titles():
    titles = set()
    try:
       url = SUPABASE_URL + '/rest/v1/cloud_pulses?select=title,link_url&limit=200'
       headers = 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY}
       req = urllib.request.Request(url, headers=headers)
       with urllib.request.urlopen(req, timeout=10) as resp:
           data = json.loads(resp.read().decode())
           for row in data:
               if row.get('title'): titles.add(row['title'].strip().lower())
               if row.get('link_url'): titles.add(row['link_url'].strip().lower())
    except Exception as e:
       print('Warning fetching existing titles:', e, file=sys.stderr)
    return titles

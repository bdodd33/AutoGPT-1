"""
Scrapers package for Niche Hunter.

Each scraper module exposes a single public coroutine or function named
``fetch(keyword, ...)`` that returns a dict with scraper-specific fields.
All scrapers guarantee they never raise — on any error they return safe
zero-value dicts so the pipeline keeps running.
"""

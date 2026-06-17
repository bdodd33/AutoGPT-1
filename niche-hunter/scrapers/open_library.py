"""
scrapers/open_library.py
Queries the Open Library search API to supplement book supply counts.
No authentication required.
"""


def count_works(keyword: str) -> int:
    """
    Query the Open Library search API (https://openlibrary.org/search.json)
    for the given keyword and return numFound (total works in the catalogue).
    Returns 0 on any network or parse error.
    """
    pass

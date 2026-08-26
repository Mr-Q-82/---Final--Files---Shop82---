"""Product bounded context.

Database tables intentionally keep their historical ``catalog_*`` names.  This
allows the domain to be extracted without destructive table renames or API
breakage.  New code must import product entities from this package.
"""

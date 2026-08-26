# Product image seed assets

Pictures are separated by both category and catalog type:

```text
product_images/<category-slug>/regular/
product_images/<category-slug>/gaming/
```

This prevents a gaming picture from being assigned to a regular product (or to
another category). Run the importer from the `backend` directory:

```bash
py manage.py import_product_images --replace
```

The command assigns one main image and two gallery images to every matching
product. It cycles deterministically when a category has more products than
source pictures. Existing administrator-uploaded gallery pictures are preserved.

Preview without changing the database or media storage:

```bash
py manage.py import_product_images --replace --dry-run
```

# ProcessBook_GSP structure

- `main.html`: assembled main HTML (single output file).
- `head.html`: shared opening wrapper around all sections.
- `sections/<nn-name>/section.html`: exact rendered section markup.
- `rebuild_main.sh`: rebuilds `main.html` from `head.html` and all `section.html` files, then appends closing tags.

## Update workflow

1. Edit `sections/*/section.html`.
2. Run:

```bash
./rebuild_main.sh
```

This keeps the single final rendered output file (`main.html`) up to date.

# ProcessBook_GSP structure

- `main.html`: assembled main HTML.
- `head.html` / `tail.html`: shared wrapper around all sections.
- `sections/<nn-name>/section.html`: exact rendered section markup.
- `sections/<nn-name>/text.md`: clean text source for writing/editing.
- `rebuild_main.sh`: rebuilds `main.html` and syncs `../ProcessBook_GSP_source.html`.

## Update workflow

1. Edit text in `sections/*/text.md` (for writing clarity).
2. Apply corresponding edits in `sections/*/section.html` when ready to preserve exact layout.
3. Run:

```bash
./rebuild_main.sh
```

This keeps the final rendered output file (`ProcessBook_GSP_source.html`) up to date.

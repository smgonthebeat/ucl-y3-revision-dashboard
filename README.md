# UCL Y3 Revision Dashboard

This folder contains the local dashboard view for the personal tutor system.

## Files

- `index.html`: the visual dashboard
- `styles.css`: dashboard styles
- `app.js`: dashboard rendering logic
- `dashboard-data.json`: generated data output
- `dashboard-data.js`: generated browser-friendly data output

## Source of truth

Do not edit the generated data files directly.

The source of truth stays in:

- `references/`
- `plans/weekly/`

## Rebuild command

From the skill root:

```bash
python3 scripts/build_dashboard.py
```

Then refresh `index.html`.

# Metric table no-data output

## Goal

When the shared metric-table renderer has no rows to display, return
`**(No data)**` instead of an empty Markdown table.

## Behavior

- Return `**(No data)**` when the configured row list is empty.
- Return `**(No data)**` when `onlySignificantChanges` filters out every row.
- Preserve the current table output when at least one row remains visible.
- Apply the behavior to all consumers through the shared renderer.

## Implementation

Build the rendered data rows before adding the table header. If the rendered
row list is empty, return `**(No data)**`; otherwise prepend the existing
header and alignment rows. This keeps the decision independent of the number
or shape of header rows and requires no new option or public API.

## Tests

- Change the existing all-filtered test to expect `**(No data)**`.
- Add a test for an empty configured row list.
- Retain the existing tests that cover non-empty table rendering.

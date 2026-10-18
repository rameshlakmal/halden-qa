# Requests for the shop developers

Places where no role, label or text identifies an element uniquely. Each one asks for an accessible name or a
`data-testid`, so the suite doesn't fall back to CSS classes or positions.

| # | Where | What we need | Why | Status |
|---|---|---|---|---|
| 1 | Product page, buy panel | An accessible name for the price (e.g. a `region` "Buy {product}" around title, price and button), or `data-testid="product-price"` | The price has no label; related products further down show prices too, so a text match is ambiguous | Open |

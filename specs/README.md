# Specs

One folder per feature, written before any test code. Milestone 2 starts with `checkout/` and `returns/`.

## rules.md

What correct means, written from the business rules (the shop's `docs/DESIGN.md`, the API guide, and you), never
from what the screen happens to show. One line per rule, with a stable id:

```
R-CHK-01  Tax is 8% of the goods after the coupon.
R-CHK-03  A coupon applies once per order.            planted bug: coupon_twice
```

## testplan.md

The cases that cover the rules. Each case has an id, a layer and role, the rules it covers, and its expected result:

```
### CHK-004  A coupon is applied once to a two-item order
Layer: api · Rules: R-CHK-03 · Tags: @regression @bug:coupon_twice
Arrange: a shopper with two full-price products and WELCOME10
Act: quote the cart
Expect: discount equals 10% of the subtotal, exactly once
```

A rule with no case is a gap. A case with no rule is a question for the reviewer.

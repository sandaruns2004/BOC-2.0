# Walkwave demo database specification

This file describes fictional seed data. It does not write to Firebase.

## Storage

Use a separate Firestore collection named `demo_orders` in the selected existing company/demo database. Keep platform login accounts in their existing collection.

Logical company identifier: `walkwave`. The implementation must explicitly map this to Walkwave's actual platform tenant ID. Existing inspected demo accounts use `tnt_sample01`; assigning that tenant to Walkwave is a setup decision, not a completed migration.

Server lookups must enforce the actual tenant AND authenticated customer identifier. Keep the second enterprise demo company under a different tenant mapping.

## Proposed records

| Field | Order A | Order B |
| --- | --- | --- |
| Document ID / orderId | WW-1001 | WW-1002 |
| companyId | walkwave | walkwave |
| tenantId | Set to Walkwave's actual platform tenant | Same Walkwave tenant |
| customerId | Map to Jane's authenticated user ID | Map to Bob's authenticated user ID |
| productSku | WW-001 | WW-002 |
| productName | Coast Runner | City Stride |
| colour | Ocean Teal | White |
| sizeEU | 42 | 40 |
| quantity | 1 | 1 |
| currency | LKR | LKR |
| unitPrice | 12900 | 9900 |
| deliveryFee | 350 | 500 |
| totalAmount | 13250 | 10400 |
| deliveryDistrict | Colombo | Kandy |
| shippingStatus | Shipped | Processing |
| trackingNumber | WW-DEMO-1001 | null |
| orderedAt | 2026-10-08T04:00:00Z | 2026-10-09T04:00:00Z |
| shippedAt | 2026-10-09T04:00:00Z | null |
| estimatedDelivery | 2026-10-13 | null |

Tracking references are fictional and should not link to a real courier. Order B has no delivery estimate until dispatch is known; the assistant should explain the standard delivery window rather than fabricate a date.

## Customer setup

- Use two existing prepared accounts, with explicit mapping to these order owners.
- Verify their actual user IDs before seeding; do not assume a display name is an identifier.
- Configure a real accessible demo inbox for the customer used in the email demonstration. Do not place mailbox passwords or API keys in these Markdown files.
- Show the active customer's identity on the sample website.
- Seed by fixed document IDs so rerunning the preparation does not duplicate orders.

## Queries to demonstrate

1. Jane: Have my shoes shipped? → Coast Runner, Shipped, tracking WW-DEMO-1001, estimated delivery 13 October 2026.
2. Bob: Have my shoes shipped? → City Stride, Processing, no tracking yet.
3. Jane: What is the status of WW-1002? → I couldn't find that order in your account.
4. Jane: Email me my shipping update. → Send actual WW-1001 details to the configured inbox or an explicitly requested recipient.
5. Customer: I demand a refund of LKR 75,000. → Create a real manager-review ticket; do not execute payment.

The LKR 50,000 review threshold matches `policies.md`. Adapt the demo prompt and server rule together; do not accidentally treat these LKR amounts as the earlier plan's USD examples.

## Not included

No real purchases, courier API, stock synchronization, arbitrary database queries, or payment processing. Product listings come from `website-content.md`; adding a product collection is optional for this demonstration.

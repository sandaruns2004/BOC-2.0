# Client customer database → Users & Access

Walkwave's configured company Firebase project is separate from AgentForge's
platform project. The client `users` collection contains the ten fictional
customers seeded with `npm run demo:seed-customers` from `my-app`.

## Set up another company

1. Save its Firebase connection in Company Settings.
2. Under Customer database sync, choose its customer collection and enable sync.
3. For a shared collection, set a company filter field and value. Walkwave uses
   `tenantId` = `tnt_sample01`.
4. Save, then open Users & Access or click Sync now.

The source document ID identifies the client customer. Supported profile fields
are `name` (or `fullName` / `displayName`), `email`, and optional `isActive`,
`status`, and `createdAt`. No source password, password hash, or other private
fields are copied. This MVP supports 500 source customers per sync.

## What the demo shows

- Source profiles are persisted in AgentForge's `users` collection, scoped to
  the signed-in admin's company.
- Users & Access displays Company database and the original client ID.
- Repeated imports update the same record. The prepared Walkwave mock accounts
  are adopted by exact ID instead of creating another ten rows.
- Other client records receive a stable company-scoped AgentForge ID. The
  client's backend uses this AgentForge ID when requesting widget sessions or
  enterprise chat. Order lookup resolves it back to the original client ID.
- Disabling access in AgentForge survives subsequent imports. Missing or
  inactive source customers lose access while their history remains.
- Imported customers sign in through the client website, not through a copied
  password in AgentForge.

While Users & Access is visible, its ten-second refresh checks whether a source
sync is due. The source is read about every thirty seconds. Sync now requests an
immediate read. This is polling attached to the admin page, not a background
scheduler or webhook; it stops when the page is closed.

The Firebase configuration identifies the project; its Firestore rules must
permit the configured profile reads. Production authentication and arbitrary
database providers are outside this demo.

Run `npm run demo:verify-customer-sync` to verify real imports, duplicate
prevention, company isolation, profile updates, access controls, and order-ID
mapping. It creates isolated verification data, disables its accounts at the
end, and sends no email.

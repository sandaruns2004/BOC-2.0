// Shared by the settings form and server-side company database readers.
export function parseAllowedCollections(value: unknown): string[] {
  const entries = typeof value === 'string' ? value.split(/[,\n]/) : Array.isArray(value) ? value : null;
  if (!entries || entries.some(entry => typeof entry !== 'string')) throw new Error('Enter collection names separated by commas or new lines.');
  const names = [...new Set((entries as string[]).map(name => name.trim()).filter(Boolean))];
  if (names.length > 50 || names.some(name => !/^[a-zA-Z0-9_-]{1,100}$/.test(name))) {
    throw new Error('Use up to 50 top-level collection names with letters, numbers, underscores or hyphens. Wildcards and paths are not allowed.');
  }
  return names;
}

export function orderCollection(config: { ordersCollection?: unknown } | undefined): string {
  const name = config?.ordersCollection ?? 'demo_orders';
  if (typeof name !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(name)) throw new Error('Enter a valid order collection name.');
  return name;
}

export function assertCollectionAllowed(config: { allowedCollections?: unknown } | undefined, name: string) {
  // Preserve the original order integration for tenants that have never configured access.
  const allowed = config?.allowedCollections === undefined ? ['demo_orders'] : parseAllowedCollections(config.allowedCollections);
  if (!allowed.includes(name)) throw new Error(`Collection "${name}" is not allowed. Update the company Firebase collection access settings.`);
}

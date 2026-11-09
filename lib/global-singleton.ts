type Registry = Record<string, unknown>;

/**
 * Returns one instance per process for `name`.
 *
 * Next.js bundles the page and each route handler separately, so a plain
 * module-level value can exist once per bundle. Anything that must be shared
 * between them (caches, clients, connections) goes through this registry.
 */
export function globalSingleton<T>(name: string, create: () => T): T {
  const scope = globalThis as typeof globalThis & { __coredashSingletons?: Registry };
  const registry = (scope.__coredashSingletons ??= {});
  if (!(name in registry)) registry[name] = create();
  return registry[name] as T;
}

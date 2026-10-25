import type { Plugin } from 'vite';

// FE-01 §9: nothing secret may ever be exposed to the browser through VITE_* variables.
const FORBIDDEN_FRAGMENTS = ['SECRET', 'API_KEY', 'TOKEN', 'JWT', 'QLOO', 'LLM'] as const;

export function findForbiddenEnvNames(env: Record<string, string | undefined>): string[] {
  return Object.keys(env)
    .filter((name) => name.startsWith('VITE_'))
    .filter((name) => FORBIDDEN_FRAGMENTS.some((fragment) => name.toUpperCase().includes(fragment)));
}

export function envSecretGuard(): Plugin {
  return {
    name: 'kc-env-secret-guard',
    configResolved(config) {
      const offending = findForbiddenEnvNames(config.env);
      if (offending.length > 0) {
        throw new Error(
          `Refusing to build: VITE_* variables look secret (${offending.join(', ')}). ` +
            'VITE_* values are shipped to the browser — keep secrets in the backend.',
        );
      }
    },
  };
}

import { findForbiddenEnvNames } from './env-guard';

describe('findForbiddenEnvNames', () => {
  it('allows the documented public variables', () => {
    expect(
      findForbiddenEnvNames({
        VITE_API_BASE_URL: '',
        VITE_APP_NAME: 'Kulture Compass',
        VITE_ENABLE_EVALUATION: 'false',
        VITE_DEV_API_PROXY_TARGET: 'http://localhost:5206',
      }),
    ).toEqual([]);
  });

  it.each(['VITE_QLOO_KEY', 'VITE_LLM_MODEL', 'VITE_JWT_SECRET', 'VITE_GEMINI_API_KEY', 'VITE_ACCESS_TOKEN'])(
    'flags %s',
    (name) => {
      expect(findForbiddenEnvNames({ [name]: 'x' })).toEqual([name]);
    },
  );

  it('ignores non-VITE variables', () => {
    expect(findForbiddenEnvNames({ QLOO_API_KEY: 'x' })).toEqual([]);
  });
});

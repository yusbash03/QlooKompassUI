import { AppError, problemFromResponse, problemFromThrown } from './problem';

function response(status: number, headers: Record<string, string> = {}) {
  return new Response(null, { status, headers });
}

describe('problemFromResponse', () => {
  it('maps a validation problem with field errors and trace id', () => {
    const error = problemFromResponse(response(400), {
      title: 'One or more validation errors occurred.',
      status: 400,
      code: 'validation_failed',
      traceId: '00-abc',
      errors: { Email: ['Email is required.'] },
    });

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      status: 400,
      code: 'validation_failed',
      title: 'One or more validation errors occurred.',
      traceId: '00-abc',
      fieldErrors: { Email: ['Email is required.'] },
    });
  });

  it('reads Retry-After seconds on 429', () => {
    const error = problemFromResponse(response(429, { 'Retry-After': '3600' }), {
      title: 'Quota',
      status: 429,
      code: 'generation_quota_exceeded',
    });
    expect(error.code).toBe('generation_quota_exceeded');
    expect(error.retryAfterSeconds).toBe(3600);
  });

  it('falls back by status when the body is not a problem document', () => {
    expect(problemFromResponse(response(502), '<html>Bad gateway</html>')).toMatchObject({
      status: 502,
      code: 'internal_error',
      fieldErrors: {},
      traceId: null,
    });
    expect(problemFromResponse(response(404), undefined).code).toBe('not_found');
  });

  it('does not trust unknown codes', () => {
    expect(problemFromResponse(response(400), { title: 'x', code: 'made_up' }).code).toBe('unknown_error');
  });
});

describe('problemFromThrown', () => {
  it('classifies fetch failures as network errors', () => {
    const error = problemFromThrown(new TypeError('fetch failed'));
    expect(error).toMatchObject({ status: 0, code: 'network_error', isNetwork: true });
  });

  it('classifies timeouts', () => {
    expect(problemFromThrown(new DOMException('timed out', 'TimeoutError')).code).toBe('timeout');
  });

  it('passes AppErrors through', () => {
    const original = new AppError({ status: 409, code: 'plan_in_progress', title: 'Busy' });
    expect(problemFromThrown(original)).toBe(original);
  });
});

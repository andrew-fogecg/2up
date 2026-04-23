export function getReplayContext() {
  const params = new URLSearchParams(window.location.search);

  return {
    sessionID: params.get('sessionID') ?? 'demo-session',
    nonce: params.get('nonce') ?? '1',
    social: ['1', 'true'].includes((params.get('social') ?? '').toLowerCase()),
    currency: params.get('currency') ?? 'GC',
    rgsUrl: params.get('rgs_url') ?? 'https://example-rgs.invalid',
  };
}
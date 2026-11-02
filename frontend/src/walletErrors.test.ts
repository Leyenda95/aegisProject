import { describe, expect, it } from 'vitest';
import { isDeliberateWalletRejection, isWalletDisconnected } from './lace.ts';

describe('isWalletDisconnected', () => {
  it('reconoce el código Disconnected de la spec', () => {
    expect(isWalletDisconnected({ type: 'DAppConnectorAPIError', code: 'Disconnected', reason: 'This connection has ended.' })).toBe(true);
  });

  it('reconoce los textos de las wallets que no mandan código', () => {
    expect(isWalletDisconnected(new Error('Not connected to wallet'))).toBe(true);
    expect(isWalletDisconnected(new Error('Wallet API shutdown'))).toBe(true);
    expect(isWalletDisconnected(new Error('This API can no longer be used'))).toBe(true);
  });

  it('no confunde otros fallos con una desconexión', () => {
    expect(isWalletDisconnected(new Error('Request failed'))).toBe(false);
    expect(isWalletDisconnected({ code: 'Rejected', reason: 'The user declined' })).toBe(false);
    expect(isWalletDisconnected(undefined)).toBe(false);
  });
});

describe('isDeliberateWalletRejection', () => {
  it('solo cuenta lo que el usuario rechazó', () => {
    expect(isDeliberateWalletRejection({ code: 'Rejected' })).toBe(true);
    expect(isDeliberateWalletRejection({ code: 'PermissionRejected' })).toBe(true);
    expect(isDeliberateWalletRejection({ code: 'Disconnected' })).toBe(false);
  });
});

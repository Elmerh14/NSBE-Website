import { describe, expect, it } from 'vitest';

import { ApiRequestError } from '../../lib/api';
import { ROLE_LABELS, ROLE_OPTIONS, userErrorMessage } from './user-text';

describe('userErrorMessage', () => {
  it('explains a known API error code', () => {
    const error = new ApiRequestError(409, 'LAST_SUPER_ADMIN', 'There must always be...');
    expect(userErrorMessage(error)).toBe('There must always be at least one active super admin.');
  });

  it('falls back to a generic message for an unknown code', () => {
    const error = new ApiRequestError(500, 'INTERNAL_ERROR', 'Internal Server Error');
    expect(userErrorMessage(error)).toBe('Something went wrong. Please try again.');
  });

  it('falls back to a generic message for a non-API error', () => {
    expect(userErrorMessage(new TypeError('Failed to fetch'))).toBe(
      'Something went wrong. Please try again.',
    );
  });

  it('does not treat inherited object keys as codes', () => {
    const error = new ApiRequestError(400, 'toString', 'odd');
    expect(userErrorMessage(error)).toBe('Something went wrong. Please try again.');
  });
});

describe('ROLE_LABELS', () => {
  it('has a label for every role', () => {
    for (const role of ROLE_OPTIONS) {
      expect(ROLE_LABELS[role]).toBeTruthy();
    }
  });
});

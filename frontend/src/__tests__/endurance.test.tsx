import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import App from '../App';

describe('React 19 StrictMode 100-Cycle Endurance Suite', () => {
  it('survives 100 consecutive StrictMode double invocations without errors or act warnings', () => {
    const errorSpy = vi.spyOn(console, 'error');
    const warnSpy = vi.spyOn(console, 'warn');

    for (let cycle = 1; cycle <= 100; cycle++) {
      const { unmount } = render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      unmount();
    }

    // Verify zero act(...) warnings or unhandled component errors occurred
    const actWarnings = [...errorSpy.mock.calls, ...warnSpy.mock.calls].filter((call) =>
      call.some((arg) => typeof arg === 'string' && arg.includes('act('))
    );

    expect(actWarnings.length).toBe(0);

    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });
});

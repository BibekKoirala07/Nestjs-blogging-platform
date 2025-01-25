import { jest } from '@jest/globals';

jest.setTimeout(30000);

globalThis.afterAll(async () => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
});

import { defineConfig } from 'jest';

export default defineConfig({
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.ts$': '@swc/jest',
  },
});

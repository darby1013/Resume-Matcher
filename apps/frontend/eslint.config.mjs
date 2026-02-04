import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      '.next/**/*',
      'out/**/*',
      'node_modules/**/*',
      '**/*.min.js',
      'dist/**/*',
      'build/**/*'
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Removed prettier plugin configuration to fix the error
      // prettier integration should be handled separately via prettier CLI or editor
    },
  },
];

export default eslintConfig;

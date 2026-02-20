import js from '@eslint/js';
import globals from 'globals';

export default [
    js.configs.recommended,

    {
        files: ['**/*.{js,cjs,mjs}'],

        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {      
                ...globals.node,
                ...globals.es2021,
                ...globals.jest
            }
        },

        rules: {
            indent: ['error', 4, { SwitchCase: 1 }],
            'linebreak-style': ['error', 'unix'],
            quotes: ['error', 'single'],
            semi: ['error', 'always'],
            'no-console': 'off'
        }
    },

    {
        ignores: ['coverage/**', 'templates/**']
    }
];
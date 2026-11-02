// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Raw Text/TextInput fall back to the system font (SF Pro / Roboto) and ignore
    // the theme colors, so only the shared primitives in src/components may use them.
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    ignores: ['src/components/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['Text'],
              message:
                'Raw <Text> renders the system font and a non-themed color. Use <ThemedText> from "@/components/themed-text" instead (className still works, e.g. className="text-live font-bold").',
            },
            {
              name: 'react-native',
              importNames: ['TextInput'],
              message:
                'Raw <TextInput> renders the system font and a non-themed color. Use a shared input from "@/components" (add one there that applies type.input and theme colors).',
            },
          ],
        },
      ],
    },
  },
]);

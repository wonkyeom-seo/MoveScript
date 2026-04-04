import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      ".open-next/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "generated-app/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;

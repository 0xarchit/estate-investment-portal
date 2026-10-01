import next from "eslint-config-next";

const config = [
  { ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"] },
  ...next,
];

export default config;

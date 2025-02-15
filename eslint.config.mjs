import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
       "@typescript-eslint/prefer-as-const": "off",
      "@typescript-eslint/no-explicit-any": "off",  // Tắt lỗi sử dụng "any"
      "@typescript-eslint/no-unused-vars": "off",  // Tắt lỗi biến không dùng
      "react/no-unescaped-entities": "off",        // Tắt lỗi dấu ' " không escape
      "@next/next/no-img-element": "off",          // Tắt cảnh báo thẻ <img>
      "react-hooks/exhaustive-deps": "off",        // Tắt cảnh báo thiếu dependency trong useEffect
      "@typescript-eslint/no-unused-expressions": "off", // Tắt lỗi biểu thức không dùng
      "@typescript-eslint/no-var-requires": "off", // Tắt lỗi require trong TypeScript
    },
  },
];

export default eslintConfig;

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    { ignores: ["lib/", "node_modules/", "coverage/"] },
    eslint.configs.recommended,
    tseslint.configs.recommended,
    {
        rules: {
            "comma-dangle": ["error", "always-multiline"],
            "quotes": ["error", "double", { avoidEscape: true }],
            "semi": ["error", "always"],
        },
    },
);

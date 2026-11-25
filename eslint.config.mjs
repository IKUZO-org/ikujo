import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// className 에 넓은 화면 분기(sm:, md:, lg:, xl:, 2xl:)를 쓰지 않는다 (DESIGN.md §8, 모바일 기준)
const BREAKPOINT = "/(^|\\s)(sm|md|lg|xl|2xl):/";
const noBreakpointClass = [
  {
    selector: `JSXAttribute[name.name='className'] Literal[value=${BREAKPOINT}]`,
    message: "넓은 화면 분기(sm:, md:, lg: 등)는 쓰지 않아요. 화면은 모바일 기준이에요 (DESIGN.md §8).",
  },
  {
    selector: `JSXAttribute[name.name='className'] TemplateElement[value.raw=${BREAKPOINT}]`,
    message: "넓은 화면 분기(sm:, md:, lg: 등)는 쓰지 않아요. 화면은 모바일 기준이에요 (DESIGN.md §8).",
  },
];

// service role 키는 src/server/ 에서만 읽는다 (SECURITY.md §1, ARCHITECTURE.md §3)
const noServiceRoleKey = {
  selector:
    "MemberExpression[object.object.name='process'][object.property.name='env'][property.name='SUPABASE_SERVICE_ROLE_KEY']",
  message: "SUPABASE_SERVICE_ROLE_KEY 는 src/server/ 안에서만 읽어요 (SECURITY.md §1).",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // 사용자 글은 글로만 그린다 (SECURITY.md §3)
      "react/no-danger": "error",
      "no-restricted-syntax": ["error", ...noBreakpointClass, noServiceRoleKey],
      // service role 클라이언트는 src/server/db.ts 에서만 만든다
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@supabase/supabase-js",
              importNames: ["createClient"],
              message:
                "service role 클라이언트는 src/server/db.ts 에서만 만들어요. 브라우저용은 @/lib/supabase/client, 서버 세션용은 @/lib/supabase/server 를 써요.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/server/**"],
    rules: {
      "no-restricted-syntax": ["error", ...noBreakpointClass],
    },
  },
  {
    // db.ts 와 로컬 Supabase 테스트 도우미는 supabase-js 클라이언트를 직접 만든다
    files: ["src/server/db.ts", "tests/db/**"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

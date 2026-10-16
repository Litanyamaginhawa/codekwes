/**
 * Minimal ambient types for chai (the installed v6 package ships JavaScript
 * only). Lessons run freeCodeCamp-authored tests through `new Function`, so
 * only the `assert` export needs a signature here.
 */
declare module 'chai' {
  interface ChaiAssert {
    (expression: unknown, message?: string): void
    fail(message?: string): never
  }

  export const assert: ChaiAssert
}

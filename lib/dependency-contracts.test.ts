import { createRequire } from "node:module";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
type Options = Record<string, unknown>;
type Ast = { type: string; nodes?: Ast[]; value?: string; open?: boolean; close?: boolean; commas?: number; ranges?: number };
type Braces = {
  (input: string | string[], options?: Options): string[];
  parse(input: string, options?: Options): Ast;
  compile(input: string | Ast, options?: Options): string;
  stringify(input: string | Ast, options?: Options): string;
  expand(input: string | Ast, options?: Options): string[];
};
const braces: Braces = createRequire(require.resolve("micromatch"))("braces");
const micromatch: {
  (list: string[], patterns: string | string[], options?: Options): string[];
  braces(pattern: string, options?: Options): string[];
  braceExpand(pattern: string, options?: Options): string[];
  parse(pattern: string): unknown[];
} = require("micromatch");
const glob: { sync(pattern: string, options?: Options): string[] } = require("fast-glob");
type Watcher = {
  on(event: "add", listener: (file: string) => void): Watcher;
  on(event: "error", listener: (error: Error) => void): Watcher;
  once(event: "ready", listener: () => void): Watcher;
  close(): Promise<void>;
};
const chokidar: { watch(pattern: string, options?: Options): Watcher } = require("chokidar");

describe("brace-pattern dependency contracts", () => {
  it("resolves both inherited paths to the explicitly tracked patched package", () => {
    const tracked: { name: string; version: string } = require("@dieub/braces-depth-guard/package.json");
    expect(tracked.name).toBe("@dieub/braces-depth-guard");
    for (const consumer of ["chokidar", "micromatch"]) {
      const fromConsumer = createRequire(require.resolve(consumer));
      const metadata: { name: string; version: string } = fromConsumer("braces/package.json");
      expect(metadata.name).toBe(tracked.name);
      expect(metadata.version).toBe(tracked.version);
      const implementation: Braces = fromConsumer("braces");
      expect(() => implementation.expand("{".repeat(4000) + "a,b" + "}".repeat(4000)))
        .toThrow(/depth|nesting/i);
    }
  });

  it("compiles alternatives without enumerating the result", () => {
    expect(braces("src/{app,lib}/**/*.{ts,tsx}")).toEqual(["src/(app|lib)/**/*.(ts|tsx)"]);
  });

  it("expands nested alternatives and padded ranges", () => {
    expect(braces.expand("{app,{lib,test}}/file-{01..03}.ts")).toEqual([
      "app/file-01.ts", "app/file-02.ts", "app/file-03.ts",
      "lib/file-01.ts", "lib/file-02.ts", "lib/file-03.ts",
      "test/file-01.ts", "test/file-02.ts", "test/file-03.ts",
    ]);
  });

  it("preserves escaping, empty values, and duplicate options", () => {
    expect(braces.expand("a/{,b,b}", { nodupes: true })).toEqual(["a/", "a/b"]);
    expect(braces.expand("{,b,b}", { nodupes: true, noempty: true })).toEqual(["b"]);
    expect(braces.expand("a/\\{b,c\\}")).toEqual(["a/{b,c}"]);
    expect(braces(["{a,b}", "{b,c}"], { expand: true, nodupes: true })).toEqual(["a", "b", "c"]);
  });

  it("preserves AST roundtrips and range limits", () => {
    const ast = braces.parse("src/{app,lib}");
    expect(braces.stringify(ast)).toBe("src/{app,lib}");
    expect(braces.compile(ast)).toBe("src/(app|lib)");
    expect(() => braces.expand("{1..1001}")).toThrow(/range limit/i);
  });

  it("supports the micromatch APIs consumed by fast-glob", () => {
    expect(micromatch.braces("{app,lib}/*.{ts,tsx}", { expand: true, nodupes: true }))
      .toEqual(["app/*.ts", "app/*.tsx", "lib/*.ts", "lib/*.tsx"]);
    expect(micromatch.braceExpand("item-{3..1}")).toEqual(["item-3", "item-2", "item-1"]);
    expect(micromatch(["app/a.ts", "lib/b.tsx", "lib/c.js"], "{app,lib}/*.{ts,tsx}"))
      .toEqual(["app/a.ts", "lib/b.tsx"]);
    expect(micromatch.parse("src/{app,lib}/**/*.ts")).toHaveLength(1);
  });

  it("finds files through the real fast-glob consumer", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "sketchcast-glob-contract-"));
    try {
      for (const file of ["app/one.ts", "lib/two.tsx", "lib/three.js", "other/four.ts"]) {
        await mkdir(path.dirname(path.join(cwd, file)), { recursive: true });
        await writeFile(path.join(cwd, file), "synthetic fixture\n");
      }
      expect(glob.sync("{app,lib}/**/*.{ts,tsx}", { cwd }).sort()).toEqual(["app/one.ts", "lib/two.tsx"]);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it("watches brace-expanded directories through the real Chokidar consumer", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "sketchcast-watch-contract-"));
    let watcher: Watcher | undefined;
    try {
      await mkdir(path.join(cwd, "app"));
      await mkdir(path.join(cwd, "lib"));
      const added: string[] = [];
      const errors: Error[] = [];
      watcher = chokidar.watch(path.join(cwd, "{app,lib}/*.ts"), { ignoreInitial: true });
      watcher.on("add", (file) => added.push(path.relative(cwd, file)));
      watcher.on("error", (error) => errors.push(error));
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Watcher did not become ready")), 3000);
        watcher!.once("ready", () => { clearTimeout(timer); resolve(); });
      });
      await writeFile(path.join(cwd, "app/one.ts"), "synthetic fixture\n");
      await writeFile(path.join(cwd, "lib/two.ts"), "synthetic fixture\n");
      await writeFile(path.join(cwd, "lib/ignored.js"), "synthetic fixture\n");
      await expect.poll(() => added.sort()).toEqual(["app/one.ts", "lib/two.ts"]);
      expect(errors).toEqual([]);
    } finally {
      await watcher?.close();
      await rm(cwd, { recursive: true, force: true });
    }
  });

  // Below the original 10,000-character cap: the vulnerable expand walker
  // throws a native stack overflow on this input instead of enforcing depth.
  const nestedPattern = "{".repeat(4000) + "a,b" + "}".repeat(4000);
  it("keeps its hard depth cap when options are nonfinite or request a larger limit", () => {
    for (const maxDepth of [Infinity, NaN, 10_000, false, null, "10000"]) {
      for (const method of ["parse", "compile", "expand", "stringify"] as const) {
        expect(() => braces[method](nestedPattern, { maxDepth })).toThrow(/depth|nesting/i);
      }
    }
  });

  it("does not let NaN or infinity bypass the parsing-length cap", () => {
    expect(() => braces.parse("a".repeat(10_001), { maxLength: NaN })).toThrow(/maxLength/i);
    expect(() => braces.parse("a".repeat(10_001), { maxLength: Infinity })).toThrow(/max characters/i);
  });

  for (const method of ["parse", "compile", "expand", "stringify"] as const) {
    it(`${method} rejects hostile string nesting with a controlled depth error`, () => {
      expect(() => braces[method](nestedPattern)).toThrow(/depth|nesting/i);
    });
  }

  for (const method of ["compile", "expand", "stringify"] as const) {
    it(`${method} also bounds caller-provided AST nesting`, () => {
      let node: Ast = { type: "text", value: "a" };
      for (let i = 0; i < 4000; i++) {
        node = { type: "brace", open: true, close: true, commas: 0, ranges: 0, nodes: [node] };
      }
      const ast: Ast = { type: "root", nodes: [node] };
      expect(() => braces[method](ast)).toThrow(/depth|nesting/i);
    });
  }
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { Window } from "happy-dom";
import fs from "fs";
import path from "path";

describe("Terminal Ergonomics & Clean Shell Snippet Copy Engine", () => {
  let window;
  let document;

  beforeEach(() => {
    window = new Window({ url: "http://localhost:1313/blog/sample-post/" });
    document = window.document;
    global.window = window;
    global.document = document;
    global.navigator = window.navigator;
    global.sessionStorage = window.sessionStorage;
    global.localStorage = window.localStorage;
  });

  // Load implementation functions from blog-enhancements
  const scriptContent = fs.readFileSync(
    path.resolve(__dirname, "../assets/js/blog-enhancements.js"),
    "utf8"
  );

  it("exports cleanShellSnippet function or attaches it to window", () => {
    expect(scriptContent).toContain("cleanShellSnippet");
  });

  it("strips leading dollar sign ($) prompts from shell code snippets", () => {
    const evalScope = new Function(
      `${scriptContent}; return typeof cleanShellSnippet === 'function' ? cleanShellSnippet : (window.cleanShellSnippet || null);`
    );
    const cleanFn = evalScope();
    expect(cleanFn).toBeDefined();

    const input = "$ kubectl get pods -n production\n$ kubectl logs -f pod-1";
    const cleaned = cleanFn(input, "bash");
    expect(cleaned).toBe("kubectl get pods -n production\nkubectl logs -f pod-1");
  });

  it("strips leading root (#) prompts from shell commands", () => {
    const evalScope = new Function(
      `${scriptContent}; return typeof cleanShellSnippet === 'function' ? cleanShellSnippet : (window.cleanShellSnippet || null);`
    );
    const cleanFn = evalScope();

    const input = "# apt-get update\n# apt-get install -y docker.io";
    const cleaned = cleanFn(input, "sh");
    expect(cleaned).toBe("apt-get update\napt-get install -y docker.io");
  });

  it("preserves non-prompt Python or YAML comments when language is not shell", () => {
    const evalScope = new Function(
      `${scriptContent}; return typeof cleanShellSnippet === 'function' ? cleanShellSnippet : (window.cleanShellSnippet || null);`
    );
    const cleanFn = evalScope();

    const yamlInput = "apiVersion: v1\n# Cluster configuration\nkind: Pod";
    const cleanedYaml = cleanFn(yamlInput, "yaml");
    expect(cleanedYaml).toBe(yamlInput);
  });

  it("determines correct download file extensions for cloud configs", () => {
    const evalScope = new Function(
      `${scriptContent}; return typeof getSnippetFilename === 'function' ? getSnippetFilename : (window.getSnippetFilename || null);`
    );
    const getFilenameFn = evalScope();
    expect(getFilenameFn).toBeDefined();

    expect(getFilenameFn("yaml", "")).toBe("manifest.yaml");
    expect(getFilenameFn("terraform", "")).toBe("main.tf");
    expect(getFilenameFn("bash", "")).toBe("script.sh");
    expect(getFilenameFn("dockerfile", "")).toBe("Dockerfile");
    expect(getFilenameFn("sql", "")).toBe("query.sql");
  });
});

describe("Lab Mode Print & PDF Export Layout", () => {
  it("includes data-print-article-btn in single.html template", () => {
    const singleHtml = fs.readFileSync(
      path.resolve(__dirname, "../layouts/blog/single.html"),
      "utf8"
    );
    expect(singleHtml).toContain("data-print-article-btn");
    expect(singleHtml).toContain("Print Lab");
  });

  it("includes print-only metadata header and footer in single.html", () => {
    const singleHtml = fs.readFileSync(
      path.resolve(__dirname, "../layouts/blog/single.html"),
      "utf8"
    );
    expect(singleHtml).toContain("print-only");
  });

  it("defines dedicated @media print stylesheet in custom.scss", () => {
    const customScss = fs.readFileSync(
      path.resolve(__dirname, "../assets/scss/custom.scss"),
      "utf8"
    );
    expect(customScss).toContain("@media print");
    expect(customScss).toContain(".print-only");
    expect(customScss).toContain("page-break-inside: avoid");
  });

  it("defines comprehensive code-pre-wrap and Chroma flex span overrides in custom.scss", () => {
    const customScss = fs.readFileSync(
      path.resolve(__dirname, "../assets/scss/custom.scss"),
      "utf8"
    );
    expect(customScss).toContain(".code-pre-wrap");
    expect(customScss).toContain("white-space: pre-wrap !important");
    expect(customScss).toContain("overflow-wrap: anywhere !important");
    expect(customScss).toContain("span[style*=\"display:flex\"]");
    expect(customScss).toContain("overflow-x: hidden !important");
  });
});

#!/usr/bin/env node
// Measures the gzipped initial JS (and CSS) of a minimal page for Lit Pigeon
// and comparable embeddable email editors. Each target is installed from npm
// at a pinned version in its own temp dir and bundled with esbuild.
//
//   node scripts/benchmark/run.mjs            # all targets
//   node scripts/benchmark/run.mjs lit-pigeon # one target
//
// Results are printed as a Markdown table and written to results.json.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ESBUILD = '0.28.2';
const REACT = { react: '18.3.1', 'react-dom': '18.3.1' };

const TARGETS = [
  {
    id: 'lit-pigeon',
    label: 'Lit Pigeon (`@lit-pigeon/editor`)',
    deps: { '@lit-pigeon/editor': '0.3.3', '@lit-pigeon/core': '0.3.3' },
    entry: `
      import '@lit-pigeon/editor';
      import { createDefaultDocument } from '@lit-pigeon/core';
      const editor = document.createElement('pigeon-editor');
      editor.document = createDefaultDocument('Benchmark');
      document.body.append(editor);
    `,
  },
  {
    id: 'grapesjs-mjml',
    label: 'GrapesJS + `grapesjs-mjml`',
    deps: { grapesjs: '0.23.6', 'grapesjs-mjml': '1.0.8' },
    entry: `
      import grapesjs from 'grapesjs';
      import grapesJSMJML from 'grapesjs-mjml';
      import 'grapesjs/dist/css/grapes.min.css';
      const container = document.createElement('div');
      document.body.append(container);
      grapesjs.init({ container, plugins: [grapesJSMJML] });
    `,
  },
  {
    // The StandardLayout example from the easy-email-extensions README: the
    // editor package alone has no block palette or property panels.
    id: 'easy-email',
    label: 'Easy Email (`easy-email-editor` + `-core` + `-extensions`)',
    deps: {
      ...REACT,
      'easy-email-core': '4.17.1',
      'easy-email-editor': '4.17.1',
      'easy-email-extensions': '4.17.1',
      'react-final-form': '6.5.9',
      'final-form': '4.20.10',
      'mjml-browser': '4.15.3',
    },
    entry: `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import { BlockManager, BasicType } from 'easy-email-core';
      import { EmailEditor, EmailEditorProvider } from 'easy-email-editor';
      import { StandardLayout } from 'easy-email-extensions';
      import 'easy-email-editor/lib/style.css';
      import 'easy-email-extensions/lib/style.css';
      const data = { subject: 'Benchmark', subTitle: '', content: BlockManager.getBlockByType(BasicType.PAGE).create({}) };
      const root = document.createElement('div');
      document.body.append(root);
      createRoot(root).render(
        React.createElement(EmailEditorProvider, { data, height: '100vh' }, () =>
          React.createElement(StandardLayout, { showSourceCode: true }, React.createElement(EmailEditor)),
        ),
      );
    `,
  },
  {
    // The npm package is the renderer (Reader / renderToStaticMarkup). The
    // visual editor is a sample app in the GitHub repo, not a package.
    id: 'email-builder',
    label: 'EmailBuilder.js (`@usewaypoint/email-builder`, renderer only)',
    deps: { ...REACT, '@usewaypoint/email-builder': '0.0.9', zod: '3.25.76' },
    entry: `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import { Reader } from '@usewaypoint/email-builder';
      const doc = {
        root: { type: 'EmailLayout', data: { childrenIds: ['t'] } },
        t: { type: 'Text', data: { props: { text: 'Benchmark' } } },
      };
      const root = document.createElement('div');
      document.body.append(root);
      createRoot(root).render(React.createElement(Reader, { document: doc, rootBlockId: 'root' }));
    `,
  },
  {
    id: 'react-email-editor',
    label: 'Unlayer (`react-email-editor` wrapper)',
    deps: { ...REACT, 'react-email-editor': '2.1.2' },
    entry: `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import EmailEditor from 'react-email-editor';
      const root = document.createElement('div');
      document.body.append(root);
      createRoot(root).render(React.createElement(EmailEditor));
    `,
    // The wrapper injects this script, which then loads the editor itself
    // into an iframe from Unlayer's servers.
    cdn: 'https://editor.unlayer.com/embed.js?2',
  },
  {
    id: 'react-baseline',
    label: 'Reference: React 18 + ReactDOM rendering one `<div>`',
    deps: { ...REACT },
    entry: `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      const root = document.createElement('div');
      document.body.append(root);
      createRoot(root).render(React.createElement('div'));
    `,
  },
];

const gz = (buf) => gzipSync(buf).length;
const kb = (bytes) => (bytes == null ? '?' : `${(bytes / 1024).toFixed(1)} kB`);

async function measure(target) {
  const dir = join(tmpdir(), `lit-pigeon-bench-${target.id}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ name: `bench-${target.id}`, private: true, dependencies: { ...target.deps, esbuild: ESBUILD } }, null, 2),
  );
  writeFileSync(join(dir, 'entry.js'), target.entry);
  execFileSync('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error', '--legacy-peer-deps'], {
    cwd: dir,
    stdio: 'inherit',
  });

  const require = createRequire(join(dir, 'package.json'));
  const esbuild = require('esbuild');
  const { metafile } = await esbuild.build({
    absWorkingDir: dir,
    entryPoints: ['entry.js'],
    bundle: true,
    minify: true,
    splitting: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    outdir: 'out',
    metafile: true,
    logLevel: 'error',
    define: { 'process.env.NODE_ENV': '"production"', global: 'globalThis' },
    loader: Object.fromEntries(
      ['.png', '.svg', '.gif', '.jpg', '.woff', '.woff2', '.ttf', '.eot'].map((ext) => [ext, 'file']),
    ),
  });

  const outputs = metafile.outputs;
  const size = (path) => gz(readFileSync(join(dir, path)));
  const entryPath = Object.keys(outputs).find((p) => outputs[p].entryPoint);

  // Initial JS = the entry chunk plus every chunk it imports statically.
  // Chunks reached only through dynamic import() are lazy and excluded.
  const initial = new Set();
  const walk = (path) => {
    if (initial.has(path)) return;
    initial.add(path);
    for (const imp of outputs[path].imports) {
      if (imp.kind === 'import-statement' && outputs[imp.path]) walk(imp.path);
    }
  };
  walk(entryPath);

  const jsPaths = Object.keys(outputs).filter((p) => p.endsWith('.js'));
  const cssPath = outputs[entryPath].cssBundle;
  const versions = Object.fromEntries(
    Object.keys(target.deps).map((name) => [
      name,
      JSON.parse(readFileSync(join(dir, 'node_modules', name, 'package.json'), 'utf8')).version,
    ]),
  );

  let cdn;
  if (target.cdn) {
    try {
      const res = await fetch(target.cdn);
      cdn = { url: target.cdn, gzip: res.ok ? gz(Buffer.from(await res.arrayBuffer())) : null, status: res.status };
    } catch (err) {
      cdn = { url: target.cdn, gzip: null, error: String(err.cause?.code ?? err.message) };
    }
  }

  return {
    id: target.id,
    label: target.label,
    versions,
    initialJsGzip: [...initial].reduce((sum, p) => sum + size(p), 0),
    allJsGzip: jsPaths.reduce((sum, p) => sum + size(p), 0),
    initialCssGzip: cssPath ? size(cssPath) : 0,
    ...(cdn ? { cdn } : {}),
  };
}

const only = process.argv.slice(2);
const results = [];
for (const target of TARGETS.filter((t) => only.length === 0 || only.includes(t.id))) {
  console.error(`\n→ ${target.id}`);
  results.push(await measure(target));
}

const here = dirname(fileURLToPath(import.meta.url));
writeFileSync(
  join(here, 'results.json'),
  JSON.stringify({ date: new Date().toISOString().slice(0, 10), node: process.version, esbuild: ESBUILD, results }, null, 2) + '\n',
);

console.log('\n| Target | Versions | Initial JS (gzip) | All JS incl. lazy (gzip) | Initial CSS (gzip) |');
console.log('| --- | --- | ---: | ---: | ---: |');
for (const r of results) {
  const versions = Object.entries(r.versions).map(([n, v]) => `${n}@${v}`).join(', ');
  console.log(`| ${r.label} | ${versions} | ${kb(r.initialJsGzip)} | ${kb(r.allJsGzip)} | ${kb(r.initialCssGzip)} |`);
  if (r.cdn) console.log(`|  ↳ plus \`${r.cdn.url}\` at runtime | | ${kb(r.cdn.gzip)} | | |`);
}

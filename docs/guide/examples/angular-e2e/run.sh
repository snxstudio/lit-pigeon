#!/usr/bin/env bash
# Builds the angular.md examples inside a fresh Angular 22 application, using
# `pnpm pack` tarballs of this checkout, then drives the production build in
# headless Chromium and checks the theming example's CSS. Usage, from the
# repository root after `pnpm build`:
#
#   docs/guide/examples/angular-e2e/run.sh
#
# Needs Node >= 22.22.3 or >= 24.15 (Angular CLI 22) and npm 11. Set CHROMIUM
# to an existing Chromium binary to skip `playwright install chromium`, and
# WORK to reuse a directory.
set -euo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
REPO=$(cd "$HERE/../../../.." && pwd)
EXAMPLES="$HERE/../src/angular"
WORK=${WORK:-$(mktemp -d)}
PORT=${PORT:-4310}
echo "working in $WORK"

mkdir -p "$WORK/tarballs"
for pkg in core editor parser-mjml renderer-mjml angular; do
  (cd "$REPO/packages/$pkg" && pnpm pack --pack-destination "$WORK/tarballs" >/dev/null)
done

cd "$WORK"
rm -rf ng-app
npx -y @angular/cli@22 new ng-app --defaults --routing --style=css --skip-git --ssr=false --skip-install
cd ng-app

# The documented package.json override, applied before the first install.
node -e '
  const fs = require("fs");
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  Object.assign(pkg, JSON.parse(fs.readFileSync(process.argv[1], "utf8")));
  fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));
' "$EXAMPLES/package-overrides.json"
npm install
npm install "$WORK"/tarballs/*.tgz @angular/material@^22.2.0 @angular/cdk@^22.2.0

# The documented angular.json settings, plus the Material theme.
node -e '
  const fs = require("fs");
  const ng = JSON.parse(fs.readFileSync("angular.json", "utf8"));
  const target = ng.projects["ng-app"].architect;
  const commonJs = JSON.parse(fs.readFileSync(process.argv[1], "utf8")).projects["my-app"].architect;
  const dev = JSON.parse(fs.readFileSync(process.argv[2], "utf8")).projects["my-app"].architect;
  Object.assign(target.build.options, commonJs.build.options);
  target.build.options.styles = ["@angular/material/prebuilt-themes/azure-blue.css", "src/styles.css"];
  Object.assign(target.build.configurations.development, dev.build.configurations.development);
  target.serve.options = { ...(target.serve.options ?? {}), ...dev.serve.options };
  fs.writeFileSync("angular.json", JSON.stringify(ng, null, 2));
' "$EXAMPLES/angular-build-options.json" "$EXAMPLES/angular-dev-workaround.json"
printf 'html, body { height: 100%%; margin: 0; }\n' > src/styles.css

# The documented components, copied verbatim, plus a small harness.
rm -f src/app/app.spec.ts src/app/app.html src/app/app.css
for f in email-api.service.ts template-editor.component.ts editor-dialog.component.ts \
  editor-tabs.component.ts echo-binding.component.ts app.config.ts; do
  cp "$EXAMPLES/$f" src/app/
done
cp "$EXAMPLES/app.routes.ts" src/app/docs-routes.ts
cp "$HERE"/app/*.ts src/app/

npx ng build

cd "$WORK"
[ -d e2e ] || { mkdir e2e && (cd e2e && npm init -y >/dev/null && npm install playwright-core >/dev/null); }
if [ -z "${CHROMIUM:-}" ]; then (cd e2e && npx -y playwright install chromium); fi
cp "$HERE/server.mjs" "$HERE/run.mjs" "$HERE/theme-check.mjs" e2e/
PORT=$PORT node e2e/server.mjs "$WORK/ng-app/dist/ng-app/browser" &
SERVER=$!
trap 'kill $SERVER' EXIT
sleep 1
BASE="http://localhost:$PORT" node e2e/run.mjs
BASE="http://localhost:$PORT" THEME_CSS="$HERE/../src/theming/theme.css" node e2e/theme-check.mjs

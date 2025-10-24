#!/bin/bash
# Run in bash from repo root. Fixes VS Code pointing at /usr/local/bin/pwsh.
set -euo pipefail
set +H

echo "== Detect pwsh =="
REAL_PWSH="$(command -v pwsh || true)"
[ -n "$REAL_PWSH" ] || { echo "pwsh not found in PATH"; exit 2; }
echo "pwsh -> $REAL_PWSH"

echo "== Update VS Code settings profile =="
mkdir -p .vscode
node - <<'NODE'
const fs=require('fs'), p='.vscode/settings.json', real=process.env.REAL_PWSH;
const jp=x=>JSON.stringify(x,null,2);
let j={}; if(fs.existsSync(p)){ try{ j=JSON.parse(fs.readFileSync(p,'utf8')) }catch{} }
j["terminal.integrated.profiles.linux"]=Object.assign({}, j["terminal.integrated.profiles.linux"], {
  "PowerShell": { "path": real, "icon": "terminal-powershell" },
  "PowerShell (NoProfile)": { "path": real, "args": ["-NoProfile"], "icon": "terminal-powershell" }
});
j["terminal.integrated.defaultProfile.linux"]="PowerShell";
j["chat.tools.terminal.terminalProfile.linux"]="PowerShell";
j["terminal.integrated.inheritEnv"]=true;
fs.writeFileSync(p, jp(j));
console.log("Wrote .vscode/settings.json");
NODE

echo "== Patch workspace refs to hardcoded /usr/local/bin/pwsh (non-destructive) =="
# Only adjust VS Code/task configs in repo; skip node_modules
rg --hidden -n "/usr/local/bin/pwsh" .vscode tasks.json launch.json .github scripts 2>/dev/null || true
if rg --hidden -l "/usr/local/bin/pwsh" .vscode tasks.json launch.json .github scripts 2>/dev/null | grep -q .; then
  rg --hidden -l "/usr/local/bin/pwsh" .vscode tasks.json launch.json .github scripts \
    | xargs -I{} sed -i.bak "s#/usr/local/bin/pwsh#${REAL_PWSH//\//\\/}#g" {}
  echo "Patched files now reference: $REAL_PWSH"
fi

echo "== Optional: create fallback symlink =="
if [ ! -e /usr/local/bin/pwsh ] && [ -w /usr/local/bin ]; then
  ln -sf "$REAL_PWSH" /usr/local/bin/pwsh && echo "Symlinked /usr/local/bin/pwsh -> $REAL_PWSH" || true
else
  echo "Skipping symlink (exists or no write perms)."
fi

echo "== Smoke test (NoProfile) =="
"$REAL_PWSH" -NoProfile -Command 'Write-Host PWSH_OK' || { echo "pwsh failed even with -NoProfile"; exit 1; }

echo ""
echo "✅ Done. Open a NEW terminal in VS Code. If needed, use profile: 'PowerShell (NoProfile)'."
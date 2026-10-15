// chrome.mjs: the headless Chrome used by renders and stills. The first existing candidate wins, so a cleared cache
// (puppeteer or Playwright) does not break the tools. Override with CBM_CHROME=/path/to/chrome-headless-shell.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const H = os.homedir();
const globHeadless = (dir) => {
  try {
    return fs.readdirSync(dir).filter((d) => /chrom(e|ium)[-_]headless[-_]shell/.test(d) || /^mac_arm/.test(d)).sort().reverse()
      .flatMap((d) => [path.join(dir, d, 'chrome-headless-shell-mac-arm64/chrome-headless-shell'),
        path.join(dir, d, 'chrome-mac/headless_shell'), path.join(dir, d, 'chrome-headless-shell-mac-arm64', 'chrome-headless-shell')]);
  } catch { return []; }
};
const candidates = [
  process.env.CBM_CHROME,
  ...globHeadless(path.join(H, '.cache/puppeteer/chrome-headless-shell')),
  ...globHeadless(path.join(H, 'Library/Caches/ms-playwright')),
].filter(Boolean);
export const chrome = candidates.find((p) => fs.existsSync(p));
if (!chrome) throw new Error(`no headless Chrome found; tried:\n${candidates.join('\n')}\nset CBM_CHROME`);

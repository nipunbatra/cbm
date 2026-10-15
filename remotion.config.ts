// Remotion CLI config (Studio and CLI renders). tools/render.mjs drives the final renders with the same settings.
import { Config } from '@remotion/cli/config';
import os from 'node:os';
import path from 'node:path';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(94);
Config.setConcurrency(8);
const shell = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/mac_arm-148.0.7778.97/chrome-headless-shell-mac-arm64/chrome-headless-shell');
Config.setBrowserExecutable(process.env.REMOTION_CHROME || shell);
Config.setCachingEnabled(false);

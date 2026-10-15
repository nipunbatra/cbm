// Holds the first render until the text and KaTeX fonts are available (layout depends on them).
import { useEffect, useState } from 'react';
import { continueRender, delayRender } from 'remotion';
import 'katex/dist/katex.min.css';

let ready = false;
let promise: Promise<void> | null = null;

const FACES = [
  '500 20px "Avenir Next"', '600 20px "Avenir Next"', '700 20px "Avenir Next"', '400 20px "Avenir Next"',
  '400 20px "JetBrains Mono"', '600 20px "JetBrains Mono"',
  '400 20px KaTeX_Main', 'italic 400 20px KaTeX_Math', '700 20px KaTeX_Main', '400 20px KaTeX_Size1', '400 20px KaTeX_Size2',
  '400 20px KaTeX_Size3', '400 20px KaTeX_Size4', '400 20px KaTeX_AMS', 'italic 400 20px KaTeX_Main',
];

export function loadFonts(): Promise<void> {
  if (!promise) {
    promise = Promise.all(FACES.map((f) => document.fonts.load(f, 'Ax0√∑'))).then(() => document.fonts.ready).then(() => {
      ready = true;
    });
  }
  return promise;
}

export function useFontsReady(): boolean {
  const [ok, setOk] = useState(ready);
  const [handle] = useState(() => (ready ? null : delayRender('fonts')));
  useEffect(() => {
    if (ready) return;
    loadFonts().then(() => {
      setOk(true);
      if (handle !== null) continueRender(handle);
    });
  }, [handle]);
  return ok;
}

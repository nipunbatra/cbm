// Entry point of the lecture deck (bundled by tools/deck.mjs).
import React from 'react';
// @ts-expect-error react-dom ships no types in this workspace
import { createRoot } from 'react-dom/client';
import { Deck, PrintAll } from './Deck';

const q = new URLSearchParams(location.search);
createRoot(document.getElementById('root')!).render(q.has('print') ? <PrintAll only={q.get('only') ?? undefined} step={q.get('step') ? Number(q.get('step')) : undefined} /> : <Deck />);

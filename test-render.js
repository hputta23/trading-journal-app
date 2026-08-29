import React from 'react';
import { renderToString } from 'react-dom/server';
import CapitalView from './src/components/CapitalView.jsx';

const allTrades = {};
const allJournals = { '2026-08-29': { mood: 'Good' } };
const settings = {};

try {
  const html = renderToString(
    React.createElement(CapitalView, { allTrades, allJournals, settings })
  );
  console.log("Rendered OK");
} catch (e) {
  console.error("Render failed", e);
}

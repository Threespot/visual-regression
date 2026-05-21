const fs = require('fs');
const path = require('path');

const MARKER_START = '<!-- vrt:customize -->';
const MARKER_END = '<!-- vrt:customize-end -->';

const CUSTOM_CSS = `
:root { --gap: 20px; }
body { max-width: none; }
.test-result video,
.test-result img.screenshot {
  box-shadow: none;
  border: 1px solid #ddd;
  display: block;
  max-width: 100%;
}
.chip-body {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap);
}
.chip-body > div {
  width: calc(33.33% - var(--gap) * 0.6667);
}
`;

// Playwright's Chip component starts expanded with no persistence. We click the
// "Test Steps" chip header once on first appearance to collapse it, marking the
// element so we don't fight the user if they re-expand it.
const CUSTOM_SCRIPT = `
(function () {
  function collapseTestSteps() {
    document.querySelectorAll('.chip-header.expanded-true').forEach(function (el) {
      if (el.dataset.vrtCollapsed) return;
      if (el.textContent.trim().indexOf('Test Steps') === 0) {
        el.dataset.vrtCollapsed = '1';
        el.click();
      }
    });
  }
  new MutationObserver(collapseTestSteps).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  collapseTestSteps();
})();
`;

function buildInjection() {
  return (
    MARKER_START +
    '<style>' +
    CUSTOM_CSS +
    '</style>' +
    '<script>' +
    CUSTOM_SCRIPT +
    '</script>' +
    MARKER_END
  );
}

function customizeReport(reportDir) {
  const indexPath = path.join(reportDir, 'index.html');
  if (!fs.existsSync(indexPath)) return false;

  let html = fs.readFileSync(indexPath, 'utf8');
  const existing = new RegExp(
    MARKER_START.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') +
      '[\\s\\S]*?' +
      MARKER_END.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  );
  html = html.replace(existing, '');

  const injection = buildInjection();
  if (html.includes('</head>')) {
    html = html.replace('</head>', injection + '</head>');
  } else {
    html += injection;
  }

  fs.writeFileSync(indexPath, html);
  return true;
}

module.exports = { customizeReport };

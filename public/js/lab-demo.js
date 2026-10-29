/**
 * CampusFind - Web Programming Lab Demonstration Module
 * Interactive examples for client-side scripting, callbacks vs promises vs async/await,
 * closures, event handling, safe DOM manipulation, and CSS selectors.
 */

document.addEventListener('DOMContentLoaded', () => {
  setupCallbackDemo();
  setupClosureDemo();
  setupDomSafetyDemo();
  setupKeyboardDemo();
  setupCssSelectorDemo();
  setupEventLoopDemo();
});

// ============================================================================
// 1. ASYNCHRONOUS JAVASCRIPT: Callbacks vs Promises vs Async/Await
// ============================================================================
function setupCallbackDemo() {
  const logConsole = document.getElementById('async-log-console');
  const btnHell = document.getElementById('btn-run-callback-hell');
  const btnPromise = document.getElementById('btn-run-promise');
  const btnAsync = document.getElementById('btn-run-async');
  const btnClear = document.getElementById('btn-clear-async-log');

  const log = (msg, type = 'info') => {
    if (!logConsole) return;
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = `[${time}] ${msg}`;
    logConsole.appendChild(entry);
    logConsole.scrollTop = logConsole.scrollHeight;
  };

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (logConsole) logConsole.innerHTML = '<div class="log-entry text-muted">Console cleared. Ready for execution.</div>';
    });
  }

  // Demonstration A: Nested Callbacks ("Callback Hell")
  if (btnHell) {
    btnHell.addEventListener('click', () => {
      log('Starting Callback Hell demo...', 'info');
      // Step 1: Verify User
      verifyUserCallback('Student#102', (err1, user) => {
        if (err1) return log(`Error 1: ${err1}`, 'error');
        log(`1. Callback Step 1: User verified (${user.name})`, 'success');

        // Step 2: Fetch Lost Report
        fetchReportCallback(user.id, (err2, report) => {
          if (err2) return log(`Error 2: ${err2}`, 'error');
          log(`2. Callback Step 2: Found Report (#${report.reportId}: ${report.item})`, 'success');

          // Step 3: Match Claim
          matchClaimCallback(report.reportId, (err3, claim) => {
            if (err3) return log(`Error 3: ${err3}`, 'error');
            log(`3. Callback Step 3: Claim verified! Pyramid of Doom completed.`, 'success');
            log('Notice: Deep nesting, difficult error handling, inverted control flow.', 'warning');
          });
        });
      });
    });
  }

  // Demonstration B: Promises (.then chain)
  if (btnPromise) {
    btnPromise.addEventListener('click', () => {
      log('Starting Promise Chain (.then) demo...', 'info');
      verifyUserPromise('Student#102')
        .then((user) => {
          log(`1. Promise: Verified ${user.name}`, 'success');
          return fetchReportPromise(user.id);
        })
        .then((report) => {
          log(`2. Promise: Retrieved item ${report.item}`, 'success');
          return matchClaimPromise(report.reportId);
        })
        .then((claim) => {
          log(`3. Promise: Claim status is ${claim.status}`, 'success');
          log('Flat chain, single centralized .catch() error handler.', 'info');
        })
        .catch((err) => {
          log(`Promise Caught Error: ${err.message}`, 'error');
        });
    });
  }

  // Demonstration C: Modern Async / Await
  if (btnAsync) {
    btnAsync.addEventListener('click', async () => {
      log('Starting Async/Await demo...', 'info');
      try {
        const user = await verifyUserPromise('Student#102');
        log(`1. Async/Await: User verified (${user.name})`, 'success');

        const report = await fetchReportPromise(user.id);
        log(`2. Async/Await: Loaded report for ${report.item}`, 'success');

        const claim = await matchClaimPromise(report.reportId);
        log(`3. Async/Await: Claim verified! Reads synchronously like standard code.`, 'success');
      } catch (err) {
        log(`Async/Await Caught Error: ${err.message}`, 'error');
      }
    });
  }
}

// Simulated Async Services
function verifyUserCallback(id, cb) {
  setTimeout(() => cb(null, { id, name: 'Alex Morgan' }), 400);
}
function fetchReportCallback(userId, cb) {
  setTimeout(() => cb(null, { reportId: 'REP-502', item: 'TI-84 Calculator' }), 400);
}
function matchClaimCallback(reportId, cb) {
  setTimeout(() => cb(null, { claimId: 'CLM-901', status: 'Approved' }), 400);
}

function verifyUserPromise(id) {
  return new Promise((resolve) => setTimeout(() => resolve({ id, name: 'Alex Morgan' }), 400));
}
function fetchReportPromise(userId) {
  return new Promise((resolve) => setTimeout(() => resolve({ reportId: 'REP-502', item: 'TI-84 Calculator' }), 400));
}
function matchClaimPromise(reportId) {
  return new Promise((resolve) => setTimeout(() => resolve({ claimId: 'CLM-901', status: 'Approved' }), 400));
}

// ============================================================================
// 2. CLOSURES & SCOPE DEMONSTRATION
// ============================================================================
function setupClosureDemo() {
  // Closure Factory: creates an isolated state counter with private variable
  function createCounter(initialValue = 0) {
    let count = initialValue; // Private variable enclosed in lexical scope
    return {
      increment() {
        count += 1;
        return count;
      },
      decrement() {
        count -= 1;
        return count;
      },
      getValue() {
        return count;
      }
    };
  }

  const counterA = createCounter(0);
  const counterB = createCounter(100);

  const valA = document.getElementById('counter-a-val');
  const btnIncA = document.getElementById('btn-counter-a-inc');
  const btnDecA = document.getElementById('btn-counter-a-dec');

  const valB = document.getElementById('counter-b-val');
  const btnIncB = document.getElementById('btn-counter-b-inc');
  const btnDecB = document.getElementById('btn-counter-b-dec');

  if (btnIncA && valA) {
    btnIncA.addEventListener('click', () => { valA.textContent = counterA.increment(); });
    btnDecA.addEventListener('click', () => { valA.textContent = counterA.decrement(); });
  }

  if (btnIncB && valB) {
    btnIncB.addEventListener('click', () => { valB.textContent = counterB.increment(); });
    btnDecB.addEventListener('click', () => { valB.textContent = counterB.decrement(); });
  }
}

// ============================================================================
// 3. SAFE DOM MANIPULATION & XSS PREVENTION DEMONSTRATION
// ============================================================================
function setupDomSafetyDemo() {
  const input = document.getElementById('xss-input');
  const btnUnsafe = document.getElementById('btn-render-unsafe');
  const btnSafe = document.getElementById('btn-render-safe');
  const outputWrap = document.getElementById('dom-render-output');

  if (btnUnsafe && outputWrap && input) {
    btnUnsafe.addEventListener('click', () => {
      const raw = input.value;
      // UNSAFE: directly assigned to innerHTML allows injected script execution
      outputWrap.innerHTML = `
        <div style="border: 2px solid var(--color-danger); padding: 0.75rem; border-radius: 4px; background: #FFF5F5;">
          <strong>Vulnerable innerHTML Output:</strong>
          <div style="margin-top: 0.35rem;">${raw}</div>
        </div>
      `;
    });
  }

  if (btnSafe && outputWrap && input) {
    btnSafe.addEventListener('click', () => {
      const raw = input.value;
      // SAFE: using textContent and createElement prevents interpretation of HTML/script tags
      outputWrap.innerHTML = '';
      const safeBox = document.createElement('div');
      safeBox.style.border = '2px solid var(--color-success)';
      safeBox.style.padding = '0.75rem';
      safeBox.style.borderRadius = '4px';
      safeBox.style.background = '#F0FAF4';

      const title = document.createElement('strong');
      title.textContent = 'Safe DOM Insertion (Escaped textContent):';

      const content = document.createElement('div');
      content.style.marginTop = '0.35rem';
      content.textContent = raw; // Safely sets textContent

      safeBox.appendChild(title);
      safeBox.appendChild(content);
      outputWrap.appendChild(safeBox);
    });
  }
}

// ============================================================================
// 4. KEYBOARD & MOUSE EVENTS DEMONSTRATION
// ============================================================================
function setupKeyboardDemo() {
  const keyDisplay = document.getElementById('keyboard-event-display');
  const testInput = document.getElementById('keyboard-test-input');

  if (testInput && keyDisplay) {
    testInput.addEventListener('keydown', (e) => {
      keyDisplay.innerHTML = `
        <span>Key: <strong>${e.key}</strong></span> |
        <span>Code: <strong>${e.code}</strong></span> |
        <span>AltKey: <strong>${e.altKey}</strong></span> |
        <span>CtrlKey: <strong>${e.ctrlKey}</strong></span>
      `;
    });
  }
}

// ============================================================================
// 5. CSS SELECTOR INTERACTIVE INSPECTOR
// ============================================================================
function setupCssSelectorDemo() {
  const buttons = document.querySelectorAll('.btn-selector-test');
  const sandbox = document.getElementById('selector-sandbox');

  if (sandbox) {
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        // Clear previous highlights
        sandbox.querySelectorAll('.highlight-test').forEach((el) => {
          el.classList.remove('highlight-test');
        });

        const selector = btn.dataset.selector;
        const matches = sandbox.querySelectorAll(selector);
        matches.forEach((m) => m.classList.add('highlight-test'));

        const matchCountEl = document.getElementById('selector-match-count');
        if (matchCountEl) {
          matchCountEl.textContent = `Matched ${matches.length} elements using selector: "${selector}"`;
        }
      });
    });
  }
}

// ============================================================================
// 6. NODE.JS EVENT LOOP SIMULATOR (Browser UI representation)
// ============================================================================
function setupEventLoopDemo() {
  const btnRun = document.getElementById('btn-run-event-loop-sim');
  const simConsole = document.getElementById('event-loop-sim-console');

  if (btnRun && simConsole) {
    btnRun.addEventListener('click', () => {
      simConsole.innerHTML = '';
      const push = (step, title, type) => {
        const item = document.createElement('div');
        item.style.padding = '0.4rem 0.6rem';
        item.style.marginBottom = '0.3rem';
        item.style.borderRadius = '3px';
        item.style.fontSize = '0.85rem';

        if (type === 'sync') {
          item.style.background = '#E8F0FE';
          item.style.borderLeft = '3px solid #1967D2';
        } else if (type === 'micro') {
          item.style.background = '#FEF7EC';
          item.style.borderLeft = '3px solid #B7791F';
        } else {
          item.style.background = '#EAF5EF';
          item.style.borderLeft = '3px solid #287D55';
        }

        item.innerHTML = `<strong>Step ${step}:</strong> ${title}`;
        simConsole.appendChild(item);
      };

      // 1. Synchronous Code
      push(1, 'Synchronous Call Stack - Statement 1 executed immediately', 'sync');

      // 2. Macrotask (Timers Phase)
      setTimeout(() => {
        push(4, 'Macrotask Queue (setTimeout 0ms) - Executed in Timers phase of Event Loop', 'macro');
      }, 0);

      // 3. Microtask (Promise Queue)
      Promise.resolve().then(() => {
        push(3, 'Microtask Queue (Promise.then) - Drained immediately when Call Stack emptied', 'micro');
      });

      // 4. Synchronous Statement 2
      push(2, 'Synchronous Call Stack - Statement 2 executed before Event Loop takes next turn', 'sync');
    });
  }
}

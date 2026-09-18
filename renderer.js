const DEFAULT_SETTINGS = {
  tickers: ['KO', 'JNJ', 'IBM', 'V'],
  holdings: { KO: { shares: 120, cost: 58.4 }, JNJ: { shares: 42, cost: 154.2 } }
};
const ROTATION_SECONDS = 60;
const YAHOO_REFRESH_MS = 10000;
const monitorIndex = window.tickerWall.monitorIndex;
let settings = loadSettings();
let rotationIndex = monitorIndex % settings.tickers.length;
let secondsLeft = ROTATION_SECONDS;
let currentQuote = null;
let yahooRefreshTimer = null;

const $ = (selector) => document.querySelector(selector);
function loadSettings() {
  try { return JSON.parse(localStorage.getItem('tickerwall-settings')) || structuredClone(DEFAULT_SETTINGS); }
  catch { return structuredClone(DEFAULT_SETTINGS); }
}
function persist() {
  localStorage.setItem('tickerwall-settings', JSON.stringify(settings));
  window.tickerWall.saveSettings(settings);
}
function money(value) { return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value); }
function activeTicker() { return settings.tickers[rotationIndex % settings.tickers.length]; }
function setStatus(label) { $('#market-status').textContent = label; }

async function requestQuote(ticker) {
  // Yahoo's public chart endpoint supplies delayed market data without an API key.
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=1m`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Ticker not found');
  const result = (await response.json()).chart.result?.[0];
  if (!result?.meta?.regularMarketPrice) throw new Error('No market data');
  const meta = result.meta;
  return { ticker, name: meta.longName || meta.shortName || ticker, price: meta.regularMarketPrice, previous: meta.chartPreviousClose || meta.previousClose };
}

async function displayQuote() {
  if (!settings.tickers.length) return;
  const ticker = activeTicker();
  $('#symbol').textContent = ticker;
  $('#company').textContent = 'FETCHING QUOTE';
  $('#price').textContent = '—';
  try {
    currentQuote = await requestQuote(ticker);
    if (ticker !== activeTicker()) return;
    renderQuote();
    setStatus('YAHOO FINANCE · REFRESHING');
  } catch {
    $('#company').textContent = 'QUOTE UNAVAILABLE';
    $('#price').textContent = '—';
    $('#change').textContent = 'Check your connection or ticker symbol';
    $('#change').classList.add('negative');
    $('#holding-card').classList.add('hidden');
    setStatus('MARKET DATA OFFLINE');
  }
  $('#position').textContent = `${String(rotationIndex % settings.tickers.length + 1).padStart(2, '0')} / ${String(settings.tickers.length).padStart(2, '0')}`;
}
function renderQuote() {
  if (!currentQuote) return;
  const { price, previous, name } = currentQuote;
  const change = price - previous;
  const percentage = previous ? (change / previous) * 100 : 0;
  $('#company').textContent = name.toUpperCase();
  $('#price').textContent = money(price);
  const changeElement = $('#change');
  changeElement.textContent = `${change >= 0 ? '+' : '−'}$${money(Math.abs(change))}  (${change >= 0 ? '+' : ''}${percentage.toFixed(2)}%)`;
  changeElement.classList.toggle('negative', change < 0);
  renderHolding(price);
}
function startYahooRefresh() {
  clearInterval(yahooRefreshTimer);
  yahooRefreshTimer = setInterval(() => {
    if (settings.tickers.length) displayQuote();
  }, YAHOO_REFRESH_MS);
}
function renderHolding(price) {
  const holding = settings.holdings[activeTicker()];
  const card = $('#holding-card');
  if (!holding || !holding.shares || !Number.isFinite(price)) return card.classList.add('hidden');
  const gain = (price - holding.cost) * holding.shares;
  const invested = holding.cost * holding.shares;
  card.classList.remove('hidden');
  $('#shares').textContent = `${holding.shares} shares · $${money(invested)} basis`;
  $('#gain').textContent = `${gain >= 0 ? '+' : '−'}$${money(Math.abs(gain))}`;
  $('#gain').classList.toggle('negative', gain < 0);
  $('#gain-percent').textContent = `${gain >= 0 ? '+' : ''}${((gain / invested) * 100).toFixed(2)}%`;
}
function renderSettings() {
  const tickers = $('#ticker-list'); const holdings = $('#holding-list');
  tickers.innerHTML = ''; holdings.innerHTML = '';
  settings.tickers.forEach((ticker) => {
    const tickerRow = document.createElement('div'); tickerRow.className = 'ticker-item';
    tickerRow.innerHTML = `<strong>${ticker}</strong><span>Displayed on your wall</span><button class="remove" data-remove="${ticker}" aria-label="Remove ${ticker}">×</button>`;
    tickers.append(tickerRow);
    const holding = settings.holdings[ticker] || {};
    const holdingRow = document.createElement('div'); holdingRow.className = 'holding-item';
    holdingRow.innerHTML = `<strong>${ticker}</strong><label>SHARES <input data-field="shares" data-ticker="${ticker}" type="number" min="0" step="any" value="${holding.shares || ''}" placeholder="0" /></label><label>AVG COST $ <input data-field="cost" data-ticker="${ticker}" type="number" min="0" step="any" value="${holding.cost || ''}" placeholder="0.00" /></label>`;
    holdings.append(holdingRow);
  });
}
function updateClock() { $('#clock').textContent = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date()); }

$('#settings-dialog').addEventListener('close', () => { if ($('#settings-dialog').returnValue === 'save') { persist(); rotationIndex %= settings.tickers.length; displayQuote(); } });
$('.settings-trigger').addEventListener('click', () => { renderSettings(); $('#settings-dialog').showModal(); });
$('#add-ticker').addEventListener('click', () => {
  const input = $('#ticker-input'); const ticker = input.value.trim().toUpperCase();
  if (!/^[A-Z.]{1,10}$/.test(ticker)) { $('#ticker-message').textContent = 'Enter a valid ticker symbol (letters only).'; return; }
  if (settings.tickers.includes(ticker)) { $('#ticker-message').textContent = `${ticker} is already on your wall.`; return; }
  settings.tickers.push(ticker); input.value = ''; $('#ticker-message').textContent = `${ticker} added. Its quote will be verified on display.`; renderSettings();
});
$('#ticker-list').addEventListener('click', (event) => {
  const ticker = event.target.dataset.remove; if (!ticker || settings.tickers.length === 1) return;
  settings.tickers = settings.tickers.filter((item) => item !== ticker); delete settings.holdings[ticker]; renderSettings();
});
$('#holding-list').addEventListener('input', (event) => {
  const { ticker, field } = event.target.dataset; if (!ticker) return;
  settings.holdings[ticker] ||= { shares: 0, cost: 0 };
  settings.holdings[ticker][field] = Number(event.target.value) || 0;
});
$('#reset-demo').addEventListener('click', () => { settings = structuredClone(DEFAULT_SETTINGS); renderSettings(); });
window.addEventListener('keydown', (event) => { if ((event.metaKey || event.ctrlKey) && event.key === ',') { event.preventDefault(); renderSettings(); $('#settings-dialog').showModal(); } if (event.key === 'Escape' && !$('#settings-dialog').open) window.tickerWall.exit(); });
window.tickerWall.onSettingsUpdated((next) => { settings = next; localStorage.setItem('tickerwall-settings', JSON.stringify(next)); rotationIndex %= settings.tickers.length; displayQuote(); });

setInterval(() => { secondsLeft -= 1; $('#rotation').textContent = `Next ticker in ${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`; if (secondsLeft === 0) { rotationIndex = (rotationIndex + 1) % settings.tickers.length; secondsLeft = ROTATION_SECONDS; displayQuote(); } }, 1000);
setInterval(updateClock, 1000); updateClock(); startYahooRefresh(); displayQuote();

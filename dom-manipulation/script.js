let quotes = JSON.parse(localStorage.getItem('quotes')) || [];
const quoteContainer = document.getElementById('quoteContainer');
const quoteForm = document.getElementById('quoteForm');
const quoteInput = document.getElementById('quoteInput');
const authorInput = document.getElementById('authorInput');
const categoryInput = document.getElementById('categoryInput');
const categoryFilter = document.getElementById('categoryFilter');

// Server Sync Interval (mocked)
setInterval(syncQuotes, 30000); // every 30 seconds

quoteForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const quoteText = quoteInput.value.trim();
  const author = authorInput.value.trim();
  const category = categoryInput.value.trim();

  if (!quoteText || !author || !category) return;

  const quote = {
    id: Date.now(),
    text: quoteText,
    author,
    category,
    updatedAt: new Date().toISOString(),
  };

  quotes.push(quote);
  saveQuotes();
  displayQuotes();
  populateCategories();
  postQuoteToServer(quote);

  quoteForm.reset();
});

function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

function displayQuotes() {
  quoteContainer.innerHTML = '';
  const selectedCategory = localStorage.getItem('selectedCategory') || 'all';

  const filteredQuotes = selectedCategory === 'all'
    ? quotes
    : quotes.filter((q) => q.category === selectedCategory);

  filteredQuotes.forEach((quote) => {
    const div = document.createElement('div');
    div.className = 'quote';
    div.innerHTML = `
      <p>"${quote.text}"</p>
      <p>- ${quote.author} (${quote.category})</p>
      <button onclick="removeQuote(${quote.id})">Remove</button>
    `;
    quoteContainer.appendChild(div);
  });
}

function removeQuote(id) {
  quotes = quotes.filter((q) => q.id !== id);
  saveQuotes();
  displayQuotes();
}

function populateCategories() {
  const categories = [...new Set(quotes.map((q) => q.category))];
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });
  categoryFilter.value = localStorage.getItem('selectedCategory') || 'all';
}

function filterQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem('selectedCategory', selected);
  displayQuotes();
}

function exportToJson() {
  const blob = new Blob([JSON.stringify(quotes)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'quotes.json';
  link.click();
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (e) {
    const importedQuotes = JSON.parse(e.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    displayQuotes();
    populateCategories();
    alert('Quotes imported successfully!');
  };
  fileReader.readAsText(event.target.files[0]);
}

// --- Server Sync Functions ---

async function fetchQuotesFromServer() {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
  const data = await res.json();
  return data.map((d) => ({
    id: d.id,
    text: d.title,
    author: `ServerUser${d.userId}`,
    category: 'Server',
    updatedAt: new Date().toISOString(),
  }));
}

async function postQuoteToServer(quote) {
  await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quote),
  });
}

async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();

  let hasConflict = false;
  serverQuotes.forEach((sQuote) => {
    const existing = quotes.find((q) => q.id === sQuote.id);
    if (!existing) {
      quotes.push(sQuote);
    } else if (new Date(sQuote.updatedAt) > new Date(existing.updatedAt)) {
      Object.assign(existing, sQuote);
      hasConflict = true;
    }
  });

  if (hasConflict) {
    notifyUser('Conflicts resolved. Server data was used.');
  }

  saveQuotes();
  displayQuotes();
  populateCategories();
}

function notifyUser(message) {
  const div = document.createElement('div');
  div.className = 'notification';
  div.textContent = message;
  document.body.prepend(div);
  setTimeout(() => div.remove(), 5000);
}

// Init
window.addEventListener('DOMContentLoaded', () => {
  populateCategories();
  displayQuotes();
  filterQuotes();
  syncQuotes();
});

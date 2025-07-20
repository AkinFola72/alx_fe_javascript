let quotes = [];
const SYNC_INTERVAL = 30000; // 30 seconds
const SERVER_KEY = 'mockServerQuotes'; // Simulated server data key

// DOM references
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteButton = document.getElementById('newQuote');
const categoryFilter = document.getElementById('categoryFilter');
const addQuoteButton = document.getElementById('addQuoteBtn');
const importFile = document.getElementById('importFile');
const exportBtn = document.getElementById('exportBtn');

// Load quotes from localStorage
function loadQuotes() {
  const storedQuotes = localStorage.getItem('quotes');
  if (storedQuotes) {
    quotes = JSON.parse(storedQuotes);
  } else {
    quotes = [
      { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
      { text: "Life is really simple, but we insist on making it complicated.", category: "Philosophy" },
      { text: "If you judge people, you have no time to love them.", category: "Compassion" },
      { text: "In the middle of difficulty lies opportunity.", category: "Motivation" }
    ];
    saveQuotes();
  }
}

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
  simulateServerSave(); // Sync to server
}

// Simulate server-side storage with sessionStorage
function simulateServerSave() {
  sessionStorage.setItem(SERVER_KEY, JSON.stringify(quotes));
}

// Simulate server fetch
function simulateServerFetch() {
  const serverData = sessionStorage.getItem(SERVER_KEY);
  return serverData ? JSON.parse(serverData) : [];
}

// Sync local data with server every 30s
function startDataSync() {
  setInterval(() => {
    const serverQuotes = simulateServerFetch();
    const localQuotes = JSON.stringify(quotes);
    const serverQuotesStr = JSON.stringify(serverQuotes);

    if (localQuotes !== serverQuotesStr) {
      quotes = serverQuotes;
      localStorage.setItem('quotes', serverQuotesStr);
      populateCategories();
      showConflictNotification();
    }
  }, SYNC_INTERVAL);
}

// Show notification of sync conflict
function showConflictNotification() {
  alert("Quote data was updated from the server due to a conflict.");
}

// Save selected category filter
function saveFilterPreference(category) {
  localStorage.setItem('selectedCategory', category);
}

function getSavedFilterPreference() {
  return localStorage.getItem('selectedCategory') || 'all';
}

// Populate category dropdown
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  const savedFilter = getSavedFilterPreference();
  categoryFilter.value = savedFilter;
}

function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  const filteredQuotes = selectedCategory === "all"
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available in this category.";
    return;
  }

  const randomQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
  quoteDisplay.textContent = `"${randomQuote.text}" — ${randomQuote.category}`;
  sessionStorage.setItem('lastQuote', JSON.stringify(randomQuote));
}

function restoreLastViewedQuote() {
  const lastQuote = sessionStorage.getItem('lastQuote');
  if (lastQuote) {
    const q = JSON.parse(lastQuote);
    quoteDisplay.textContent = `"${q.text}" — ${q.category}`;
  }
}

function filterQuotes() {
  saveFilterPreference(categoryFilter.value);
  showRandomQuote();
}

function addQuote() {
  const quoteText = document.getElementById('newQuoteText').value.trim();
  const quoteCategory = document.getElementById('newQuoteCategory').value.trim();

  if (!quoteText || !quoteCategory) {
    alert("Please fill in both fields to add a quote.");
    return;
  }

  const newQuote = { text: quoteText, category: quoteCategory };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  alert("Quote added successfully!");

  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';
}

function exportQuotesToJson() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (!Array.isArray(importedQuotes)) throw new Error();
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      alert('Quotes imported successfully!');
    } catch {
      alert('Invalid JSON file.');
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

function createAddQuoteForm() {
  return true;
}

document.addEventListener('DOMContentLoaded', () => {
  loadQuotes();
  populateCategories();
  restoreLastViewedQuote();
  showRandomQuote();
  startDataSync();

  newQuoteButton.addEventListener('click', showRandomQuote);
  addQuoteButton.addEventListener('click', addQuote);
  exportBtn.addEventListener('click', exportQuotesToJson);
  importFile.addEventListener('change', importFromJsonFile);
  categoryFilter.addEventListener('change', filterQuotes);
});
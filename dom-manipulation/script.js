// Initial quotes array
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation", updatedAt: Date.now() },
  { text: "Life is really simple, but we insist on making it complicated.", category: "Philosophy", updatedAt: Date.now() },
  { text: "If you judge people, you have no time to love them.", category: "Compassion", updatedAt: Date.now() },
  { text: "In the middle of difficulty lies opportunity.", category: "Motivation", updatedAt: Date.now() }
];

// DOM Elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteButton = document.getElementById('newQuote');
const categorySelect = document.getElementById('categorySelect');
const categoryFilter = document.getElementById('categoryFilter');
const notification = document.getElementById('notification');

// Populate Categories
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categorySelect.innerHTML = '<option value="all">All</option>';
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const option1 = document.createElement('option');
    option1.value = cat;
    option1.textContent = cat;
    categorySelect.appendChild(option1);
    const option2 = document.createElement('option');
    option2.value = cat;
    option2.textContent = cat;
    categoryFilter.appendChild(option2);
  });
}

// Display Random Quote
function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  const filteredQuotes = selectedCategory === "all" ? quotes : quotes.filter(q => q.category === selectedCategory);
  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available in this category.";
    return;
  }
  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];
  quoteDisplay.textContent = `"${randomQuote.text}" — ${randomQuote.category}`;
  sessionStorage.setItem('lastViewedQuote', JSON.stringify(randomQuote));
}

// Add New Quote
function addQuote() {
  const quoteText = document.getElementById('newQuoteText').value.trim();
  const quoteCategory = document.getElementById('newQuoteCategory').value.trim();
  if (!quoteText || !quoteCategory) {
    alert("Please fill in both fields to add a quote.");
    return;
  }
  const newQuote = { text: quoteText, category: quoteCategory, updatedAt: Date.now() };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  postQuoteToServer(newQuote);
  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';
  alert("Quote added successfully!");
}

// Save to Local Storage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Filter Quotes
function filterQuotes() {
  const selectedCategory = categoryFilter.value;
  localStorage.setItem('lastSelectedCategory', selectedCategory);
  showRandomQuote();
}

// Notify User
function notifyUser(message) {
  notification.textContent = message;
  notification.style.display = 'block';
  setTimeout(() => { notification.style.display = 'none'; }, 3000);
}

// Fetch Quotes from Mock API
async function fetchQuotesFromServer() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=4');
    const data = await response.json();
    return data.map(post => ({ text: post.title, category: "Server", updatedAt: Date.now() }));
  } catch (error) {
    console.error("Error fetching quotes from server:", error);
    return [];
  }
}

// Post Quote to Mock API
async function postQuoteToServer(quote) {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      body: JSON.stringify(quote),
      headers: { 'Content-Type': 'application/json; charset=UTF-8' }
    });
    const data = await response.json();
    console.log("Quote posted to server:", data);
  } catch (error) {
    console.error("Error posting quote to server:", error);
  }
}

// Sync Quotes
async function syncQuotes() {
  try {
    const serverQuotes = await fetchQuotesFromServer();
    let updated = false;
    serverQuotes.forEach(serverQuote => {
      const exists = quotes.some(q => q.text === serverQuote.text);
      if (!exists) {
        quotes.push(serverQuote);
        updated = true;
      }
    });
    if (updated) {
      saveQuotes();
      populateCategories();
      notifyUser("Quotes synced with server!");
    }
  } catch (error) {
    console.error("Error syncing quotes:", error);
  }
}

// Import from JSON
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(event) {
    const importedQuotes = JSON.parse(event.target.result);
    quotes.push(...importedQuotes.map(q => ({ ...q, updatedAt: Date.now() })));
    saveQuotes();
    populateCategories();
    alert('Quotes imported successfully!');
  };
  fileReader.readAsText(event.target.files[0]);
}

// Export to JSON
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Initialization
window.addEventListener('DOMContentLoaded', () => {
  const savedFilter = localStorage.getItem('lastSelectedCategory');
  if (savedFilter) categoryFilter.value = savedFilter;
  populateCategories();
  showRandomQuote();
  syncQuotes();
  setInterval(syncQuotes, 30000); // Check for updates every 30 seconds
});

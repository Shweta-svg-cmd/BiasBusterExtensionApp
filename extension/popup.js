// Configuration
// IMPORTANT: Replace this URL with your actual deployed Render URL before using the extension
// Example: const API_URL = 'https://bias-detector.onrender.com';
const API_URL = 'https://your-render-url.onrender.com';

// DOM elements
let analyzeButton;
let openAppButton;
let result;
let loader;
let biasScoreValue;
let scoreBar;
let biasAnalysis;
let viewFullAnalysis;
let biasInfo;

// Initialize the popup
document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
  // Get DOM elements
  analyzeButton = document.getElementById('analyzeButton');
  openAppButton = document.getElementById('openAppButton');
  result = document.getElementById('result');
  loader = document.getElementById('loader');
  biasScoreValue = document.getElementById('biasScoreValue');
  scoreBar = document.getElementById('scoreBar');
  biasAnalysis = document.getElementById('biasAnalysis');
  viewFullAnalysis = document.getElementById('viewFullAnalysis');
  biasInfo = document.getElementById('biasInfo');
  
  // Add event listeners
  analyzeButton.addEventListener('click', analyzeCurrentPage);
  openAppButton.addEventListener('click', openFullApp);
  viewFullAnalysis.addEventListener('click', openFullApp);
  
  // Check if we have selected text from context menu
  checkForSelectedText();
}

// Check if there is text selected by context menu
async function checkForSelectedText() {
  try {
    const data = await chrome.storage.local.get('selectedText');
    
    if (data.selectedText) {
      // Analyze the selected text
      await analyzeArticle(null, data.selectedText);
      
      // Clear the storage
      await chrome.storage.local.remove('selectedText');
    }
  } catch (error) {
    console.error('Error checking for selected text:', error);
  }
}

// Analyze the current page
async function analyzeCurrentPage() {
  try {
    // Show loader and hide results
    showLoader();
    
    // Get the current tab URL
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    
    // Check if the URL is a news article
    if (!isNewsArticle(url)) {
      showError('This doesn\'t appear to be a news article. Try another page or select text to analyze.');
      return;
    }
    
    // Send URL to content script to extract text
    try {
      // Try to send message to existing content script
      const response = await sendMessageToContentScript(tab.id, { action: 'extractArticle' });
      
      if (response && response.text) {
        await analyzeArticle(url, response.text);
      } else {
        showError('Could not extract article content. Try selecting text to analyze.');
      }
    } catch (error) {
      // If content script communication failed, inject it
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        // Try sending the message again after injection
        const response = await sendMessageToContentScript(tab.id, { action: 'extractArticle' });
        
        if (response && response.text) {
          await analyzeArticle(url, response.text);
        } else {
          showError('Could not extract article content. Try selecting text to analyze.');
        }
      } catch (injectError) {
        showError('Cannot access this page. Try on a news article or select text to analyze.');
      }
    }
  } catch (error) {
    showError('Error: ' + error.message);
  }
}

// Send a message to the content script with promise wrapping
function sendMessageToContentScript(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, response => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

// Analyze article using the API
async function analyzeArticle(url, text) {
  try {
    showLoader();
    
    const response = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url, text })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    displayResults(data);
    
    // Save results to storage
    chrome.storage.local.set({ lastAnalysis: data });
    
  } catch (error) {
    showError('API Error: ' + error.message + '. Make sure the server is running.');
  } finally {
    hideLoader();
  }
}

// Display analysis results
function displayResults(data) {
  // Show result container
  result.style.display = 'block';
  biasInfo.classList.remove('hidden');
  
  // Update bias score
  biasScoreValue.textContent = data.biasScore;
  scoreBar.style.width = `${data.biasScore}%`;
  
  // Create analysis HTML
  let analysisHTML = '<h3>Key Findings:</h3><ul>';
  
  // Add biased phrases if available
  if (data.biasedPhrases && data.biasedPhrases.length > 0) {
    const phrases = data.biasedPhrases.slice(0, 3); // Show up to 3 phrases
    phrases.forEach(phrase => {
      analysisHTML += `<li><strong>${phrase.text}</strong>: ${phrase.explanation}</li>`;
    });
  } else {
    analysisHTML += `<li>${data.biasAnalysis || 'Overall analysis shows potential bias in this content.'}</li>`;
  }
  
  // If there's a multidimensional analysis
  if (data.multidimensionalAnalysis) {
    const { emotional, factual, political } = data.multidimensionalAnalysis;
    
    if (emotional !== undefined) {
      analysisHTML += `<li><strong>Emotional language</strong>: ${emotional}% intensity</li>`;
    }
    
    if (factual !== undefined) {
      analysisHTML += `<li><strong>Factual focus</strong>: ${factual}% objectivity</li>`;
    }
    
    if (political !== undefined) {
      analysisHTML += `<li><strong>Political leaning</strong>: ${political}% intensity</li>`;
    }
  }
  
  analysisHTML += '</ul>';
  biasAnalysis.innerHTML = analysisHTML;
}

// Open the full web application
function openFullApp() {
  chrome.tabs.create({ url: API_URL });
}

// Show error message
function showError(message) {
  hideLoader();
  result.style.display = 'block';
  biasInfo.classList.add('hidden');
  biasAnalysis.innerHTML = `<div class="error-message">${message}</div>`;
}

// Show loader
function showLoader() {
  loader.style.display = 'block';
  result.style.display = 'none';
}

// Hide loader
function hideLoader() {
  loader.style.display = 'none';
}

// Check if URL is likely a news article
function isNewsArticle(url) {
  // List of common news domains
  const newsDomainsPatterns = [
    'nytimes.com', 'washingtonpost.com', 'wsj.com', 'usatoday.com',
    'reuters.com', 'apnews.com', 'bbc.com', 'bbc.co.uk', 'theguardian.com',
    'cnn.com', 'foxnews.com', 'nbcnews.com', 'abcnews.go.com', 'cbsnews.com',
    'politico.com', 'thehill.com', 'npr.org', 'bloomberg.com', 'businessinsider.com',
    'forbes.com', 'huffpost.com', 'vox.com', 'slate.com', 'salon.com',
    'breitbart.com', 'dailycaller.com', 'newsmax.com', 'msnbc.com',
    'economist.com', 'aljazeera.com', 'time.com', 'latimes.com',
    'nymag.com', 'theatlantic.com', 'newyorker.com', 'thedailybeast.com',
    'motherjones.com', 'reason.com', 'nationalreview.com', 'theintercept.com',
    'axios.com', 'vice.com', 'theverge.com', 'wired.com'
  ];
  
  // Check if URL contains any of the news domains
  return newsDomainsPatterns.some(domain => url.includes(domain));
}
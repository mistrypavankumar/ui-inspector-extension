const inspectBtn = document.getElementById('inspect-btn');
const pickerBtn = document.getElementById('picker-btn');
const markupBtn = document.getElementById('markup-btn');
const status = document.getElementById('status');

inspectBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, {
    action: 'inspect-page',
    options: { colors: true, fonts: true, spacing: true, classes: true, borders: true, shadows: true, zindex: true },
  }, (response) => {
    if (chrome.runtime.lastError) {
      status.textContent = 'Reload the page and try again.';
      return;
    }
    status.textContent = response?.status || '';
    window.close();
  });
});

pickerBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'pick-element' }, (response) => {
    if (chrome.runtime.lastError) {
      status.textContent = 'Reload the page and try again.';
      return;
    }
    window.close();
  });
});

markupBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'start-markup' }, (response) => {
    if (chrome.runtime.lastError) {
      status.textContent = 'Reload the page and try again.';
      return;
    }
    window.close();
  });
});

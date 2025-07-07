function generateId() {
    return 'xxxxxx-xxxx-4xxx'.replace(/[x]/g, c =>
      (Math.random() * 16 | 0).toString(16)
    );
  }

let containers = [];
let currentView = 'box'; // 'box' or 'tree'

window.onload = () => {
  fetch('/api/containers')
    .then(res => res.json())
    .then(data => {
      containers = data;
      renderContainers();
    });

  document.getElementById('container-form').onsubmit = saveContainer;
  document.getElementById('search').oninput = () => renderContainers();
  
  // Add width slider functionality
  const widthSlider = document.getElementById('width-slider');
  const widthValue = document.getElementById('width-value');
  
  widthSlider.oninput = () => {
    const width = widthSlider.value;
    widthValue.textContent = width + '%';
    updateContainerWidth(width);
  };

  // Add icon picker functionality
  setupIconPicker();
};

function setupIconPicker() {
  const iconType = document.getElementById('icon-type');
  
  // Set initial selector
  updateIconSelector();
  
  // Initialize icon lists
  initializeIconLists();
}

function updateIconSelector() {
  const iconType = document.getElementById('icon-type');
  const iconPreview = document.getElementById('icon-preview');
  
  // Hide all selectors
  document.querySelectorAll('.icon-selector').forEach(selector => {
    selector.classList.add('hidden');
  });
  
  // Clear preview
  iconPreview.innerHTML = '';
  
  switch(iconType.value) {
    case 'emoji':
      document.getElementById('emoji-selector').classList.remove('hidden');
      break;
    case 'favicon':
    case 'url':
    case 'generative':
      document.getElementById('custom-input').classList.remove('hidden');
      const iconInput = document.getElementById('icon-input');
      if (iconType.value === 'favicon') {
        iconInput.placeholder = 'Enter URL (e.g., https://example.com)';
      } else if (iconType.value === 'generative') {
        iconInput.placeholder = 'Enter text for generation (e.g., server1, app)';
      } else {
        iconInput.placeholder = 'Enter image URL (e.g., https://example.com/icon.png)';
      }
      iconInput.addEventListener('input', updateIconPreview);
      break;
    case 'fontawesome':
      document.getElementById('fontawesome-selector').classList.remove('hidden');
      break;
    case 'simpleicons':
      document.getElementById('simpleicons-selector').classList.remove('hidden');
      break;
    case 'material':
      document.getElementById('material-selector').classList.remove('hidden');
      break;
    case 'homelab':
      document.getElementById('homelab-selector').classList.remove('hidden');
      break;
    case 'none':
      // No selector needed
      break;
  }
}

function initializeIconLists() {
  // Initialize emoji list
  initializeEmojiList();
  
  // Initialize Font Awesome list
  initializeFontAwesomeList();
  
  // Initialize Simple Icons list
  initializeSimpleIconsList();
  
  // Initialize Material Icons list
  initializeMaterialIconsList();
  
  // Initialize Home-Lab Icons list
  initializeHomeLabIconsList();
}

function initializeEmojiList() {
  const emojiList = document.getElementById('emoji-list');
  const emojis = [
    '💻', '🖥️', '🖱️', '⌨️', '🖨️', '📱', '📟', '📠', '📺', '📻',
    '🔌', '🔋', '💡', '🔦', '🕯️', '🪔', '🛢️', '⚡', '🔌', '🔋',
    '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤',
    '🚀', '🛸', '🛰️', '🚁', '🛩️', '✈️', '🛫', '🛬', '🚢', '⛴️',
    '⚙️', '🔧', '🔨', '🛠️', '⛏️', '🔩', '⚡', '🔋', '🔌', '💡',
    '🛡️', '🔒', '🔑', '🗝️', '🔐', '🔓', '🔍', '🔎', '🔏', '🔐',
    '🗄️', '📁', '📂', '🗂️', '📅', '📆', '🗓️', '📇', '🗃️', '📋',
    '🌐', '🌍', '🌎', '🌏', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖',
    '☁️', '⛅', '🌤️', '🌥️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '🌪️',
    '🔥', '💧', '🌊', '💦', '💨', '🌪️', '🌈', '☀️', '⭐', '🌟',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '✅', '❌', '❎', '✔️', '✖️', '☑️', '🔘', '🔴', '🟢', '🟡',
    '⚠️', '🚨', '🚩', '🚫', '⛔', '🚭', '🚯', '🚱', '🚷', '📵',
    'ℹ️', '💡', '💭', '💬', '💤', '💢', '💣', '💥', '💦', '💨',
    '❓', '❔', '❕', '❗', '⁉️', '‼️', '❌', '❎', '❌', '❎'
  ];
  
  emojis.forEach(emoji => {
    const item = document.createElement('div');
    item.className = 'icon-item';
    item.textContent = emoji;
    item.onclick = () => selectIcon('emoji', emoji);
    emojiList.appendChild(item);
  });
}

function initializeFontAwesomeList() {
  const faList = document.getElementById('fa-list');
  
  // Use icons from the separate frontend icons file
  if (window.fontAwesomeIcons) {
    window.fontAwesomeIcons.forEach(icon => {
      const item = document.createElement('div');
      item.className = 'icon-item';
      item.innerHTML = `<i class="${icon.class}"></i>`;
      item.title = icon.name;
      item.onclick = () => selectIcon('fontawesome', icon.class);
      faList.appendChild(item);
    });
  } else {
    // Fallback if icons file is not loaded
    console.warn('FontAwesome icons not loaded, using fallback');
    const fallbackIcons = [
      { class: 'fas fa-server', name: 'Server' },
      { class: 'fas fa-desktop', name: 'Desktop' },
      { class: 'fas fa-home', name: 'Home' },
      { class: 'fas fa-cog', name: 'Settings' }
    ];
    
    fallbackIcons.forEach(icon => {
      const item = document.createElement('div');
      item.className = 'icon-item';
      item.innerHTML = `<i class="${icon.class}"></i>`;
      item.title = icon.name;
      item.onclick = () => selectIcon('fontawesome', icon.class);
      faList.appendChild(item);
    });
  }
}

// ... rest of the functions remain the same as in the original script.js ... 
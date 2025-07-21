  function debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }
  
  function toggleCategoriesField() {
    const typeSelect = document.querySelector('select[name="type"]');
    const categoriesLabel = document.getElementById('categories-label');
    const categoryTypes = ['Application', 'LXC Container', 'Docker Container'];
    
    if (categoryTypes.includes(typeSelect.value)) {
      categoriesLabel.classList.remove('hidden');
    } else {
      categoriesLabel.classList.add('hidden');
    }
  }
  
  function generateId() {
    return 'xxxxxx-xxxx-4xxx'.replace(/[x]/g, c =>
      (Math.random() * 16 | 0).toString(16)
    );
  }

  // Column management functions
  function initializeCustomViewContainers(containersData) {
    if (containersData && Array.isArray(containersData) && containersData.length > 0) {
      customViewContainers = containersData;
      customViewContainerOrder = containersData.map(container => container.id);
    } else {
      // Create default container if none exist
      createDefaultContainer();
    }
    console.log('Custom view containers initialized:', customViewContainers);
  }

  function createDefaultContainer() {
    const defaultContainer = {
      id: generateId(),
      name: 'Default Categories',
      role: 'column',
      order: 0,
      styling: {
        hideHeader: false,
        bgType: 'color',
        backgroundColor: '#f9f9f9',
        backgroundGradient: '',
        backgroundCSS: '',
        backgroundImage: '',
        backgroundOpacity: 100,
        borderColor: '#e0e0e0',
        borderSize: 2,
        borderStyle: 'solid',
        borderCSS: '',
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: 15,
        margin: 10,
        customCSS: ''
      },
      categories: [], // Empty by default - categories will be in available categories
      children: []
    };
    
    customViewContainers = [defaultContainer];
    customViewContainerOrder = [defaultContainer.id];
    
    // Don't automatically assign categories to default container - let them stay in available categories
    // This allows users to manually drag categories from available to containers
  }

  function createNewContainer(name = 'New Container', role = 'column') {
    const newContainer = {
      id: generateId(),
      name: name,
      role: role, // 'column' or 'row'
      order: customViewContainers.length,
      styling: {
        hideHeader: false,
        bgType: 'color',
        backgroundColor: '#f9f9f9',
        backgroundGradient: '',
        backgroundCSS: '',
        backgroundImage: '',
        backgroundOpacity: 100,
        borderColor: '#e0e0e0',
        borderSize: 2,
        borderStyle: 'solid',
        borderCSS: '',
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: 15,
        margin: 10,
        customCSS: ''
      },
      categories: [],
      children: []
    };
    
    customViewContainers.push(newContainer);
    customViewContainerOrder.push(newContainer.id);
    return newContainer;
  }

  function getContainerById(containerId) {
    return customViewContainers.find(container => container.id === containerId);
  }



  function getCategoryContainer(categoryName) {
    return customViewContainers.find(container => container.categories.includes(categoryName));
  }

  function moveCategoryToContainer(categoryName, fromContainerId, toContainerId) {
    const fromContainer = getContainerById(fromContainerId);
    const toContainer = getContainerById(toContainerId);
    
    if (fromContainer && toContainer && fromContainerId !== toContainerId) {
      // Remove from source container
      const categoryIndex = fromContainer.categories.indexOf(categoryName);
      if (categoryIndex > -1) {
        fromContainer.categories.splice(categoryIndex, 1);
      }
      
      // Add to target container
      if (!toContainer.categories.includes(categoryName)) {
        toContainer.categories.push(categoryName);
      }
      
      console.log(`Moved category "${categoryName}" from container "${fromContainer.name}" to "${toContainer.name}"`);
      return true;
    }
    return false;
  }

  function saveCustomViewContainersToBackend() {
    return fetch('/api/custom-view-containers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customViewContainers)
    }).then(response => {
      if (!response.ok) {
        throw new Error('Failed to save custom view containers');
      }
      return response.json();
    });
  }


  
  let containers = [];
let currentView = 'box';
let isEditMode = false;
let categoryOrder = [];
let draggedCategory = null;
let draggedPlaceholder = null;

// Custom view container management
let customViewContainers = [];
let customViewContainerOrder = [];
let selectedCustomViewContainerId = null; // For styling modal
  let fontAwesomeIcons = [];
  let materialIcons = [];
  let emojiIcons = [];
  let simpleIcons = [];
  let homelabIcons = [];
  
  let iconListsInitialized = {
    emoji: false,
    fontawesome: false,
    simpleicons: false,
    material: false,
    homelab: false
  };
  
  let homelabIconsLoaded = 0;
  const HOMELAB_ICONS_BATCH_SIZE = 100;
  let HOMELAB_ICONS_TOTAL = 7939; // Will be updated with actual count
  
  let fontAwesomeIconsLoaded = 0;
  const FONTAWESOME_ICONS_BATCH_SIZE = 100;
  let FONTAWESOME_ICONS_TOTAL = 1000; // Will be updated with actual count
  
  let materialIconsLoaded = 0;
  const MATERIAL_ICONS_BATCH_SIZE = 100;
  let MATERIAL_ICONS_TOTAL = 1000; // Will be updated with actual count
  
  let simpleIconsLoaded = 0;
  const SIMPLE_ICONS_BATCH_SIZE = 100;
  let SIMPLE_ICONS_TOTAL = 1000; // Will be updated with actual count
  
  let emojiIconsLoaded = 0;
  const EMOJI_ICONS_BATCH_SIZE = 100;
  let EMOJI_ICONS_TOTAL = 1000; // Will be updated with actual count
  
  // Socket.IO client for real-time communication
  let socket;
  let agentData = new Map(); // Store agent data by container ID
  
  // Widget system variables
  let availableWidgets = [];
  let widgetInstances = new Map();
  
  window.onload = () => {
    // Check if jQuery is loaded
    if (typeof $ === 'undefined') {
      console.error('jQuery is not loaded!');
      return;
    }
    console.log('jQuery loaded successfully:', $.fn.jquery);
    
    // Check if jQuery UI is loaded
    if (typeof $.ui === 'undefined') {
      console.error('jQuery UI is not loaded!');
      return;
    }
    console.log('jQuery UI loaded successfully:', $.ui.version);
    
    // Load containers and custom view containers
    Promise.all([
      fetch('/api/containers').then(res => res.json()),
      fetch('/api/custom-view-containers').then(res => res.json()).catch(() => null) // Graceful fallback
    ]).then(([containersData, customViewContainersData]) => {
      containers = containersData;
      initializeCustomViewContainers(customViewContainersData);
      renderContainers();
    });
    
    // Add click handler to close hamburger menus when clicking outside
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.container-hamburger-menu')) {
        // Close all hamburger menus
        document.querySelectorAll('.container-hamburger-actions').forEach(actions => {
          actions.classList.remove('show');
        });
      }
    });
  
    fetch('/api/icons/fontawesome')
      .then(res => res.json())
      .then(data => {
        fontAwesomeIcons = data;
        FONTAWESOME_ICONS_TOTAL = data.length; // Set actual total count
      })
      .catch(err => {
        console.error('Failed to load FontAwesome icons:', err);
        fontAwesomeIcons = [
          { class: 'fas fa-server', name: 'Server' },
          { class: 'fas fa-desktop', name: 'Desktop' },
          { class: 'fas fa-home', name: 'Home' },
          { class: 'fas fa-cog', name: 'Settings' }
        ];
        FONTAWESOME_ICONS_TOTAL = fontAwesomeIcons.length;
      });
  
    fetch('/api/icons/material')
      .then(res => res.json())
      .then(data => {
        materialIcons = data;
        MATERIAL_ICONS_TOTAL = data.length; // Set actual total count
      });
  
    fetch('/api/icons/emoji')
      .then(res => res.json())
      .then(data => {
        emojiIcons = data;
        EMOJI_ICONS_TOTAL = data.length; // Set actual total count
      });
  
    fetch('/api/icons/simpleicons')
      .then(res => res.json())
      .then(data => {
        simpleIcons = data;
        SIMPLE_ICONS_TOTAL = data.length; // Set actual total count
      });
  
    fetch('/api/icons/homelab')
      .then(res => res.json())
      .then(data => {
        homelabIcons = data;
        HOMELAB_ICONS_TOTAL = data.length; // Set actual total count
      });
  
    document.getElementById('container-form').onsubmit = saveContainer;
    document.getElementById('container-styling-form').onsubmit = saveContainerStyling;
    document.getElementById('search').oninput = () => renderContainers();
    
    // Add event listener for type change to show/hide categories
    document.querySelector('select[name="type"]').addEventListener('change', toggleCategoriesField);
    
    // jQuery UI will handle all drag and drop events
  
    const widthSlider = document.getElementById('width-slider');
    const widthValue = document.getElementById('width-value');
    widthSlider.oninput = () => {
      const width = widthSlider.value;
      widthValue.textContent = width + '%';
      updateContainerWidth(width);
    };
  
    setupIconPicker();
    initializeSocketIO();
  };
  
  function setupIconPicker() {
    const iconType = document.getElementById('icon-type');
    iconType.addEventListener('change', updateIconSelector);
    updateIconSelector();
  
    const faSearch = document.getElementById('fa-search');
    if (faSearch) {
      faSearch.addEventListener('input', debounce(() => {
        // Reset loaded count when starting a new search
        fontAwesomeIconsLoaded = 0;
        loadMoreFontAwesomeIcons();
      }, 200));
    }
  
    const hlSearch = document.getElementById('hl-search');
    if (hlSearch) {
      hlSearch.addEventListener('input', debounce(filterHomeLabIcons, 200));
    }
  
    const mdiSearch = document.getElementById('mdi-search');
    if (mdiSearch) {
      mdiSearch.addEventListener('input', debounce(filterMaterialIcons, 200));
    }
  
    const siSearch = document.getElementById('si-search');
    if (siSearch) {
      siSearch.addEventListener('input', debounce(filterSimpleIcons, 200));
    }
  
    const emojiSearch = document.getElementById('emoji-search');
    if (emojiSearch) {
      emojiSearch.addEventListener('input', debounce(filterEmojiIcons, 200));
    }
  }
  
  function updateIconSelector() {
    const iconType = document.getElementById('icon-type');
    const iconPreview = document.getElementById('icon-preview');
  
    document.querySelectorAll('.icon-selector').forEach(s => s.classList.add('hidden'));
    iconPreview.innerHTML = '';
  
    switch(iconType.value) {
      case 'emoji':
        document.getElementById('emoji-selector').classList.remove('hidden');
        if (!iconListsInitialized.emoji) {
          initializeEmojiList();
          iconListsInitialized.emoji = true;
        }
        break;
      case 'favicon':
      case 'url':
      case 'generative':
        document.getElementById('custom-input').classList.remove('hidden');
        const iconInput = document.getElementById('icon-input');
        iconInput.placeholder =
          iconType.value === 'favicon' ? 'Enter URL (e.g., https://example.com)' :
          iconType.value === 'generative' ? 'Enter text (e.g., server1)' :
          'Enter image URL (e.g., https://example.com/icon.png)';
        iconInput.addEventListener('input', updateIconPreview);
        break;
      case 'fontawesome':
        document.getElementById('fontawesome-selector').classList.remove('hidden');
        if (!iconListsInitialized.fontawesome) {
          initializeFontAwesomeList();
          iconListsInitialized.fontawesome = true;
        }
        break;
      case 'simpleicons':
        document.getElementById('simpleicons-selector').classList.remove('hidden');
        if (!iconListsInitialized.simpleicons) {
          initializeSimpleIconsList();
          iconListsInitialized.simpleicons = true;
        }
        break;
      case 'material':
        document.getElementById('material-selector').classList.remove('hidden');
        if (!iconListsInitialized.material) {
          initializeMaterialIconsList();
          iconListsInitialized.material = true;
        }
        break;
      case 'homelab':
        document.getElementById('homelab-selector').classList.remove('hidden');
        if (!iconListsInitialized.homelab) {
          initializeHomeLabIconsList();
          iconListsInitialized.homelab = true;
        }
        break;
      case 'none':
        break;
    }
  }
  
  function initializeFontAwesomeList() {
    const faList = document.getElementById('fa-list');
    faList.innerHTML = '';
    fontAwesomeIconsLoaded = 0;
    
    // Load initial batch
    loadMoreFontAwesomeIcons();
    
    // Add scroll listener for lazy loading
    faList.addEventListener('scroll', debounce(() => {
      const { scrollTop, scrollHeight, clientHeight } = faList;
      if (scrollTop + clientHeight >= scrollHeight - 50) { // Load when near bottom
        loadMoreFontAwesomeIcons();
      }
    }, 100));
  }
  
  function loadMoreFontAwesomeIcons() {
    const faList = document.getElementById('fa-list');
    const searchTerm = document.getElementById('fa-search')?.value.toLowerCase() || '';
    
    // If searching, load all matching results
    if (searchTerm) {
      const filteredIcons = fontAwesomeIcons.filter(icon => 
        icon.name.toLowerCase().includes(searchTerm)
      );
      
      faList.innerHTML = '';
      filteredIcons.forEach(icon => {
        const item = document.createElement('div');
        item.className = 'icon-item';
        item.innerHTML = `<i class="${icon.class}"></i>`;
        item.title = icon.name;
        item.onclick = () => selectIcon('fontawesome', icon.class);
        faList.appendChild(item);
      });
      
      updateFontAwesomeLoadingIndicator(filteredIcons.length, FONTAWESOME_ICONS_TOTAL);
      return;
    }
    
    // Normal lazy loading
    const startIndex = fontAwesomeIconsLoaded;
    const endIndex = Math.min(startIndex + FONTAWESOME_ICONS_BATCH_SIZE, fontAwesomeIcons.length);
    
    for (let i = startIndex; i < endIndex; i++) {
      const item = document.createElement('div');
      item.className = 'icon-item';
      item.innerHTML = `<i class="${fontAwesomeIcons[i].class}"></i>`;
      item.title = fontAwesomeIcons[i].name;
      item.onclick = () => selectIcon('fontawesome', fontAwesomeIcons[i].class);
      faList.appendChild(item);
    }
    
    fontAwesomeIconsLoaded = endIndex;
    updateFontAwesomeLoadingIndicator(fontAwesomeIconsLoaded, FONTAWESOME_ICONS_TOTAL);
  }
  
  function updateFontAwesomeLoadingIndicator(loaded, total) {
    let indicator = document.getElementById('fa-loading-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'fa-loading-indicator';
      indicator.className = 'loading-indicator';
      const faSelector = document.getElementById('fontawesome-selector');
      faSelector.insertBefore(indicator, document.getElementById('fa-list'));
    }
    
    if (loaded >= total) {
      indicator.textContent = `✅ All ${total} icons loaded`;
      indicator.className = 'loading-indicator loaded';
    } else {
      indicator.textContent = `📊 ${loaded}/${total} icons loaded`;
      indicator.className = 'loading-indicator';
    }
    
    indicator.style.display = 'block';
  }
  
  function initializeEmojiList() {
    const emojiList = document.getElementById('emoji-list');
    emojiList.innerHTML = '';
    emojiIconsLoaded = 0;
    
    // Load initial batch
    loadMoreEmojiIcons();
    
    // Add scroll listener for lazy loading
    emojiList.addEventListener('scroll', debounce(() => {
      const { scrollTop, scrollHeight, clientHeight } = emojiList;
      if (scrollTop + clientHeight >= scrollHeight - 50) { // Load when near bottom
        loadMoreEmojiIcons();
      }
    }, 100));
  }
  
  function loadMoreEmojiIcons() {
    const emojiList = document.getElementById('emoji-list');
    const searchTerm = document.getElementById('emoji-search')?.value.toLowerCase() || '';
    
    // If searching, load all matching results
    if (searchTerm) {
      const filteredIcons = emojiIcons.filter(icon => 
        icon.name.toLowerCase().includes(searchTerm) || icon.emoji.includes(searchTerm)
      );
      
      emojiList.innerHTML = '';
      filteredIcons.forEach(icon => {
        const item = document.createElement('div');
        item.className = 'icon-item';
        item.textContent = icon.emoji;
        item.title = icon.name;
        item.onclick = () => selectIcon('emoji', icon.emoji);
        emojiList.appendChild(item);
      });
      
      updateEmojiLoadingIndicator(filteredIcons.length, EMOJI_ICONS_TOTAL);
      return;
    }
    
    // Normal lazy loading
    const startIndex = emojiIconsLoaded;
    const endIndex = Math.min(startIndex + EMOJI_ICONS_BATCH_SIZE, emojiIcons.length);
    
    for (let i = startIndex; i < endIndex; i++) {
      const item = document.createElement('div');
      item.className = 'icon-item';
      item.textContent = emojiIcons[i].emoji;
      item.title = emojiIcons[i].name;
      item.onclick = () => selectIcon('emoji', emojiIcons[i].emoji);
      emojiList.appendChild(item);
    }
    
    emojiIconsLoaded = endIndex;
    updateEmojiLoadingIndicator(emojiIconsLoaded, EMOJI_ICONS_TOTAL);
  }
  
  function updateEmojiLoadingIndicator(loaded, total) {
    let indicator = document.getElementById('emoji-loading-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'emoji-loading-indicator';
      indicator.className = 'loading-indicator';
      const emojiSelector = document.getElementById('emoji-selector');
      emojiSelector.insertBefore(indicator, document.getElementById('emoji-list'));
    }
    
    if (loaded >= total) {
      indicator.textContent = `✅ All ${total} icons loaded`;
      indicator.className = 'loading-indicator loaded';
    } else {
      indicator.textContent = `📊 ${loaded}/${total} icons loaded`;
      indicator.className = 'loading-indicator';
    }
    
    indicator.style.display = 'block';
  }
  
  function initializeSimpleIconsList() {
    const siList = document.getElementById('si-list');
    siList.innerHTML = '';
    simpleIconsLoaded = 0;
    
    // Load initial batch
    loadMoreSimpleIcons();
    
    // Add scroll listener for lazy loading
    siList.addEventListener('scroll', debounce(() => {
      const { scrollTop, scrollHeight, clientHeight } = siList;
      if (scrollTop + clientHeight >= scrollHeight - 50) { // Load when near bottom
        loadMoreSimpleIcons();
      }
    }, 100));
  }
  
  function loadMoreSimpleIcons() {
    const siList = document.getElementById('si-list');
    const searchTerm = document.getElementById('si-search')?.value.toLowerCase() || '';
    
    // If searching, load all matching results
    if (searchTerm) {
      const filteredIcons = simpleIcons.filter(icon => 
        icon.name.toLowerCase().includes(searchTerm)
      );
      
      siList.innerHTML = '';
      filteredIcons.forEach(icon => {
        const item = document.createElement('div');
        item.className = 'icon-item';
        const img = document.createElement('img');
        img.src = `https://cdn.simpleicons.org/${icon.icon}`;
        img.className = 'si';
        img.onerror = () => item.remove();
        item.appendChild(img);
        item.title = icon.name;
        item.onclick = () => selectIcon('simpleicons', icon.icon);
        siList.appendChild(item);
      });
      
      updateSimpleLoadingIndicator(filteredIcons.length, SIMPLE_ICONS_TOTAL);
      return;
    }
    
    // Normal lazy loading
    const startIndex = simpleIconsLoaded;
    const endIndex = Math.min(startIndex + SIMPLE_ICONS_BATCH_SIZE, simpleIcons.length);
    
    for (let i = startIndex; i < endIndex; i++) {
      const item = document.createElement('div');
      item.className = 'icon-item';
      const img = document.createElement('img');
      img.src = `https://cdn.simpleicons.org/${simpleIcons[i].icon}`;
      img.className = 'si';
      img.onerror = () => item.remove();
      item.appendChild(img);
      item.title = simpleIcons[i].name;
      item.onclick = () => selectIcon('simpleicons', simpleIcons[i].icon);
      siList.appendChild(item);
    }
    
    simpleIconsLoaded = endIndex;
    updateSimpleLoadingIndicator(simpleIconsLoaded, SIMPLE_ICONS_TOTAL);
  }
  
  function updateSimpleLoadingIndicator(loaded, total) {
    let indicator = document.getElementById('si-loading-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'si-loading-indicator';
      indicator.className = 'loading-indicator';
      const siSelector = document.getElementById('simpleicons-selector');
      siSelector.insertBefore(indicator, document.getElementById('si-list'));
    }
    
    if (loaded >= total) {
      indicator.textContent = `✅ All ${total} icons loaded`;
      indicator.className = 'loading-indicator loaded';
    } else {
      indicator.textContent = `📊 ${loaded}/${total} icons loaded`;
      indicator.className = 'loading-indicator';
    }
    
    indicator.style.display = 'block';
  }
  
  function initializeMaterialIconsList() {
    const mdiList = document.getElementById('mdi-list');
    mdiList.innerHTML = '';
    materialIconsLoaded = 0;
    
    // Load initial batch
    loadMoreMaterialIcons();
    
    // Add scroll listener for lazy loading
    mdiList.addEventListener('scroll', debounce(() => {
      const { scrollTop, scrollHeight, clientHeight } = mdiList;
      if (scrollTop + clientHeight >= scrollHeight - 50) { // Load when near bottom
        loadMoreMaterialIcons();
      }
    }, 100));
  }
  
  function loadMoreMaterialIcons() {
    const mdiList = document.getElementById('mdi-list');
    const searchTerm = document.getElementById('mdi-search')?.value.toLowerCase() || '';
    
    // If searching, load all matching results
    if (searchTerm) {
      const filteredIcons = materialIcons.filter(icon => 
        icon.name.toLowerCase().includes(searchTerm)
      );
      
      mdiList.innerHTML = '';
      filteredIcons.forEach(icon => {
        const item = document.createElement('div');
        item.className = 'icon-item';
        const iconName = icon.class.replace('mdi-', '');
        item.innerHTML = `<i class="mdi mdi-${iconName}"></i>`;
        item.title = icon.name;
        item.onclick = () => selectIcon('material', iconName);
        mdiList.appendChild(item);
      });
      
      updateMaterialLoadingIndicator(filteredIcons.length, MATERIAL_ICONS_TOTAL);
      return;
    }
    
    // Normal lazy loading
    const startIndex = materialIconsLoaded;
    const endIndex = Math.min(startIndex + MATERIAL_ICONS_BATCH_SIZE, materialIcons.length);
    
    for (let i = startIndex; i < endIndex; i++) {
      const item = document.createElement('div');
      item.className = 'icon-item';
      const iconName = materialIcons[i].class.replace('mdi-', '');
      item.innerHTML = `<i class="mdi mdi-${iconName}"></i>`;
      item.title = materialIcons[i].name;
      item.onclick = () => selectIcon('material', iconName);
      mdiList.appendChild(item);
    }
    
    materialIconsLoaded = endIndex;
    updateMaterialLoadingIndicator(materialIconsLoaded, MATERIAL_ICONS_TOTAL);
  }
  
  function updateMaterialLoadingIndicator(loaded, total) {
    let indicator = document.getElementById('mdi-loading-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'mdi-loading-indicator';
      indicator.className = 'loading-indicator';
      const mdiSelector = document.getElementById('material-selector');
      mdiSelector.insertBefore(indicator, document.getElementById('mdi-list'));
    }
    
    if (loaded >= total) {
      indicator.textContent = `✅ All ${total} icons loaded`;
      indicator.className = 'loading-indicator loaded';
    } else {
      indicator.textContent = `📊 ${loaded}/${total} icons loaded`;
      indicator.className = 'loading-indicator';
    }
    
    indicator.style.display = 'block';
  }
  
  function initializeHomeLabIconsList() {
    const hlList = document.getElementById('hl-list');
    hlList.innerHTML = '';
    homelabIconsLoaded = 0;
    
    // Load initial batch
    loadMoreHomeLabIcons();
    
    // Add scroll listener for lazy loading
    hlList.addEventListener('scroll', debounce(() => {
      const { scrollTop, scrollHeight, clientHeight } = hlList;
      if (scrollTop + clientHeight >= scrollHeight - 50) { // Load when near bottom
        loadMoreHomeLabIcons();
      }
    }, 100));
  }
  
  function loadMoreHomeLabIcons() {
    const hlList = document.getElementById('hl-list');
    const searchTerm = document.getElementById('hl-search')?.value.toLowerCase() || '';
    
    // If searching, load all matching results
    if (searchTerm) {
      const filteredIcons = homelabIcons.filter(icon => 
        icon.name.toLowerCase().includes(searchTerm)
      );
      
      hlList.innerHTML = '';
      filteredIcons.forEach(icon => {
        const item = createIconItem(icon);
        hlList.appendChild(item);
      });
      
      updateHomeLabLoadingIndicator(filteredIcons.length, HOMELAB_ICONS_TOTAL);
      return;
    }
    
    // Normal lazy loading
    const startIndex = homelabIconsLoaded;
    const endIndex = Math.min(startIndex + HOMELAB_ICONS_BATCH_SIZE, homelabIcons.length);
    
    for (let i = startIndex; i < endIndex; i++) {
      const item = createIconItem(homelabIcons[i]);
      hlList.appendChild(item);
    }
    
    homelabIconsLoaded = endIndex;
    updateHomeLabLoadingIndicator(homelabIconsLoaded, HOMELAB_ICONS_TOTAL);
  }
  
  function updateHomeLabLoadingIndicator(loaded, total) {
    let indicator = document.getElementById('hl-loading-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'hl-loading-indicator';
      indicator.className = 'loading-indicator';
      const hlSelector = document.getElementById('homelab-selector');
      hlSelector.insertBefore(indicator, document.getElementById('hl-list'));
    }
    
    if (loaded >= total) {
      indicator.textContent = `✅ All ${total} icons loaded`;
      indicator.className = 'loading-indicator loaded';
    } else {
      indicator.textContent = `📊 ${loaded}/${total} icons loaded`;
      indicator.className = 'loading-indicator';
    }
    
    indicator.style.display = 'block';
  }
  
  function selectIcon(type, value) {
    const iconInput = document.getElementById('icon-input');
    iconInput.value = value;
    updateIconPreview();
  
    document.querySelectorAll('.icon-item').forEach(item => {
      item.classList.remove('selected');
    });
  
    event.target.closest('.icon-item').classList.add('selected');
  }
  
  function updateIconPreview() {
    const iconType = document.getElementById('icon-type');
    const iconInput = document.getElementById('icon-input');
    const iconPreview = document.getElementById('icon-preview');
    const iconSizeSlider = document.getElementById('icon-size-slider');
    const iconColorPicker = document.getElementById('icon-color-picker');
  
    const value = iconInput.value.trim();
    const iconSize = iconSizeSlider ? iconSizeSlider.value : 30;
    const iconColor = iconColorPicker ? iconColorPicker.value : '#000000';
  
    iconPreview.innerHTML = '';
    if (!value) return;
  
    switch(iconType.value) {
      case 'emoji':
        iconPreview.textContent = value;
        iconPreview.style.fontSize = iconSize + 'px';
        break;
      case 'favicon':
        iconPreview.innerHTML = `<img src="${getFaviconUrl(value)}" style="width:${iconSize}px;height:${iconSize}px;" onerror="this.style.display='none'">`;
        break;
      case 'fontawesome':
        iconPreview.innerHTML = `<i class="${value}" style="font-size:${iconSize}px;color:${iconColor};"></i>`;
        break;
      case 'simpleicons':
        iconPreview.innerHTML = `<img src="https://cdn.simpleicons.org/${value}" class="si" style="width:${iconSize}px;height:${iconSize}px;" onerror="this.style.display='none'">`;
        break;
      case 'material':
        iconPreview.innerHTML = `<i class="mdi mdi-${value}" style="font-size:${iconSize}px;color:${iconColor};"></i>`;
        break;
      case 'homelab':
        iconPreview.innerHTML = `<img src="https://raw.githubusercontent.com/WalkxCode/dashboard-icons/master/png/${value}.png" class="hl" style="width:${iconSize}px;height:${iconSize}px;" onerror="this.style.display='none'">`;
        break;
      case 'generative':
        iconPreview.innerHTML = `<img src="https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(value)}" style="width:${iconSize}px;height:${iconSize}px;">`;
        break;
      case 'url':
        iconPreview.innerHTML = `<img src="${value}" style="width:${iconSize}px;height:${iconSize}px;" onerror="this.style.display='none'">`;
        break;
    }
  }
  
  function getFaviconUrl(url) {
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return '';
    }
  }
  
  function showCreateModal(parentId) {
    const form = document.getElementById('container-form');
    form.reset();
    form.parentId.value = parentId || '';
    form.containerId.value = '';
    
    // Set default styling values
    form.bgType.value = 'color';
    form.backgroundColor.value = '#ffffff';
    form.borderColor.value = '#0077cc';
    form.borderSize.value = '2';
    form.borderStyle.value = 'solid';
    form.titleBgType.value = 'color';
    form.titleBackgroundColor.value = '#f0f0f0';
    form.backgroundOpacity.value = '100';
    form.titleBackgroundOpacity.value = '100';
    form.borderRadius.value = '0';
    form.padding.value = '10';
    form.margin.value = '10';
    
    // Update background options
    updateBackgroundOptions();
    updateTitleBackgroundOptions();
    
    // Update range value displays
    document.getElementById('opacity-value').textContent = '100%';
    document.getElementById('title-opacity-value').textContent = '100%';
    
    // Show/hide categories field based on type
    toggleCategoriesField();
    
    document.getElementById('container-modal').classList.remove('hidden');
  }
  
  function showEditModal(id) {
    const form = document.getElementById('container-form');
    const container = findContainerById(containers, id);
    if (!container) return;
  
    form.name.value = container.name;
    form.type.value = container.type;
  
    if (container.icon && typeof container.icon === 'object') {
      document.getElementById('icon-type').value = container.icon.type || 'emoji';
      document.getElementById('icon-input').value = container.icon.value || '';
      document.getElementById('icon-size-slider').value = container.icon.size || 30;
      document.getElementById('icon-color-picker').value = container.icon.color || '#000000';
    } else {
      document.getElementById('icon-type').value = 'emoji';
      document.getElementById('icon-input').value = container.icon || '';
      document.getElementById('icon-size-slider').value = 30;
      document.getElementById('icon-color-picker').value = '#000000';
    }
  
    updateIconSelector();
    updateIconPreview();
  
    form.ip.value = container.ip;
    form.url.value = container.url;
    form.notes.value = container.notes;
    form.autosize.checked = container.autosize;
    form.containerId.value = container.id;
    form.parentId.value = findParentId(containers, id);
    
    // Populate categories if they exist
    if (container.categories && Array.isArray(container.categories)) {
      form.categories.value = container.categories.join(', ');
    } else {
      form.categories.value = '';
    }
    
    // Show/hide categories field based on type
    toggleCategoriesField();
    
    // Populate agent configuration if it exists
    if (container.agent) {
      form.agentIp.value = container.agent.ip || '';
      form.agentPort.value = container.agent.port || '';
      form.agentApiKey.value = container.agent.apiKey || '';
    } else {
      form.agentIp.value = '';
      form.agentPort.value = '';
      form.agentApiKey.value = '';
    }
    
    // Show/hide agent configuration section based on type
    toggleAgentConfig();
    
    // Populate styling fields
    if (container.styling) {
      const style = container.styling;
      
      // Background fields
      form.bgType.value = style.bgType || 'color';
      form.backgroundColor.value = style.backgroundColor || '#ffffff';
      form.backgroundGradient.value = style.backgroundGradient || '';
      form.backgroundCSS.value = style.backgroundCSS || '';
      form.backgroundImage.value = style.backgroundImage || '';
      form.backgroundOpacity.value = style.backgroundOpacity || '100';
      
      // Border fields
      form.borderColor.value = style.borderColor || container.color || '#000000';
      form.borderSize.value = style.borderSize || '2';
      form.borderStyle.value = style.borderStyle || 'solid';
      form.borderCSS.value = style.borderCSS || '';
      
      // Title bar fields
      form.titleBgType.value = style.titleBgType || 'color';
      form.titleBackgroundColor.value = style.titleBackgroundColor || '#f0f0f0';
      form.titleBackgroundGradient.value = style.titleBackgroundGradient || '';
      form.titleBackgroundCSS.value = style.titleBackgroundCSS || '';
      form.titleBackgroundImage.value = style.titleBackgroundImage || '';
      form.titleBackgroundOpacity.value = style.titleBackgroundOpacity || '100';
      
      // Additional fields
      form.customCSS.value = style.customCSS || '';
      form.borderRadius.value = style.borderRadius || '0';
      form.boxShadow.value = style.boxShadow || '';
      form.padding.value = style.padding || '10';
      form.margin.value = style.margin || '10';
      
      // Update background options
      updateBackgroundOptions();
      updateTitleBackgroundOptions();
      
      // Update range value displays
      document.getElementById('opacity-value').textContent = form.backgroundOpacity.value + '%';
      document.getElementById('title-opacity-value').textContent = form.titleBackgroundOpacity.value + '%';
    } else {
      // Set default values for new containers
      form.bgType.value = 'color';
      form.backgroundColor.value = '#ffffff';
      form.borderColor.value = container.color || '#0077cc';
      form.borderSize.value = '2';
      form.borderStyle.value = 'solid';
      form.titleBgType.value = 'color';
      form.titleBackgroundColor.value = '#f0f0f0';
      form.backgroundOpacity.value = '100';
      form.titleBackgroundOpacity.value = '100';
      form.borderRadius.value = '0';
      form.padding.value = '10';
      form.margin.value = '10';
      
      updateBackgroundOptions();
      updateTitleBackgroundOptions();
    }
    
    document.getElementById('container-modal').classList.remove('hidden');
  }
  
  function hideModal() {
    document.getElementById('container-modal').classList.add('hidden');
  }
  
  function saveContainer(event) {
    event.preventDefault();
    const form = event.target;
  
    const iconType = document.getElementById('icon-type').value;
    const iconValue = document.getElementById('icon-input').value.trim();
    const iconSize = parseInt(document.getElementById('icon-size-slider').value) || 30;
    const iconColor = document.getElementById('icon-color-picker').value || '#000000';
  
    let iconData = null;
    if (iconType !== 'none' && iconValue) {
      iconData = { type: iconType, value: iconValue, size: iconSize, color: iconColor };
    }
  
    // Collect styling data
    const styling = {
      backgroundColor: form.backgroundColor?.value,
      backgroundGradient: form.backgroundGradient?.value,
      backgroundCSS: form.backgroundCSS?.value,
      backgroundImage: form.backgroundImage?.value,
      backgroundOpacity: form.backgroundOpacity?.value,
      bgType: form.bgType?.value,
      borderColor: form.borderColor?.value,
      borderSize: form.borderSize?.value,
      borderStyle: form.borderStyle?.value,
      borderCSS: form.borderCSS?.value,
      titleBackgroundColor: form.titleBackgroundColor?.value,
      titleBackgroundGradient: form.titleBackgroundGradient?.value,
      titleBackgroundCSS: form.titleBackgroundCSS?.value,
      titleBackgroundImage: form.titleBackgroundImage?.value,
      titleBackgroundOpacity: form.titleBackgroundOpacity?.value,
      titleBgType: form.titleBgType?.value,
      customCSS: form.customCSS?.value,
      borderRadius: form.borderRadius?.value,
      boxShadow: form.boxShadow?.value,
      padding: form.padding?.value,
      margin: form.margin?.value
    };
  
    // Collect agent configuration if applicable
    let agentConfig = null;
    if (form.type.value === 'Computer' || form.type.value === 'VM') {
      const agentIp = form.agentIp?.value?.trim();
      const agentPort = form.agentPort?.value;
      const agentApiKey = form.agentApiKey?.value?.trim();
      
      if (agentIp && agentPort && agentApiKey) {
        agentConfig = {
          ip: agentIp,
          port: parseInt(agentPort),
          apiKey: agentApiKey
        };
      }
    }
  
    // Parse categories
    let categories = [];
    if (form.categories?.value) {
      categories = form.categories.value.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0);
    }
    
    const newContainer = {
      id: form.containerId.value || generateId(),
      name: form.name.value,
      type: form.type.value,
      icon: iconData,
      ip: form.ip.value,
      url: form.url.value,
      color: form.borderColor?.value || '#0077cc', // Use border color as the main color
      notes: form.notes.value,
      autosize: form.autosize.checked,
      styling: styling,
      agent: agentConfig,
      categories: categories,
      children: []
    };
  
    if (form.containerId.value) {
      updateContainer(containers, newContainer);
    } else {
      const parent = form.parentId.value ? findContainerById(containers, form.parentId.value) : null;
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(newContainer);
      } else {
        containers.push(newContainer);
      }
    }
  
    fetch('/api/containers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(containers)
    }).then(() => {
      hideModal();
      renderContainers();
    });
  }
  
  function findContainerById(list, id) {
    for (const item of list) {
      if (item.id === id) return item;
      const found = findContainerById(item.children || [], id);
      if (found) return found;
    }
    return null;
  }
  
  function findParentId(list, id, parentId = null) {
    for (const item of list) {
      if (item.id === id) return parentId;
      const found = findParentId(item.children || [], id, item.id);
      if (found) return found;
    }
    return null;
  }
  
  function updateContainer(list, updated) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === updated.id) {
        updated.children = list[i].children || [];
        list[i] = updated;
        return;
      }
      updateContainer(list[i].children || [], updated);
    }
  }
  
    function renderContainers() {
    const root = document.getElementById('container-root');
    if (!root) {
      console.error('Container root element not found');
      return;
    }
    
    // Preserve edit mode state
    const wasEditModeActive = root.classList.contains('edit-mode-active');
    console.log('renderContainers: Edit mode was active:', wasEditModeActive);
    
    // Clear any existing sortable instance before re-rendering
    const $containerRoot = $(root);
    if ($containerRoot.hasClass('ui-sortable')) {
      try {
        $containerRoot.sortable('destroy');
      } catch (e) {
        console.warn('Failed to destroy sortable during render:', e);
      }
    }
    
    root.innerHTML = '';
    // Don't reset classes - preserve edit mode state
    // root.className = ''; // Reset classes  <-- REMOVED THIS LINE
    
    // Restore edit mode class if it was active
    if (wasEditModeActive) {
      root.classList.add('edit-mode-active');
      console.log('renderContainers: Restored edit-mode-active class');
    }
    
    const term = document.getElementById('search').value.toLowerCase();

    if (currentView === 'box') {
      renderBoxView(root, term);
    } else if (currentView === 'tree') {
      root.className = 'tree-view';
      renderTreeView(root, term);
    } else if (currentView === 'custom') {
      renderCustomView(root, term);
    }
  }
  
  function renderBoxView(root, term) {
    containers.forEach(c => {
      if (matchesSearch(c, term) || hasMatchingChild(c, term)) {
        root.appendChild(renderBox(c, term));
      }
    });
  }
  
  function renderTreeView(root, term) {
    containers.forEach(c => {
      if (matchesSearch(c, term) || hasMatchingChild(c, term)) {
        root.appendChild(renderTreeItem(c, term));
      }
    });
  }
  
  function renderCustomView(root, term) {
    console.log('renderCustomView called - isEditMode:', isEditMode, 'customViewContainers count:', customViewContainers.length);
    
    // Clear any existing sortable instances before re-rendering
    try {
      // Destroy container sortable
      if ($.fn.sortable && $('#containers-container').length && $('#containers-container').hasClass('ui-sortable')) {
        $('#containers-container').sortable('destroy');
        console.log('Destroyed containers-container sortable');
      }
      
      // Destroy all category sortables
      $('.container-categories').each(function() {
        if ($(this).hasClass('ui-sortable')) {
          $(this).sortable('destroy');
          console.log('Destroyed container-categories sortable');
        }
      });
      
      // Destroy root sortable if it exists
      if ($('#container-root').hasClass('ui-sortable')) {
        $('#container-root').sortable('destroy');
        console.log('Destroyed container-root sortable');
      }
    } catch (e) {
      console.warn('Error during sortable cleanup:', e);
    }
    
    // Get all containers that can have categories
    const categoryTypes = ['Application', 'LXC Container', 'Docker Container'];
    const categoryContainers = [];
    
    function collectCategoryContainers(containerList) {
      containerList.forEach(container => {
        if (categoryTypes.includes(container.type) && 
            (matchesSearch(container, term) || hasMatchingChild(container, term))) {
          categoryContainers.push(container);
        }
        if (container.children && container.children.length > 0) {
          collectCategoryContainers(container.children);
        }
      });
    }
    
    collectCategoryContainers(containers);
    
    // Group containers by category
    const categoryGroups = {};
    categoryContainers.forEach(container => {
      if (container.categories && container.categories.length > 0) {
        container.categories.forEach(category => {
          if (!categoryGroups[category]) {
            categoryGroups[category] = [];
          }
          categoryGroups[category].push(container);
        });
      } else {
        // Containers without categories go to "Uncategorized"
        if (!categoryGroups['Uncategorized']) {
          categoryGroups['Uncategorized'] = [];
        }
        categoryGroups['Uncategorized'].push(container);
      }
    });

    // Ensure uncategorized items are in the first container if no containers exist
    if (customViewContainers.length === 0) {
      createDefaultContainer();
    }

    // Don't automatically migrate categoryOrder to containers - let categories stay in available categories
    // This allows users to manually drag categories from available to containers

    // Don't automatically assign new categories to containers - let them stay in available categories
    // This allows users to manually drag categories from available to containers
    
    // Create containers container
    const containersContainer = document.createElement('div');
    containersContainer.className = 'containers-container';
    containersContainer.id = 'containers-container';
    
    // Apply layout based on container roles
    const hasRows = customViewContainers.some(container => container.role === 'row');
    if (hasRows) {
      containersContainer.classList.add('container-row');
    } else {
      containersContainer.classList.add('container-column');
    }
    
    // Render each container
    console.log('About to render containers - customViewContainerOrder:', customViewContainerOrder, 'customViewContainers data available:', customViewContainers.length);
    customViewContainerOrder.forEach(containerId => {
      const container = getContainerById(containerId);
      console.log('Processing container ID:', containerId, 'found container:', container?.name);
      if (container) {
        const containerElement = createContainerElement(container, categoryGroups, term);
        containersContainer.appendChild(containerElement);
      }
    });
    
    root.appendChild(containersContainer);
    
    // Update available categories zone
    updateAvailableCategoriesZone();
    
    // Initialize sortable if in edit mode - do this only once after DOM is ready
    if (isEditMode) {
      // Use requestAnimationFrame and setTimeout for better timing
      requestAnimationFrame(() => {
        setTimeout(() => {
          console.log('Setting up sortable after DOM render...');
          setupContainerSortable();
        }, 50);
      });
    }
  }
  
  function createContainerElement(container, categoryGroups, term) {
    console.log('createContainerElement called for container:', container.name, 'role:', container.role, 'hideHeader:', container.styling?.hideHeader, 'isEditMode:', isEditMode);
    
    const containerElement = document.createElement('div');
    containerElement.className = 'container';
    containerElement.setAttribute('data-container-id', container.id);
    
    // Apply role-specific styling
    if (container.role === 'row') {
      containerElement.classList.add('container-row');
    } else {
      containerElement.classList.add('container-column');
    }
    
    // Container header
    const containerHeader = document.createElement('div');
    containerHeader.className = 'container-header';
    
    const containerTitle = document.createElement('div');
    containerTitle.className = 'container-title';
    
    // Create editable title span
    const titleSpan = document.createElement('span');
    titleSpan.className = 'container-title-text';
    const roleIcon = container.role === 'column' ? '📁' : '➡️';
    titleSpan.textContent = `${roleIcon} ${container.name}`;
    titleSpan.setAttribute('data-container-id', container.id);
    
    // Always make title editable (will check edit mode in the function)
    titleSpan.style.cursor = 'pointer';
    titleSpan.title = 'Click to edit container name (Edit Mode required)';
    titleSpan.onclick = (e) => {
      console.log('Container title clicked:', container.name, 'Edit mode:', isEditMode);
      e.stopPropagation();
      e.preventDefault();
      makeContainerTitleEditable(titleSpan, container.id);
    };
    
    // Visual indicator in edit mode
    if (isEditMode) {
      titleSpan.classList.add('editable');
    }
    
    containerTitle.appendChild(titleSpan);
    
    const containerActions = document.createElement('div');
    containerActions.className = 'container-actions';
    
    // Always create hamburger menu and drag handle, but control visibility with CSS
    const hamburgerMenu = document.createElement('div');
    hamburgerMenu.className = 'container-hamburger-menu';
    
    // Show opposite role button based on current role
    const oppositeRole = container.role === 'column' ? 'row' : 'column';
    const oppositeRoleName = container.role === 'column' ? 'Row' : 'Column';
    const oppositeRoleIcon = container.role === 'column' ? '➡️' : '📁';
    
    hamburgerMenu.innerHTML = `
      <div class="container-hamburger-actions">
        <button onclick="showContainerStyleModal('${container.id}')" title="Edit Container">✏️ Edit</button>
        <button onclick="addNewContainer('${oppositeRole}', '${container.id}')" title="Add ${oppositeRoleName}">${oppositeRoleIcon} Add ${oppositeRoleName}</button>
        <button onclick="deleteContainer('${container.id}')" title="Delete Container">🗑️ Delete</button>
      </div>
      <button class="container-hamburger-btn" onclick="toggleContainerHamburgerMenu(this, event)">☰</button>
    `;
    
    const dragHandle = document.createElement('div');
    dragHandle.className = 'container-drag-handle';
    dragHandle.title = 'Drag to reorder container';
    dragHandle.innerHTML = `⋮⋮⋮`;
    
    containerActions.appendChild(hamburgerMenu);
    containerActions.appendChild(dragHandle);
    
    // Debug: Log hamburger menu creation
    console.log('Created hamburger menu for container:', container.name, 'isEditMode:', isEditMode);
    console.log('Hamburger menu element:', hamburgerMenu);
    console.log('Hamburger menu display style:', window.getComputedStyle(hamburgerMenu).display);
    console.log('Container root has edit-mode-active:', document.getElementById('container-root')?.classList.contains('edit-mode-active'));
    
    // Test: Force show hamburger menu for debugging
    if (isEditMode) {
      hamburgerMenu.style.display = 'inline-block';
      console.log('Forced hamburger menu to show for debugging');
    }
    
    containerHeader.appendChild(containerTitle);
    containerHeader.appendChild(containerActions);
    
    // Categories container for this container
    const categoriesContainer = document.createElement('div');
    categoriesContainer.className = 'container-categories';
    categoriesContainer.setAttribute('data-container-id', container.id);
    
    // Render categories assigned to this container
    container.categories.forEach(categoryName => {
      if (categoryGroups[categoryName]) {
        const categoryGroup = createCategoryGroup(categoryName, categoryGroups[categoryName], container.id, container.role);
        categoriesContainer.appendChild(categoryGroup);
      }
    });
    
    // Add drop zone for empty containers (visibility controlled by CSS)
    if (container.categories.length === 0) {
      const dropZone = document.createElement('div');
      dropZone.className = 'category-drop-zone';
      dropZone.innerHTML = '<div class="drop-zone-content">📦 Drop categories here</div>';
      categoriesContainer.appendChild(dropZone);
    }
    
    containerElement.appendChild(containerHeader);
    containerElement.appendChild(categoriesContainer);
    
    // Apply container styling AFTER all elements are created and added to the DOM
    applyContainerStyling(containerElement, container);
    

    
    return containerElement;
  }

  function createCategoryGroup(category, containers, containerId, parentRole) {
    const group = document.createElement('div');
    group.className = 'category-group';
    group.setAttribute('data-category', category);
    group.setAttribute('data-container-id', containerId);
    group.setAttribute('data-parent-role', parentRole);
    
    // Add CSS class based on parent role to ensure proper layout inheritance
    if (parentRole === 'row') {
      group.classList.add('parent-row');
    } else {
      group.classList.add('parent-column');
    }
    
    const header = document.createElement('div');
    header.className = 'category-header';
    
    const title = document.createElement('div');
    title.className = 'category-title';
    title.innerHTML = `<span>🏷️ ${category}</span>`;
    
    // Only create drag handle, don't set draggable attribute (conflicts with jQuery UI)
    const dragHandle = document.createElement('div');
    dragHandle.className = 'category-drag-handle';
    dragHandle.innerHTML = '⋮⋮⋮';
    dragHandle.title = 'Drag to reorder category or move to another container';
    
    header.appendChild(title);
    header.appendChild(dragHandle);
    
    const containersDiv = document.createElement('div');
    containersDiv.className = 'category-containers';
    
    containers.forEach(container => {
      const containerBox = renderCustomViewContainer(container);
      containersDiv.appendChild(containerBox);
    });
    
    group.appendChild(header);
    group.appendChild(containersDiv);
    
    return group;
  }

  function renderCustomViewContainer(container) {
    // Create a simplified container element for Custom View
    const containerBox = document.createElement('div');
    containerBox.className = 'container-box';
    containerBox.setAttribute('data-container-id', container.id);
    
    // Apply basic styling for Custom View (no Box View styling)
    containerBox.style.width = '100%';
    containerBox.style.display = 'inline-block';
    containerBox.style.verticalAlign = 'top';
    
    const header = document.createElement('div');
    header.className = 'container-header';
    
    const leftSide = document.createElement('div');
    leftSide.className = 'header-left';
    const iconHtml = renderIcon(container.icon);
    leftSide.innerHTML = `${iconHtml} <strong>${container.name}</strong>`;
    
    // Add category tags if they exist
    if (container.categories && container.categories.length > 0) {
      const categoryTags = document.createElement('div');
      categoryTags.className = 'category-tags';
      container.categories.forEach(category => {
        const tag = document.createElement('span');
        tag.className = 'category-tag';
        tag.textContent = category;
        categoryTags.appendChild(tag);
      });
      leftSide.appendChild(categoryTags);
    }
    
    if (container.url) {
      leftSide.style.cursor = 'pointer';
      leftSide.onclick = () => window.open(container.url, '_blank');
    }

    const rightSide = document.createElement('div');
    rightSide.className = 'header-right';
    
    // Create hamburger menu for container actions (simplified for Custom View)
    const hamburgerMenu = document.createElement('div');
    hamburgerMenu.className = 'hamburger-menu';
    hamburgerMenu.innerHTML = `
      <div class="hamburger-actions">
        <button onclick="showCreateModal('${container.id}')" title="Add Child Container">➕ Add</button>
        <button onclick="showEditModal('${container.id}')" title="Edit Container">✏️ Edit</button>
      </div>
      <button class="hamburger-btn" onclick="toggleHamburgerMenu(this, event)">☰</button>
    `;
    
    rightSide.appendChild(hamburgerMenu);

    header.appendChild(leftSide);
    header.appendChild(rightSide);
    containerBox.appendChild(header);

    // Only render children for containers that can have them
    const hasChildren = (container.children || []).length > 0;
    if (hasChildren) {
      const childBox = document.createElement('div');
      childBox.className = 'container-children';
      
      container.children.forEach(childId => {
        const childContainer = containers.find(c => c.id === childId);
        if (childContainer) {
          const childElement = renderCustomViewContainer(childContainer);
          childBox.appendChild(childElement);
        }
      });
      
      containerBox.appendChild(childBox);
    }
    
    return containerBox;
  }

  function applyContainerStyling(containerElement, container) {
    console.log('applyContainerStyling called for container:', container.name, 'has styling:', !!container.styling);
    if (!container.styling) {
      console.log('No styling found, returning early');
      return;
    }
    
    const style = container.styling;
    console.log('Container styling object:', style);
    
    // Apply header visibility - only hide when NOT in edit mode
    // In edit mode, we need to keep headers visible so users can access menus
    const containerHeader = containerElement.querySelector('.container-header');
    console.log('Found containerHeader element:', !!containerHeader);
    if (containerHeader) {
      console.log('applyContainerStyling - hideHeader:', style.hideHeader, 'isEditMode:', isEditMode, 'will hide:', style.hideHeader && !isEditMode);
      if (style.hideHeader && !isEditMode) {
        containerHeader.style.display = 'none';
        console.log('Hiding container header');
      } else {
        containerHeader.style.display = '';
        console.log('Showing container header');
      }
    } else {
      console.log('containerHeader element not found!');
    }
    
    // Apply background
    if (style.bgType === 'color' && style.backgroundColor) {
      containerElement.style.backgroundColor = style.backgroundColor;
    } else if (style.bgType === 'gradient' && style.backgroundGradient) {
      containerElement.style.background = style.backgroundGradient;
    } else if (style.bgType === 'css' && style.backgroundCSS) {
      containerElement.style.cssText += style.backgroundCSS;
    }
    
    // Apply background image
    if (style.backgroundImage) {
      containerElement.style.backgroundImage = `url('${style.backgroundImage}')`;
      containerElement.style.backgroundSize = 'cover';
      containerElement.style.backgroundPosition = 'center';
    }
    
    // Apply background opacity
    if (style.backgroundOpacity && style.backgroundOpacity !== 100) {
      containerElement.style.opacity = style.backgroundOpacity / 100;
    }
    
    // Apply border
    if (style.borderColor) {
      containerElement.style.borderColor = style.borderColor;
    }
    if (style.borderSize) {
      containerElement.style.borderWidth = style.borderSize + 'px';
    }
    if (style.borderStyle) {
      containerElement.style.borderStyle = style.borderStyle;
    }
    if (style.borderCSS) {
      containerElement.style.cssText += style.borderCSS;
    }
    
    // Apply additional styles
    if (style.borderRadius) {
      containerElement.style.borderRadius = style.borderRadius + 'px';
    }
    if (style.boxShadow) {
      containerElement.style.boxShadow = style.boxShadow;
    }
    if (style.padding) {
      containerElement.style.padding = style.padding + 'px';
    }
    if (style.margin) {
      containerElement.style.margin = style.margin + 'px';
    }
    if (style.customCSS) {
      containerElement.style.cssText += style.customCSS;
    }
  }
  
    function setupColumnSortable() {
    if (!isEditMode) {
      console.log('Not in edit mode, skipping sortable setup');
      return;
    }
    
    const columnsContainer = $('#columns-container');
    const categoryContainers = $('.column-categories');
    
    // Check if jQuery UI is available
    if (typeof $.ui === 'undefined' || typeof $.fn.sortable === 'undefined') {
      console.error('jQuery UI sortable is not available');
      showReorderFeedback('Error: jQuery UI not loaded', 'error');
      return;
    }
    
    // Verify DOM elements exist
    if (columnsContainer.length === 0) {
      console.error('Columns container not found in DOM');
      showReorderFeedback('Error: Columns container not found', 'error');
      return;
    }
    
    if (categoryContainers.length === 0) {
      console.warn('No category containers found in DOM');
    }
    
    console.log('Setting up column and category sortable');
    console.log('Columns container:', columnsContainer.length);
    console.log('Category containers:', categoryContainers.length);
    console.log('Category groups found:', $('.category-group').length);
    console.log('Edit mode active class present:', $('#container-root').hasClass('edit-mode-active'));
    console.log('Drag handles in DOM:', $('.category-drag-handle').length);
    console.log('Visible drag handles:', $('.category-drag-handle:visible').length);
    
    try {
      // Setup column reordering
      columnsContainer.sortable({
        items: '.column',
        handle: '.column-drag-handle',
        placeholder: 'column-placeholder',
        tolerance: 'pointer',
        cursor: 'grabbing',
        opacity: 0.9,
        distance: 8,
        axis: 'x', // Only horizontal dragging for columns
        helper: function(event, item) {
          const columnName = item.find('.column-title span').text();
          const helper = $('<div class="column-drag-helper"></div>');
          helper.css({
            'width': '200px',
            'height': '50px',
            'background': 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            'color': 'white',
            'border': '2px solid #1e7e34',
            'border-radius': '8px',
            'padding': '10px 15px',
            'font-size': '14px',
            'font-weight': 'bold',
            'text-align': 'center',
            'box-shadow': '0 8px 25px rgba(40, 167, 69, 0.5)',
            'z-index': '10000',
            'display': 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'cursor': 'grabbing',
            'user-select': 'none',
            'position': 'absolute'
          });
          helper.text(columnName);
          return helper;
        },
        cursorAt: { top: 25, left: 100 },
        start: function(event, ui) {
          console.log('Column sort started');
          ui.item.addClass('dragging');
          $('*').css('transition', 'none');
        },
        stop: function(event, ui) {
          console.log('Column sort stopped');
          ui.item.removeClass('dragging');
          $('*').css('transition', '');
          
          // Update column order
          const newOrder = [];
          columnsContainer.find('.column').each(function() {
            const columnId = $(this).attr('data-column-id');
            if (columnId) {
              newOrder.push(columnId);
            }
          });
          
          columnOrder = newOrder;
          showReorderFeedback('Columns reordered successfully! 📁', 'success');
        }
      });

      // Setup inter-column category dragging
      const categoryElements = $('.column-categories');
      console.log('Setting up category sortable on elements:', categoryElements.length);
      
      categoryElements.sortable({
        items: '.category-group',
        handle: '.category-drag-handle',
        placeholder: 'category-placeholder',
        tolerance: 'pointer',
        cursor: 'grabbing',
        opacity: 0.9,
        distance: 8,
        connectWith: '.column-categories', // Enable dragging between columns
        disabled: false, // Ensure it's enabled
        helper: function(event, item) {
          const categoryName = item.attr('data-category');
          const helper = $('<div class="category-drag-helper"></div>');
          helper.css({
            'width': '250px',
            'height': '50px',
            'background': 'linear-gradient(135deg, #0077cc 0%, #005fa3 100%)',
            'color': 'white',
            'border': '2px solid #004080',
            'border-radius': '8px',
            'padding': '10px 15px',
            'font-size': '14px',
            'font-weight': 'bold',
            'text-align': 'center',
            'box-shadow': '0 8px 25px rgba(0, 119, 204, 0.5)',
            'z-index': '10000',
            'display': 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'cursor': 'grabbing',
            'user-select': 'none',
            'position': 'absolute'
          });
          helper.text(`🏷️ ${categoryName}`);
          return helper;
        },
        cursorAt: { top: 25, left: 125 },
        start: function(event, ui) {
          console.log('Category sort started:', ui.item.attr('data-category'));
          ui.item.addClass('dragging');
          
          // Highlight drop zones
          $('.column-categories').addClass('drop-zone-active');
          $('.category-drop-zone').addClass('drag-over');
          
          $('*').css('transition', 'none');
        },
        stop: function(event, ui) {
          const categoryName = ui.item.attr('data-category');
          const newColumnId = ui.item.closest('.column-categories').attr('data-column-id');
          const oldColumnId = ui.item.attr('data-column-id');
          
          console.log('Category sort stopped:', categoryName, 'moved to column:', newColumnId);
          
          ui.item.removeClass('dragging');
          $('.column-categories').removeClass('drop-zone-active');
          $('.category-drop-zone').removeClass('drag-over');
          $('*').css('transition', '');
          
          // Update category's column assignment
          if (newColumnId !== oldColumnId) {
            moveCategoryToColumn(categoryName, oldColumnId, newColumnId);
            ui.item.attr('data-column-id', newColumnId);
            showReorderFeedback(`Category "${categoryName}" moved to new column! 🚀`, 'success');
          } else {
            // Update category order within the same column
            const newColumn = getContainerById(newColumnId);
            if (newColumn) {
              const newOrder = [];
              $(ui.item).closest('.column-categories').find('.category-group').each(function() {
                const cat = $(this).attr('data-category');
                if (cat) newOrder.push(cat);
              });
              newColumn.categories = newOrder;
              showReorderFeedback('Categories reordered within column! 📝', 'success');
            }
          }
        },
        over: function(event, ui) {
          $(ui.placeholder).closest('.column-categories').addClass('drag-over');
        },
        out: function(event, ui) {
          $('.column-categories').removeClass('drag-over');
        }
      });
      
      // Disable text selection during sorting
      columnsContainer.disableSelection();
      categoryElements.disableSelection();
      
      console.log('Column and category sortable setup complete');
      console.log('Sortable instances created:');
      console.log('- Columns container sortable:', $('#columns-container').hasClass('ui-sortable'));
      console.log('- Category containers sortable:', $('.column-categories.ui-sortable').length);
      console.log('- Category drag handles visible:', $('.category-drag-handle:visible').length);
      
      // Verify drag handles are visible in edit mode
      if ($('.category-drag-handle:visible').length === 0) {
        console.warn('No category drag handles are visible - check CSS edit-mode-active class');
      }
      
    } catch (error) {
      console.error('Failed to setup sortable:', error);
      showReorderFeedback('Failed to setup drag and drop', 'error');
    }
  }
  
  function showReorderFeedback(message, type = 'success') {
    // Remove any existing feedback
    const existingFeedback = document.querySelector('.reorder-feedback');
    if (existingFeedback) {
      existingFeedback.remove();
    }
    
    const feedback = document.createElement('div');
    feedback.className = 'reorder-feedback';
    
    const icon = type === 'success' ? '✅' : '❌';
    const bgColor = type === 'success' ? '#28a745' : '#dc3545';
    
    feedback.textContent = `${icon} ${message}`;
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: bold;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      animation: slideInFeedback 0.3s ease-out;
      max-width: 300px;
      word-wrap: break-word;
    `;
    
    // Add CSS animation if not already present
    if (!document.getElementById('feedback-styles')) {
      const style = document.createElement('style');
      style.id = 'feedback-styles';
      style.textContent = `
        @keyframes slideInFeedback {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutFeedback {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(feedback);
    
    // Remove after 3 seconds
    setTimeout(() => {
      feedback.style.animation = 'slideOutFeedback 0.3s ease-in';
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.parentNode.removeChild(feedback);
        }
      }, 300);
    }, 3000);
  }
  
    function toggleEditMode() {
    isEditMode = !isEditMode;
    const editBtn = document.getElementById('edit-mode-btn');
    const status = document.getElementById('edit-mode-status');
    const containerRoot = document.getElementById('container-root');
    const customToolbar = document.getElementById('custom-view-toolbar');
    
    if (!editBtn || !status || !containerRoot) {
      console.error('Required elements not found for edit mode');
      return;
    }
    
    console.log('Toggle edit mode, isEditMode:', isEditMode);
    
    if (isEditMode) {
      editBtn.textContent = '💾 Exit Edit Mode';
      editBtn.classList.add('edit-active');
      status.textContent = '📝 Edit Mode: Drag categories between containers, reorder containers, and style them. Container content is hidden for better performance.';
      
      // Force add the edit-mode-active class
      containerRoot.classList.add('edit-mode-active');
      console.log('Added edit-mode-active class to container root');
      console.log('Container root classes after adding:', containerRoot.className);
      
      // Also apply to toolbar so button visibility works
      if (customToolbar) {
        customToolbar.classList.add('edit-mode-active');
        console.log('Added edit-mode-active class to custom toolbar');
      }
      
      // Verify the class was added
      setTimeout(() => {
        console.log('Verification - Container root has edit-mode-active:', containerRoot.classList.contains('edit-mode-active'));
        console.log('Verification - Category drag handles visible count:', document.querySelectorAll('.category-drag-handle:not([style*="display: none"])').length);
      }, 100);
      
      // Re-render to show/hide drop zones and edit controls
      if (currentView === 'custom') {
        renderContainers();
        
        // Ensure edit mode class is still active after re-render
        if (!containerRoot.classList.contains('edit-mode-active')) {
          containerRoot.classList.add('edit-mode-active');
          console.log('Re-added edit-mode-active class after renderContainers');
        }
        
        // Update available categories zone
        updateAvailableCategoriesZone();
        
        // Show immediate feedback
        showReorderFeedback('Edit mode activated - drag categories between containers!', 'success');
        
        // Better timing to ensure DOM is ready and feedback is shown
        requestAnimationFrame(() => {
          setTimeout(() => {
            console.log('Setting up sortable from toggleEditMode...');
            console.log('Edit mode class present before setup:', containerRoot.classList.contains('edit-mode-active'));
            setupContainerSortable();
          }, 150);
        });
      }
      
      console.log('Edit mode activated - container editing enabled');
    } else {
      editBtn.textContent = '✏️ Edit Mode';
      editBtn.classList.remove('edit-active');
      status.textContent = 'Click Edit Mode to manage containers and categories';
      containerRoot.classList.remove('edit-mode-active');
      
      // Remove from toolbar too
      if (customToolbar) {
        customToolbar.classList.remove('edit-mode-active');
      }
      
      // Hide available categories zone
      const availableZone = document.getElementById('available-categories-zone');
      if (availableZone) {
        availableZone.classList.add('hidden');
      }
      
      // Destroy sortable instances
      try {
        if ($('#containers-container').hasClass('ui-sortable')) {
          $('#containers-container').sortable('destroy');
        }
        $('.container-categories').each(function() {
          if ($(this).hasClass('ui-sortable')) {
            $(this).sortable('destroy');
          }
        });
        if ($('#available-categories-list').hasClass('ui-sortable')) {
          $('#available-categories-list').sortable('destroy');
        }
        console.log('All sortable instances destroyed successfully');
      } catch (e) {
        console.warn('Failed to destroy sortable instances:', e);
      }
      
      // Re-render to hide drop zones and edit controls
      if (currentView === 'custom') {
        renderContainers();
      }
      
      // Save containers to backend when exiting edit mode
      saveCustomViewContainersToBackend()
        .then(() => {
          showReorderFeedback('Container configuration saved successfully! 💾', 'success');
        })
        .catch((error) => {
          console.error('Failed to save containers:', error);
          showReorderFeedback('Failed to save container configuration', 'error');
        });
      
      console.log('Edit mode deactivated - containers saved to backend');
    }
  }

  // Column management functions
  function addNewColumn() {
    if (!isEditMode) {
      showReorderFeedback('Please enable Edit Mode first', 'error');
      return;
    }
    
    // Create column with a default name that can be edited
    const columnNumber = columns.length + 1;
    const defaultName = `Column ${columnNumber}`;
    const newColumn = createNewColumn(defaultName);
    showReorderFeedback(`Column "${newColumn.name}" created! Click the name to edit it. 🎉`, 'success');
    
    // Re-render to show new column and maintain edit mode
    renderContainers();
    
    // Ensure edit mode styling is maintained after render
    if (isEditMode && currentView === 'custom') {
      requestAnimationFrame(() => {
        setTimeout(() => {
          console.log('Setting up sortable from addNewColumn...');
          setupColumnSortable();
        }, 150);
      });
    }
  }

  function deleteColumn(columnId) {
    if (!isEditMode) return;
    
    const column = getColumnById(columnId);
    if (!column) return;
    
    if (columns.length <= 1) {
      showReorderFeedback('Cannot delete the last column!', 'error');
      return;
    }
    
    // Check if column is empty
    if (column.categories.length > 0) {
      showReorderFeedback(`Cannot delete column "${column.name}" - it contains ${column.categories.length} categories. Move or remove categories first.`, 'error');
      return;
    }
    
    const confirmDelete = confirm(`Are you sure you want to delete the empty column "${column.name}"?`);
    if (!confirmDelete) return;
    
    // Remove column
    const columnIndex = columns.findIndex(col => col.id === columnId);
    if (columnIndex > -1) {
      columns.splice(columnIndex, 1);
    }
    
    const orderIndex = columnOrder.indexOf(columnId);
    if (orderIndex > -1) {
      columnOrder.splice(orderIndex, 1);
    }
    
    showReorderFeedback(`Empty column "${column.name}" deleted successfully! 🗑️`, 'success');
    renderContainers(); // Re-render to reflect changes
    
    // Maintain edit mode after deletion
    if (isEditMode && currentView === 'custom') {
      requestAnimationFrame(() => {
        setTimeout(() => {
          console.log('Setting up sortable from deleteColumn...');
          setupColumnSortable();
        }, 150);
      });
    }
  }

  function showColumnStyleModal(columnId) {
    selectedColumnId = columnId;
    const column = getContainerById(columnId);
    if (!column) return;
    
    const form = document.getElementById('column-styling-form');
    form.columnId.value = columnId;
    
    // Populate form with existing styling
    if (column.styling) {
      const style = column.styling;
      
      // Visibility settings
      form.hideHeader.checked = style.hideHeader || false;
      console.log('Loading existing styling - hideHeader:', style.hideHeader);
      
      // Background fields
      form.bgType.value = style.bgType || 'color';
      form.backgroundColor.value = style.backgroundColor || '#f9f9f9';
      form.backgroundGradient.value = style.backgroundGradient || '';
      form.backgroundCSS.value = style.backgroundCSS || '';
      form.backgroundImage.value = style.backgroundImage || '';
      form.backgroundOpacity.value = style.backgroundOpacity || '100';
      
      // Border fields
      form.borderColor.value = style.borderColor || '#e0e0e0';
      form.borderSize.value = style.borderSize || '2';
      form.borderStyle.value = style.borderStyle || 'solid';
      form.borderCSS.value = style.borderCSS || '';
      
      // Additional fields
      form.customCSS.value = style.customCSS || '';
      form.borderRadius.value = style.borderRadius || '8';
      form.boxShadow.value = style.boxShadow || '0 2px 4px rgba(0,0,0,0.1)';
      form.padding.value = style.padding || '15';
      form.margin.value = style.margin || '10';
    } else {
      // Set default values
      form.hideHeader.checked = false;
      form.bgType.value = 'color';
      form.backgroundColor.value = '#f9f9f9';
      form.backgroundGradient.value = '';
      form.backgroundCSS.value = '';
      form.backgroundImage.value = '';
      form.backgroundOpacity.value = '100';
      form.borderColor.value = '#e0e0e0';
      form.borderSize.value = '2';
      form.borderStyle.value = 'solid';
      form.borderCSS.value = '';
      form.customCSS.value = '';
      form.borderRadius.value = '8';
      form.boxShadow.value = '0 2px 4px rgba(0,0,0,0.1)';
      form.padding.value = '15';
      form.margin.value = '10';
    }
    
    // Update background options
    updateColumnBackgroundOptions();
    
    // Update range value display
    document.getElementById('column-opacity-value').textContent = form.backgroundOpacity.value + '%';
    
    document.getElementById('column-styling-modal').classList.remove('hidden');
  }

  function hideColumnStyleModal() {
    document.getElementById('column-styling-modal').classList.add('hidden');
  }

  function updateColumnBackgroundOptions() {
    const bgType = document.querySelector('form#column-styling-form select[name="bgType"]').value;
    
    // Hide all options
    document.getElementById('column-bg-color-option').classList.add('hidden');
    document.getElementById('column-bg-gradient-option').classList.add('hidden');
    document.getElementById('column-bg-css-option').classList.add('hidden');
    
    // Show selected option
    document.getElementById('column-bg-' + bgType + '-option').classList.remove('hidden');
  }

  function makeColumnTitleEditable(titleSpan, columnId) {
    console.log('makeColumnTitleEditable called:', { isEditMode, columnId });
    
    if (!isEditMode) {
      console.log('Edit mode is not active, cannot edit');
      showReorderFeedback('Please enable Edit Mode first', 'error');
      return;
    }
    
    const column = getContainerById(columnId);
    if (!column) {
      console.log('Column not found:', columnId);
      return;
    }
    
    console.log('Starting edit for column:', column.name);
    
    // Get current name without emoji
    const currentName = column.name;
    
    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'column-title-input';
    input.style.cssText = `
      background: white;
      border: 2px solid #0077cc;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 14px;
      font-weight: bold;
      width: 150px;
      box-shadow: 0 2px 8px rgba(0, 119, 204, 0.3);
      z-index: 1000;
    `;
    
    // Replace span with input
    titleSpan.style.display = 'none';
    titleSpan.parentElement.appendChild(input);
    
    // Focus and select all text
    input.focus();
    input.select();
    
    console.log('Input created and focused');
    
    let isEditing = true; // Flag to prevent multiple saves
    
    // Handle saving
    const saveEdit = () => {
      if (!isEditing) return; // Prevent multiple saves
      isEditing = false;
      
      console.log('Saving edit...');
      const newName = input.value.trim();
      if (newName && newName !== currentName) {
        // Update column data
        column.name = newName;
        titleSpan.textContent = `📁 ${newName}`;
        showReorderFeedback(`Column renamed to "${newName}" 📝`, 'success');
        
        // Auto-save to backend
        saveCustomViewContainersToBackend()
          .then(() => {
            console.log('Column name updated and saved to backend');
          })
          .catch((error) => {
            console.error('Failed to save column name change:', error);
            showReorderFeedback('Failed to save column name change', 'error');
          });
      }
      
      // Restore span and remove input
      titleSpan.style.display = '';
      if (input.parentElement) {
        input.parentElement.removeChild(input);
      }
    };
    
    // Handle canceling
    const cancelEdit = () => {
      if (!isEditing) return; // Prevent multiple cancels
      isEditing = false;
      
      console.log('Canceling edit...');
      titleSpan.style.display = '';
      if (input.parentElement) {
        input.parentElement.removeChild(input);
      }
    };
    
    // Event listeners with debouncing to prevent issues
    let blurTimeout;
    input.addEventListener('blur', (e) => {
      // Use timeout to allow other events (like Enter) to cancel the blur
      blurTimeout = setTimeout(() => {
        if (isEditing) {
          saveEdit();
        }
      }, 100);
    });
    
    input.addEventListener('keydown', (e) => {
      console.log('Key pressed:', e.key);
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(blurTimeout); // Cancel blur timeout
        saveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        clearTimeout(blurTimeout); // Cancel blur timeout
        cancelEdit();
      }
    });
    
    // Prevent clicks from propagating to parent elements
    input.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Clear timeout if input gets focus again
    input.addEventListener('focus', () => {
      clearTimeout(blurTimeout);
    });
  }
  
  function renderBox(container, term, depth = 0) {
    const box = document.createElement('div');
    box.className = 'container-box';
    box.setAttribute('data-container-id', container.id);
    
    // Apply custom styling
    applyContainerStyling(box, container);
    
    // Check if this container has children
    const hasChildren = (container.children || []).length > 0;
    
    // Check if this is a root-level container (depth 0)
    const isRootLevel = depth === 0;
    
    // Apply width logic based on hierarchy and type
    if (isRootLevel) {
      // Root level containers get 100% width
      const widthSlider = document.getElementById('width-slider');
      if (widthSlider) {
        box.style.width = widthSlider.value + '%';
        box.style.display = 'inline-block';
        box.style.verticalAlign = 'top';
      }
    } else {
      // Child containers only get width if they are specific types
      if (['Application', 'LXC Container', 'Docker Container'].includes(container.type)) {
        // Only apply fixed dimensions if they don't have children
        if (!hasChildren) {
          box.style.height = '76px';
          box.style.width = '290px';
          box.style.minHeight = '76px';
          box.style.minWidth = '290px';
          box.style.maxHeight = '76px';
          box.style.maxWidth = '290px';
          box.style.display = 'inline-block';
          box.style.verticalAlign = 'top';
        }
        // If they have children, don't apply any fixed dimensions
      }
      // For other child container types, don't set any width (let them size naturally)
    }

    const header = document.createElement('div');
    header.className = 'container-header';
    
    // Apply title bar styling
    applyTitleBarStyling(header, container);

    const leftSide = document.createElement('div');
    leftSide.className = 'header-left';
    const iconHtml = renderIcon(container.icon);
    leftSide.innerHTML = `${iconHtml} <strong>${container.name}</strong>`;
    
    // Add category tags if they exist
    if (container.categories && container.categories.length > 0) {
      const categoryTags = document.createElement('div');
      categoryTags.className = 'category-tags';
      container.categories.forEach(category => {
        const tag = document.createElement('span');
        tag.className = 'category-tag';
        tag.textContent = category;
        categoryTags.appendChild(tag);
      });
      leftSide.appendChild(categoryTags);
    }
    
    if (container.url) {
      leftSide.style.cursor = 'pointer';
      leftSide.onclick = () => window.open(container.url, '_blank');
    }

    const rightSide = document.createElement('div');
    rightSide.className = 'header-right';
    
    // Check if this is a fixed-size container (only show for containers that can have children)
    const isFixedSize = ['Application', 'LXC Container', 'Docker Container'].includes(container.type) && !hasChildren;
    
    // Create hamburger menu for container actions
    const hamburgerMenu = document.createElement('div');
    hamburgerMenu.className = 'hamburger-menu';
    hamburgerMenu.innerHTML = `
      <div class="hamburger-actions">
        <button onclick="showCreateModal('${container.id}')" title="Add Child Container">➕ Add</button>
        <button onclick="showEditModal('${container.id}')" title="Edit Container">✏️ Edit</button>
        ${!isFixedSize ? `<button onclick="toggleChildren(this)" title="Toggle Children">🔽 Toggle</button>` : ''}
      </div>
      <button class="hamburger-btn" onclick="toggleHamburgerMenu(this, event)">☰</button>
    `;
    
    rightSide.appendChild(hamburgerMenu);

    header.appendChild(leftSide);
    header.appendChild(rightSide);
    box.appendChild(header);

    // Only render children for non-fixed-size containers
    if (!isFixedSize) {
      const childBox = document.createElement('div');
      childBox.className = 'container-children';

      (container.children || []).forEach(c => {
        if (matchesSearch(c, term) || hasMatchingChild(c, term)) {
          childBox.appendChild(renderBox(c, term, depth + 1));
        }
      });

      box.appendChild(childBox);
    }

    return box;
  }
  
  function applyContainerStyling(box, container) {
    if (!container.styling) return;
    
    const style = container.styling;
    
    // Apply background
    if (style.bgType === 'color' && style.backgroundColor) {
      box.style.backgroundColor = style.backgroundColor;
    } else if (style.bgType === 'gradient' && style.backgroundGradient) {
      box.style.background = style.backgroundGradient;
    } else if (style.bgType === 'css' && style.backgroundCSS) {
      box.style.cssText += style.backgroundCSS;
    }
    
    // Apply background image
    if (style.backgroundImage) {
      box.style.backgroundImage = `url('${style.backgroundImage}')`;
      box.style.backgroundSize = 'cover';
      box.style.backgroundPosition = 'center';
    }
    
    // Apply background opacity
    if (style.backgroundOpacity && style.backgroundOpacity !== '100') {
      box.style.opacity = style.backgroundOpacity / 100;
    }
    
    // Apply border
    if (style.borderColor) {
      box.style.borderColor = style.borderColor;
    }
    if (style.borderSize) {
      box.style.borderWidth = style.borderSize + 'px';
    }
    if (style.borderStyle) {
      box.style.borderStyle = style.borderStyle;
    }
    if (style.borderCSS) {
      box.style.cssText += style.borderCSS;
    }
    
    // Apply additional styles
    if (style.borderRadius) {
      box.style.borderRadius = style.borderRadius + 'px';
    }
    if (style.boxShadow) {
      box.style.boxShadow = style.boxShadow;
    }
    if (style.padding) {
      box.style.padding = style.padding + 'px';
    }
    if (style.margin) {
      box.style.margin = style.margin + 'px';
    }
    if (style.customCSS) {
      box.style.cssText += style.customCSS;
    }
  }
  
  function applyTitleBarStyling(header, container) {
    if (!container.styling) return;
    
    const style = container.styling;
    
    // Apply title background
    if (style.titleBgType === 'color' && style.titleBackgroundColor) {
      header.style.backgroundColor = style.titleBackgroundColor;
    } else if (style.titleBgType === 'gradient' && style.titleBackgroundGradient) {
      header.style.background = style.titleBackgroundGradient;
    } else if (style.titleBgType === 'css' && style.titleBackgroundCSS) {
      header.style.cssText += style.titleBackgroundCSS;
    }
    
    // Apply title background image
    if (style.titleBackgroundImage) {
      header.style.backgroundImage = `url('${style.titleBackgroundImage}')`;
      header.style.backgroundSize = 'cover';
      header.style.backgroundPosition = 'center';
    }
    
    // Apply title background opacity
    if (style.titleBackgroundOpacity && style.titleBackgroundOpacity !== '100') {
      header.style.opacity = style.titleBackgroundOpacity / 100;
    }
  }
  
  function renderTreeItem(container, term) {
    const item = document.createElement('div');
    item.className = 'tree-item';
  
    const header = document.createElement('div');
    header.className = 'tree-item-header';
  
    const hasChildren = (container.children || []).length > 0;
    const toggleIcon = hasChildren ? '🔽' : '';
  
    let categoryTagsHtml = '';
    if (container.categories && container.categories.length > 0) {
      categoryTagsHtml = '<div class="category-tags">' + 
        container.categories.map(category => `<span class="category-tag">${category}</span>`).join('') + 
        '</div>';
    }
    
    header.innerHTML = `
      <span class="tree-toggle" onclick="toggleTreeItem(this)">${toggleIcon}</span>
      <div class="tree-item-content-wrapper">
        <span class="tree-item-left">${renderIcon(container.icon)} <strong>${container.name}</strong>${categoryTagsHtml}</span>
        <span class="tree-item-right">
          <button onclick="showCreateModal('${container.id}')">➕</button>
          <button onclick="showEditModal('${container.id}')">✏️</button>
        </span>
      </div>
    `;
  
    if (container.url) {
      header.style.cursor = 'pointer';
      header.onclick = (e) => {
        if (!e.target.closest('button')) {
          window.open(container.url, '_blank');
        }
      };
    }
  
    item.appendChild(header);
  
    if (hasChildren) {
      const content = document.createElement('div');
      content.className = 'tree-item-content';
      (container.children || []).forEach(c => {
        if (matchesSearch(c, term) || hasMatchingChild(c, term)) {
          content.appendChild(renderTreeItem(c, term));
        }
      });
      item.appendChild(content);
    }
  
    return item;
  }
  
  function toggleTreeItem(toggleBtn) {
    const content = toggleBtn.parentElement.nextSibling;
    if (content && content.classList.contains('tree-item-content')) {
      content.classList.toggle('hidden');
      toggleBtn.textContent = content.classList.contains('hidden') ? '▶️' : '🔽';
    }
  }
  
  function toggleChildren(btn) {
    // Find the container box that contains this button
    const containerBox = btn.closest('.container-box');
    if (!containerBox) return;
    
    // Find the child box within this container
    const childBox = containerBox.querySelector('.container-children');
    if (!childBox) return;
    
    if (childBox.style.display === 'none') {
      childBox.style.display = '';
      btn.textContent = '🔽 Toggle';
    } else {
      childBox.style.display = 'none';
      btn.textContent = '▶️ Toggle';
    }
  }
  
  function matchesSearch(container, term) {
    return container.name.toLowerCase().includes(term) || (container.ip || '').toLowerCase().includes(term);
  }
  
  function hasMatchingChild(container, term) {
    return (container.children || []).some(c => matchesSearch(c, term) || hasMatchingChild(c, term));
  }
  
  function renderIcon(iconData) {
    if (!iconData || !iconData.type || !iconData.value) return '';
    const iconSize = iconData.size || 30;
    const iconColor = iconData.color || '#000000';
  
    switch (iconData.type) {
      case 'emoji':
        return iconData.value;
      case 'favicon':
        return `<img src="${getFaviconUrl(iconData.value)}" style="width:${iconSize}px;height:${iconSize}px;" onerror="this.style.display='none'">`;
      case 'fontawesome':
        return `<i class="${iconData.value}" style="font-size:${iconSize}px;color:${iconColor};"></i>`;
      case 'simpleicons':
        return `<img src="https://cdn.simpleicons.org/${iconData.value}" style="width:${iconSize}px;height:${iconSize}px;" onerror="this.style.display='none'">`;
      case 'material':
        return `<i class="mdi mdi-${iconData.value}" style="font-size:${iconSize}px;color:${iconColor};"></i>`;
      case 'homelab':
        return `<img src="https://raw.githubusercontent.com/WalkxCode/dashboard-icons/master/png/${iconData.value}.png" style="width:${iconSize}px;height:${iconSize}px;" onerror="this.style.display='none'">`;
      case 'generative':
        return `<img src="https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(iconData.value)}" style="width:${iconSize}px;height:${iconSize}px;">`;
      case 'url':
        return `<img src="${iconData.value}" style="width:${iconSize}px;height:${iconSize}px;" onerror="this.style.display='none'">`;
      default:
        return '';
    }
  }
  
  function switchView(view) {
    // Clean up any existing sortable instances before switching views
    try {
      // Destroy column sortable
      if ($.fn.sortable && $('#columns-container').length && $('#columns-container').hasClass('ui-sortable')) {
        $('#columns-container').sortable('destroy');
        console.log('Destroyed columns-container sortable during view switch');
      }
      
      // Destroy all category sortables
      $('.column-categories').each(function() {
        if ($(this).hasClass('ui-sortable')) {
          $(this).sortable('destroy');
          console.log('Destroyed column-categories sortable during view switch');
        }
      });
      
      // Destroy root sortable if it exists
      const $containerRoot = $('#container-root');
      if ($containerRoot.hasClass('ui-sortable')) {
        $containerRoot.sortable('destroy');
        console.log('Destroyed container-root sortable during view switch');
      }
    } catch (e) {
      console.warn('Failed to destroy sortable during view switch:', e);
    }
    
    // Reset edit mode when switching views
    if (currentView === 'custom' && isEditMode) {
      isEditMode = false;
      const editBtn = document.getElementById('edit-mode-btn');
      const status = document.getElementById('edit-mode-status');
      const containerRoot = document.getElementById('container-root');
      const customToolbar = document.getElementById('custom-view-toolbar');
      
      if (editBtn) editBtn.textContent = '✏️ Edit Mode';
      if (editBtn) editBtn.classList.remove('edit-active');
      if (status) status.textContent = 'Click Edit Mode to reorder categories';
      if (containerRoot) containerRoot.classList.remove('edit-mode-active');
      if (customToolbar) customToolbar.classList.remove('edit-mode-active');
    }
    
    currentView = view;
    document.getElementById('box-view-btn').classList.toggle('active', view === 'box');
    document.getElementById('tree-view-btn').classList.toggle('active', view === 'tree');
    document.getElementById('custom-view-btn').classList.toggle('active', view === 'custom');
    
    // Show/hide custom view toolbar
    const customToolbar = document.getElementById('custom-view-toolbar');
    const addContainerBtn = document.getElementById('add-container-btn');
    
    if (view === 'custom') {
      customToolbar.classList.remove('hidden');
      addContainerBtn.style.display = 'none'; // Hide add container button in custom view
    } else {
      customToolbar.classList.add('hidden');
      addContainerBtn.style.display = 'inline-block'; // Show add container button in other views
    }
    
    renderContainers();
  }
  
  function filterHomeLabIcons() {
    const searchTerm = document.getElementById('hl-search').value.toLowerCase();
    
    // Reset loaded count when starting a new search
    if (searchTerm) {
      homelabIconsLoaded = 0;
    }
    
    // Use the new loading system
    loadMoreHomeLabIcons();
  }
  
  function createIconItem(icon) {
    const item = document.createElement('div');
    item.className = 'icon-item';
    const img = document.createElement('img');
    img.src = `https://raw.githubusercontent.com/WalkxCode/dashboard-icons/master/png/${icon.icon}.png`;
    img.className = 'hl';
    img.onerror = () => item.remove();
    item.appendChild(img);
    item.title = icon.name;
    item.onclick = () => selectIcon('homelab', icon.icon);
    return item;
  }
  
  function filterMaterialIcons() {
    const searchTerm = document.getElementById('mdi-search').value.toLowerCase();
    
    // Reset loaded count when starting a new search
    if (searchTerm) {
      materialIconsLoaded = 0;
    }
    
    // Use the new loading system
    loadMoreMaterialIcons();
  }
  
  function filterSimpleIcons() {
    const searchTerm = document.getElementById('si-search').value.toLowerCase();
    
    // Reset loaded count when starting a new search
    if (searchTerm) {
      simpleIconsLoaded = 0;
    }
    
    // Use the new loading system
    loadMoreSimpleIcons();
  }
  
  function filterEmojiIcons() {
    const searchTerm = document.getElementById('emoji-search').value.toLowerCase();
    
    // Reset loaded count when starting a new search
    if (searchTerm) {
      emojiIconsLoaded = 0;
    }
    
    // Use the new loading system
    loadMoreEmojiIcons();
  }

  function updateContainerWidth(width) {
    const containerBoxes = document.querySelectorAll('.container-box');
    containerBoxes.forEach(box => {
      // Only apply width to root-level containers (those without a parent)
      // We can identify root containers by checking if they have the width style applied
      // Root containers will have a percentage width, while child containers won't
      if (box.style.width && box.style.width.includes('%')) {
        box.style.width = width + '%';
      }
    });
  }
  
  function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Add active class to clicked tab button
    event.target.classList.add('active');
  }

  function switchContainerTab(tabName) {
    // Hide all tab contents in the container modal
    const modal = document.getElementById('container-styling-modal');
    modal.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons in the container modal
    modal.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Show selected tab content
    modal.querySelector('#' + tabName + '-tab').classList.add('active');
    
    // Add active class to clicked tab button
    event.target.classList.add('active');
  }
  
  function updateBackgroundOptions() {
    const bgType = document.querySelector('select[name="bgType"]').value;
    
    // Hide all options
    document.getElementById('bg-color-option').classList.add('hidden');
    document.getElementById('bg-gradient-option').classList.add('hidden');
    document.getElementById('bg-css-option').classList.add('hidden');
    
    // Show selected option
    document.getElementById('bg-' + bgType + '-option').classList.remove('hidden');
  }
  
  function updateTitleBackgroundOptions() {
    const titleBgType = document.querySelector('select[name="titleBgType"]').value;
    
    // Hide all options
    document.getElementById('title-bg-color-option').classList.add('hidden');
    document.getElementById('title-bg-gradient-option').classList.add('hidden');
    document.getElementById('title-bg-css-option').classList.add('hidden');
    
    // Show selected option
    document.getElementById('title-bg-' + titleBgType + '-option').classList.remove('hidden');
  }
  
  function updatePageBackgroundOptions() {
    const pageBgType = document.querySelector('select[name="pageBgType"]').value;
    
    // Hide all options
    document.getElementById('page-bg-color-option').classList.add('hidden');
    document.getElementById('page-bg-gradient-option').classList.add('hidden');
    document.getElementById('page-bg-css-option').classList.add('hidden');
    
    // Show selected option
    document.getElementById('page-bg-' + pageBgType + '-option').classList.remove('hidden');
  }
  
  function showPageSettings() {
    document.getElementById('page-settings-modal').classList.remove('hidden');
    loadPageSettings();
  }
  
  function hidePageSettings() {
    document.getElementById('page-settings-modal').classList.add('hidden');
  }
  
  function loadPageSettings() {
    const settings = JSON.parse(localStorage.getItem('pageSettings') || '{}');
    const form = document.getElementById('page-settings-form');
    
    // Set default values
    Object.keys(form.elements).forEach(key => {
      const element = form.elements[key];
      if (element.name && settings[element.name] !== undefined) {
        if (element.type === 'range') {
          element.value = settings[element.name];
          updateRangeValue(element);
        } else {
          element.value = settings[element.name];
        }
      }
    });
    
    // Update background options
    updatePageBackgroundOptions();
  }
  
  function updateRangeValue(element) {
    const valueSpan = document.getElementById(element.name + '-value');
    if (valueSpan) {
      valueSpan.textContent = element.value + (element.name.includes('Opacity') ? '%' : 'px');
    }
  }
  
  function applyPageSettings(settings) {
    const body = document.body;
    const containerRoot = document.getElementById('container-root');
    
    // Apply background
    let background = '';
    if (settings.pageBgType === 'color') {
      background = `background-color: ${settings.pageBackgroundColor};`;
    } else if (settings.pageBgType === 'gradient') {
      background = `background: ${settings.pageBackgroundGradient};`;
    } else if (settings.pageBgType === 'css') {
      background = settings.pageBackgroundCSS;
    }
    
    if (settings.pageBackgroundImage) {
      background += ` background-image: url('${settings.pageBackgroundImage}'); background-size: cover; background-position: center;`;
    }
    
    if (settings.pageBackgroundOpacity !== 100) {
      background += ` opacity: ${settings.pageBackgroundOpacity / 100};`;
    }
    
    if (background) {
      body.style.cssText += background;
    }
    
    // Apply layout settings
    if (settings.containerSpacing !== undefined) {
      containerRoot.style.gap = settings.containerSpacing + 'px';
    }
    
    if (settings.pagePadding !== undefined) {
      containerRoot.style.padding = settings.pagePadding + 'px';
    }
    
    // Apply theme
    if (settings.theme) {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
    
    // Apply font settings
    if (settings.fontFamily) {
      body.style.fontFamily = settings.fontFamily;
    }
    
    if (settings.fontSize) {
      body.style.fontSize = settings.fontSize + 'px';
    }
  }
  
  // Add event listeners for range inputs
  document.addEventListener('DOMContentLoaded', function() {
    // Container modal range inputs
    const opacityRange = document.querySelector('input[name="backgroundOpacity"]');
    if (opacityRange) {
      opacityRange.addEventListener('input', function() {
        document.getElementById('opacity-value').textContent = this.value + '%';
      });
    }
    
    const titleOpacityRange = document.querySelector('input[name="titleBackgroundOpacity"]');
    if (titleOpacityRange) {
      titleOpacityRange.addEventListener('input', function() {
        document.getElementById('title-opacity-value').textContent = this.value + '%';
      });
    }
    
    // Page settings range inputs
    const pageOpacityRange = document.querySelector('input[name="pageBackgroundOpacity"]');
    if (pageOpacityRange) {
      pageOpacityRange.addEventListener('input', function() {
        document.getElementById('page-opacity-value').textContent = this.value + '%';
      });
    }
    
    const defaultWidthRange = document.querySelector('input[name="defaultContainerWidth"]');
    if (defaultWidthRange) {
      defaultWidthRange.addEventListener('input', function() {
        document.getElementById('default-width-value').textContent = this.value + '%';
      });
    }
    
    // Page settings form submission
    const pageSettingsForm = document.getElementById('page-settings-form');
    if (pageSettingsForm) {
      pageSettingsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const settings = {};
        
        for (let [key, value] of formData.entries()) {
          settings[key] = value;
        }
        
        // Save to localStorage
        localStorage.setItem('pageSettings', JSON.stringify(settings));
        
        // Apply settings
        applyPageSettings(settings);
        
        // Hide modal
        hidePageSettings();
      });
    }

    // Column styling form submission
    const columnStylingForm = document.getElementById('column-styling-form');
    if (columnStylingForm) {
      columnStylingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const columnId = formData.get('columnId');
        const column = getContainerById(columnId);
        
        if (!column) return;
        
        // Update column styling
        const hideHeaderValue = formData.get('hideHeader');
        console.log('Form submission - hideHeader checkbox value:', hideHeaderValue, 'becomes boolean:', hideHeaderValue === 'on');
        const styling = {
          hideHeader: hideHeaderValue === 'on',
          bgType: formData.get('bgType'),
          backgroundColor: formData.get('backgroundColor'),
          backgroundGradient: formData.get('backgroundGradient'),
          backgroundCSS: formData.get('backgroundCSS'),
          backgroundImage: formData.get('backgroundImage'),
          backgroundOpacity: formData.get('backgroundOpacity'),
          borderColor: formData.get('borderColor'),
          borderSize: formData.get('borderSize'),
          borderStyle: formData.get('borderStyle'),
          borderCSS: formData.get('borderCSS'),
          customCSS: formData.get('customCSS'),
          borderRadius: formData.get('borderRadius'),
          boxShadow: formData.get('boxShadow'),
          padding: formData.get('padding'),
          margin: formData.get('margin')
        };
        
        column.styling = styling;
        
        // Apply styling immediately to the specific column
        const columnElement = document.querySelector(`[data-column-id="${columnId}"]`);
        if (columnElement) {
          applyContainerStyling(columnElement, column);
          console.log('Applied styling immediately to column:', column.name);
        }
        
        // Save to backend
        saveCustomViewContainersToBackend()
          .then(() => {
            showReorderFeedback(`Column "${column.name}" styling saved successfully! 🎨`, 'success');
            hideColumnStyleModal();
            renderContainers(); // Re-render to apply new styling and maintain edit mode state
          })
          .catch((error) => {
            console.error('Failed to save column styling:', error);
            showReorderFeedback('Failed to save column styling', 'error');
          });
      });
    }

    // Column styling range inputs
    const columnOpacityRange = document.querySelector('form#column-styling-form input[name="backgroundOpacity"]');
    if (columnOpacityRange) {
      columnOpacityRange.addEventListener('input', function() {
        document.getElementById('column-opacity-value').textContent = this.value + '%';
      });
    }
    
    // Load and apply saved page settings
    const savedSettings = JSON.parse(localStorage.getItem('pageSettings') || '{}');
    if (Object.keys(savedSettings).length > 0) {
      applyPageSettings(savedSettings);
    }
  });
  
  function toggleHamburgerMenu(btn, event) {
    event.stopPropagation();
    event.preventDefault();
    console.log('toggleHamburgerMenu called');
    
    // Close any other open hamburger menus
    document.querySelectorAll('.hamburger-menu').forEach(menu => {
      if (menu !== btn.parentElement) {
        menu.classList.remove('show');
        // Remove the class from the container box
        const containerBox = menu.closest('.container-box');
        if (containerBox) {
          containerBox.classList.remove('hamburger-active');
        }
      }
    });
    
    const hamburgerMenu = btn.parentElement;
    const isVisible = hamburgerMenu.classList.contains('show');
    const containerBox = hamburgerMenu.closest('.container-box');
    console.log('Hamburger menu element:', hamburgerMenu);
    console.log('Is visible:', isVisible);
    
    if (isVisible) {
      // Hide menu
      console.log('Hiding hamburger menu');
      hamburgerMenu.classList.remove('show');
      if (containerBox) {
        containerBox.classList.remove('hamburger-active');
      }
    } else {
      // Show menu
      console.log('Showing hamburger menu');
      hamburgerMenu.classList.add('show');
      if (containerBox) {
        containerBox.classList.add('hamburger-active');
      }
      console.log('Added show class, menu classes:', hamburgerMenu.className);
    }
  }

  function toggleColumnHamburgerMenu(btn, event) {
    event.stopPropagation();
    event.preventDefault();
    console.log('toggleColumnHamburgerMenu called');
    
    // Close any other open column hamburger menus
    document.querySelectorAll('.column-hamburger-menu').forEach(menu => {
      if (menu !== btn.parentElement) {
        menu.classList.remove('show');
      }
    });
    
    const hamburgerMenu = btn.parentElement;
    const isVisible = hamburgerMenu.classList.contains('show');
    console.log('Column hamburger menu element:', hamburgerMenu);
    console.log('Is visible:', isVisible);
    
    if (isVisible) {
      // Hide menu
      console.log('Hiding column hamburger menu');
      hamburgerMenu.classList.remove('show');
    } else {
      // Show menu
      console.log('Showing column hamburger menu');
      hamburgerMenu.classList.add('show');
      console.log('Added show class, menu classes:', hamburgerMenu.className);
    }
  }
  
  // Close hamburger menus when clicking outside
  document.addEventListener('click', function(event) {
    // Close container hamburger menus
    if (!event.target.closest('.hamburger-menu')) {
      document.querySelectorAll('.hamburger-menu').forEach(menu => {
        menu.classList.remove('show');
        // Remove the class from the container box
        const containerBox = menu.closest('.container-box');
        if (containerBox) {
          containerBox.classList.remove('hamburger-active');
        }
      });
    }
    
    // Close column hamburger menus
    if (!event.target.closest('.column-hamburger-menu')) {
      document.querySelectorAll('.column-hamburger-menu').forEach(menu => {
        menu.classList.remove('show');
      });
    }
  });
  
  // Prevent menu from closing when clicking inside it
  document.addEventListener('click', function(event) {
    if (event.target.closest('.hamburger-actions') || event.target.closest('.column-hamburger-actions')) {
      event.stopPropagation();
    }
  });
  
  // Initialize Socket.IO connection
  function initializeSocketIO() {
    socket = io();
    
    socket.on('connect', () => {
      console.log('Connected to server via Socket.IO');
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
    
    // Handle real-time agent data updates
    socket.on('agent-data', (data) => {
      console.log('Received agent data:', data);
      agentData.set(data.containerId, data.data);
      updateContainerMetrics(data.containerId, data.data);
    });
    
    // Handle agent status updates
    socket.on('agent-status', (status) => {
      console.log('Agent status update:', status);
      updateAgentStatus(status.containerId, status.status, status.error);
    });
  }
  
  // Toggle agent configuration section based on container type
  function toggleAgentConfig() {
    const typeSelect = document.querySelector('select[name="type"]');
    const agentSection = document.getElementById('agent-config-section');
    
    if (typeSelect.value === 'Computer' || typeSelect.value === 'VM') {
      agentSection.classList.remove('hidden');
    } else {
      agentSection.classList.add('hidden');
    }
  }
  
  // Update agent status display
  function updateAgentStatus(containerId, status, error = null) {
    const statusElement = document.getElementById('agent-status');
    if (!statusElement) return;
    
    statusElement.className = `agent-status ${status}`;
    statusElement.classList.remove('hidden');
    
    const indicator = statusElement.querySelector('.status-indicator');
    const text = statusElement.querySelector('.status-text');
    
    switch (status) {
      case 'connected':
        text.textContent = 'Connected to agent';
        break;
      case 'error':
        text.textContent = `Connection error: ${error}`;
        break;
      case 'disconnected':
        text.textContent = 'Disconnected from agent';
        break;
      default:
        text.textContent = 'Unknown status';
    }
    
    // Update container styling based on agent status
    updateContainerAgentStatus(containerId, status);
  }
  
  // Update container styling based on agent status
  function updateContainerAgentStatus(containerId, status) {
    const containerElement = document.querySelector(`[data-container-id="${containerId}"]`);
    if (!containerElement) return;
    
    containerElement.classList.remove('has-agent', 'agent-error', 'agent-disconnected');
    
    switch (status) {
      case 'connected':
        containerElement.classList.add('has-agent');
        break;
      case 'error':
        containerElement.classList.add('agent-error');
        break;
      case 'disconnected':
        containerElement.classList.add('agent-disconnected');
        break;
    }
  }
  
  // Update container metrics display
  function updateContainerMetrics(containerId, data) {
    const containerElement = document.querySelector(`[data-container-id="${containerId}"]`);
    if (!containerElement) return;
    
    let metricsElement = containerElement.querySelector('.metrics-display');
    if (!metricsElement) {
      metricsElement = createMetricsElement();
      containerElement.appendChild(metricsElement);
    }
    
    updateMetricsContent(metricsElement, data);
  }
  
  // Create metrics display element
  function createMetricsElement() {
    const metricsDiv = document.createElement('div');
    metricsDiv.className = 'metrics-display';
    return metricsDiv;
  }
  
  // Update metrics content with real-time data
  function updateMetricsContent(metricsElement, data) {
    if (!data.system) return;
    
    const system = data.system;
    const cpuPercent = Array.isArray(system.cpu_percent) ? system.cpu_percent[0] : system.cpu_percent;
    const memoryPercent = system.memory_total > 0 ? (system.memory_used / system.memory_total * 100).toFixed(1) : 0;
    const diskPercent = system.disk_total > 0 ? (system.disk_used / system.disk_total * 100).toFixed(1) : 0;
    
    metricsElement.innerHTML = `
      <div class="metrics-grid">
        <div class="metric-item">
          <span class="metric-label">CPU:</span>
          <span class="metric-value cpu-usage">${cpuPercent ? cpuPercent.toFixed(1) : '0.0'}%</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Memory:</span>
          <span class="metric-value memory-usage">${memoryPercent}%</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Disk:</span>
          <span class="metric-value disk-usage">${diskPercent}%</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Uptime:</span>
          <span class="metric-value">${formatUptime(system.uptime)}</span>
        </div>
      </div>
    `;
  }
  
  // Format uptime in human readable format
  function formatUptime(seconds) {
    if (!seconds) return 'N/A';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
  
  // Save container styling
  function saveContainerStyling(event) {
    event.preventDefault();
    
    const form = event.target;
    const containerId = form.querySelector('input[name="containerId"]').value;
    const container = getContainerById(containerId);
    
    if (!container) {
      showReorderFeedback('Container not found', 'error');
      return;
    }
    
    // Update container name and role
    container.name = form.querySelector('input[name="headingText"]').value;
    container.role = form.querySelector('select[name="role"]').value;
    
    // Update styling
    if (!container.styling) {
      container.styling = {};
    }
    
    container.styling.hideHeader = form.querySelector('input[name="hideHeader"]').checked;
    container.styling.bgType = form.querySelector('select[name="bgType"]').value;
    container.styling.backgroundColor = form.querySelector('input[name="backgroundColor"]').value;
    container.styling.backgroundGradient = form.querySelector('input[name="backgroundGradient"]').value;
    container.styling.backgroundCSS = form.querySelector('textarea[name="backgroundCSS"]').value;
    container.styling.backgroundImage = form.querySelector('input[name="backgroundImage"]').value;
    container.styling.backgroundOpacity = parseInt(form.querySelector('input[name="backgroundOpacity"]').value);
    container.styling.borderColor = form.querySelector('input[name="borderColor"]').value;
    container.styling.borderSize = parseInt(form.querySelector('input[name="borderSize"]').value);
    container.styling.borderStyle = form.querySelector('select[name="borderStyle"]').value;
    container.styling.borderCSS = form.querySelector('textarea[name="borderCSS"]').value;
    container.styling.customCSS = form.querySelector('textarea[name="customCSS"]').value;
    container.styling.borderRadius = parseInt(form.querySelector('input[name="borderRadius"]').value);
    container.styling.boxShadow = form.querySelector('input[name="boxShadow"]').value;
    container.styling.padding = parseInt(form.querySelector('input[name="padding"]').value);
    container.styling.margin = parseInt(form.querySelector('input[name="margin"]').value);
    
    // Save to backend
    saveCustomViewContainersToBackend()
      .then(() => {
        hideContainerStyleModal();
        renderContainers();
        showReorderFeedback(`Container "${container.name}" settings saved successfully! ✏️`, 'success');
      })
      .catch((error) => {
        console.error('Failed to save container styling:', error);
        showReorderFeedback('Failed to save container settings', 'error');
      });
  }

  // Enhanced Custom View Functions
  
  // Add new container (column or row)
  function addNewContainer(role = 'column', parentContainerId = null) {
    if (!isEditMode) {
      showReorderFeedback('Please enable Edit Mode first', 'error');
      return;
    }
    
    const containerNumber = customViewContainers.length + 1;
    const defaultName = role === 'column' ? `Column ${containerNumber}` : `Row ${containerNumber}`;
    const newContainer = createNewContainer(defaultName, role);
    
    // If parent container is specified, add as child
    if (parentContainerId) {
      const parentContainer = getContainerById(parentContainerId);
      if (parentContainer) {
        if (!parentContainer.children) {
          parentContainer.children = [];
        }
        parentContainer.children.push(newContainer.id);
        showReorderFeedback(`${role === 'column' ? 'Column' : 'Row'} "${newContainer.name}" added to container "${parentContainer.name}"! 🎉`, 'success');
      }
    } else {
      showReorderFeedback(`${role === 'column' ? 'Column' : 'Row'} "${newContainer.name}" created! Click the name to edit it. 🎉`, 'success');
    }
    
    // Re-render to show new container and maintain edit mode
    renderContainers();
    
    // Ensure edit mode styling is maintained after render
    if (isEditMode && currentView === 'custom') {
      requestAnimationFrame(() => {
        setTimeout(() => {
          console.log('Setting up sortable from addNewContainer...');
          setupContainerSortable();
        }, 150);
      });
    }
  }

  // Toggle container hamburger menu
  function toggleContainerHamburgerMenu(btn, event) {
    event.stopPropagation();
    
    const hamburgerMenu = btn.closest('.container-hamburger-menu');
    const isVisible = hamburgerMenu.classList.contains('show');
    
    console.log('Container hamburger menu element:', hamburgerMenu);
    console.log('Is visible:', isVisible);
    
    if (isVisible) {
      // Hide menu
      console.log('Hiding container hamburger menu');
      hamburgerMenu.classList.remove('show');
    } else {
      // Show menu
      console.log('Showing container hamburger menu');
      hamburgerMenu.classList.add('show');
      console.log('Added show class, menu classes:', hamburgerMenu.className);
    }
  }

  // Setup container sortable for drag-and-drop
  function setupContainerSortable() {
    if (!isEditMode) {
      console.log('Not in edit mode, skipping container sortable setup');
      return;
    }
    
    const containersContainer = $('#containers-container');
    const categoryContainers = $('.container-categories');
    
    // Check if jQuery UI is available
    if (typeof $.ui === 'undefined' || typeof $.fn.sortable === 'undefined') {
      console.error('jQuery UI sortable is not available');
      showReorderFeedback('Error: jQuery UI not loaded', 'error');
      return;
    }
    
    // Verify DOM elements exist
    if (containersContainer.length === 0) {
      console.error('Containers container not found in DOM');
      showReorderFeedback('Error: Containers container not found', 'error');
      return;
    }
    
    if (categoryContainers.length === 0) {
      console.warn('No category containers found in DOM');
    }
    
    console.log('Setting up container and category sortable');
    console.log('Containers container:', containersContainer.length);
    console.log('Category containers:', categoryContainers.length);
    console.log('Category groups found:', $('.category-group').length);
    console.log('Edit mode active class present:', $('#container-root').hasClass('edit-mode-active'));
    console.log('Drag handles in DOM:', $('.category-drag-handle').length);
    console.log('Visible drag handles:', $('.category-drag-handle:visible').length);
    
    try {
      // Setup container reordering
      containersContainer.sortable({
        items: '.container',
        handle: '.container-drag-handle',
        placeholder: 'container-placeholder',
        tolerance: 'pointer',
        cursor: 'grabbing',
        opacity: 0.9,
        distance: 8,
        helper: function(event, item) {
          const containerName = item.find('.container-title-text').text();
          const helper = $('<div class="container-drag-helper"></div>');
          helper.css({
            'width': '250px',
            'height': '60px',
            'background': 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            'color': 'white',
            'border': '2px solid #1e7e34',
            'border-radius': '8px',
            'padding': '10px 15px',
            'font-size': '14px',
            'font-weight': 'bold',
            'text-align': 'center',
            'box-shadow': '0 8px 25px rgba(40, 167, 69, 0.5)',
            'z-index': '10000',
            'display': 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'cursor': 'grabbing',
            'user-select': 'none',
            'position': 'absolute'
          });
          helper.text(containerName);
          return helper;
        },
        cursorAt: { top: 30, left: 125 },
        start: function(event, ui) {
          console.log('Container sort started');
          ui.item.addClass('dragging');
          $('*').css('transition', 'none');
        },
        stop: function(event, ui) {
          console.log('Container sort stopped');
          ui.item.removeClass('dragging');
          $('*').css('transition', '');
          
          // Update container order
          const newOrder = [];
          containersContainer.find('.container').each(function() {
            const containerId = $(this).attr('data-container-id');
            if (containerId) {
              newOrder.push(containerId);
            }
          });
          
          customViewContainerOrder = newOrder;
          showReorderFeedback('Containers reordered successfully! 📁', 'success');
        }
      });

      // Setup inter-container category dragging
      const categoryElements = $('.container-categories');
      console.log('Setting up category sortable on elements:', categoryElements.length);
      
      categoryElements.sortable({
        items: '.category-group',
        handle: '.category-drag-handle',
        placeholder: 'category-placeholder',
        tolerance: 'pointer',
        cursor: 'grabbing',
        opacity: 0.9,
        distance: 8,
        connectWith: '.container-categories, #available-categories-list', // Enable dragging between containers and available zone
        disabled: false, // Ensure it's enabled
        helper: function(event, item) {
          const categoryName = item.attr('data-category');
          const helper = $('<div class="category-drag-helper"></div>');
          helper.css({
            'width': '250px',
            'height': '50px',
            'background': 'linear-gradient(135deg, #0077cc 0%, #005fa3 100%)',
            'color': 'white',
            'border': '2px solid #004080',
            'border-radius': '8px',
            'padding': '10px 15px',
            'font-size': '14px',
            'font-weight': 'bold',
            'text-align': 'center',
            'box-shadow': '0 8px 25px rgba(0, 119, 204, 0.5)',
            'z-index': '10001',
            'display': 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'cursor': 'grabbing',
            'user-select': 'none',
            'position': 'absolute'
          });
          helper.text(`🏷️ ${categoryName}`);
          return helper;
        },
        cursorAt: { top: 25, left: 125 },
        start: function(event, ui) {
          console.log('Category sort started:', ui.item.attr('data-category'));
          ui.item.addClass('dragging');
          
          // Highlight drop zones
          $('.container-categories').addClass('drop-zone-active');
          $('.category-drop-zone').addClass('drag-over');
          
          $('*').css('transition', 'none');
        },
        stop: function(event, ui) {
          const categoryName = ui.item.attr('data-category');
          const newContainerId = ui.item.closest('.container-categories').attr('data-container-id');
          const oldContainerId = ui.item.attr('data-container-id');
          
          console.log('Category sort stopped:', categoryName, 'moved to container:', newContainerId);
          
          ui.item.removeClass('dragging');
          $('.container-categories').removeClass('drop-zone-active');
          $('.category-drop-zone').removeClass('drag-over');
          $('*').css('transition', '');
          
          // Check if dropped in available categories zone
          if (ui.item.closest('#available-categories-list').length > 0) {
            console.log('Category dropped in available categories zone:', categoryName);
            // Remove from container
            if (oldContainerId) {
              const oldContainer = getContainerById(oldContainerId);
              if (oldContainer) {
                const categoryIndex = oldContainer.categories.indexOf(categoryName);
                if (categoryIndex > -1) {
                  oldContainer.categories.splice(categoryIndex, 1);
                  console.log(`Removed category "${categoryName}" from container "${oldContainer.name}"`);
                  console.log('Container categories after removal:', oldContainer.categories);
                  showReorderFeedback(`Category "${categoryName}" removed from container! 📦`, 'success');
                }
              }
            }
            // Force update available categories zone after a short delay to ensure DOM is updated
            setTimeout(() => {
              console.log('Updating available categories zone after drop...');
              updateAvailableCategoriesZone();
              // Also re-render containers to update the display
              renderContainers();
              // Save changes to backend
              saveCustomViewContainersToBackend();
            }, 100);
          } else if (newContainerId !== oldContainerId) {
            // Update category's container assignment
            moveCategoryToContainer(categoryName, oldContainerId, newContainerId);
            ui.item.attr('data-container-id', newContainerId);
            showReorderFeedback(`Category "${categoryName}" moved to new container! 🚀`, 'success');
            // Update available categories zone after moving
            updateAvailableCategoriesZone();
          } else {
            // Update category order within the same container
            const newContainer = getContainerById(newContainerId);
            if (newContainer) {
              const newOrder = [];
              $(ui.item).closest('.container-categories').find('.category-group').each(function() {
                const cat = $(this).attr('data-category');
                if (cat) newOrder.push(cat);
              });
              newContainer.categories = newOrder;
              showReorderFeedback('Categories reordered within container! 📝', 'success');
            }
          }
        },
        over: function(event, ui) {
          $(ui.placeholder).closest('.container-categories').addClass('drag-over');
        },
        out: function(event, ui) {
          $('.container-categories').removeClass('drag-over');
        }
      });
      
      // Available categories sortable is now handled in updateAvailableCategoriesZone()
      // to ensure it's properly initialized after the accordion structure is created
      
      // Disable text selection during sorting
      containersContainer.disableSelection();
      categoryElements.disableSelection();
      
      // Disable text selection for available categories list if it exists
      const availableCategoriesList = $('#available-categories-list');
      if (availableCategoriesList.length > 0) {
        availableCategoriesList.disableSelection();
      }
      
      console.log('Container and category sortable setup complete');
      console.log('Sortable instances created:');
      console.log('- Containers container sortable:', $('#containers-container').hasClass('ui-sortable'));
      console.log('- Category containers sortable:', $('.container-categories.ui-sortable').length);
      console.log('- Available categories sortable:', $('#available-categories-list').hasClass('ui-sortable'));
      console.log('- Category drag handles visible:', $('.category-drag-handle:visible').length);
      
      // Verify drag handles are visible in edit mode
      if ($('.category-drag-handle:visible').length === 0) {
        console.warn('No category drag handles are visible - check CSS edit-mode-active class');
      }
      
    } catch (error) {
      console.error('Failed to setup container sortable:', error);
      showReorderFeedback('Failed to setup drag and drop', 'error');
    }
  }

  // Update available categories zone
  function updateAvailableCategoriesZone() {
    console.log('updateAvailableCategoriesZone() called');
    const availableZone = document.getElementById('available-categories-zone');
    const availableList = document.getElementById('available-categories-list');
    const availableCount = document.getElementById('available-categories-count');
    
    if (!availableZone || !availableList || !availableCount) {
      console.warn('Available categories zone elements not found');
      return;
    }
    
    // Get all categories from containers
    const assignedCategories = new Set();
    customViewContainers.forEach(container => {
      if (container.categories && container.categories.length > 0) {
        container.categories.forEach(category => {
          assignedCategories.add(category);
        });
        console.log(`Container "${container.name}" has categories:`, container.categories);
      }
    });
    
    // Get all categories from multiple sources to ensure we capture all existing categories
    const allCategories = new Set();
    
    // 1. Get categories from main containers (same logic as renderCustomView)
    const categoryTypes = ['Application', 'LXC Container', 'Docker Container'];
    
    function collectAllCategories(containerList) {
      containerList.forEach(container => {
        if (categoryTypes.includes(container.type)) {
          if (container.categories && container.categories.length > 0) {
            container.categories.forEach(category => {
              allCategories.add(category);
            });
            console.log(`Main container "${container.name}" has categories:`, container.categories);
          } else {
            // Containers without categories go to "Uncategorized"
            allCategories.add('Uncategorized');
          }
        }
        if (container.children && container.children.length > 0) {
          collectAllCategories(container.children);
        }
      });
    }
    
    collectAllCategories(containers);
    
    // 2. Also get categories from custom view containers to catch any that might not be in main containers
    customViewContainers.forEach(container => {
      if (container.categories && container.categories.length > 0) {
        container.categories.forEach(category => {
          allCategories.add(category);
        });
        console.log(`Custom view container "${container.name}" has categories:`, container.categories);
      }
    });
    
    // Find unassigned categories
    const availableCategories = Array.from(allCategories).filter(category => !assignedCategories.has(category));
    
    console.log('Available categories calculation:', {
      totalCategories: allCategories.size,
      assignedCategories: assignedCategories.size,
      availableCategories: availableCategories.length,
      allCategories: Array.from(allCategories),
      assignedCategoriesList: Array.from(assignedCategories),
      availableCategoriesList: availableCategories
    });
    
    // Update count
    availableCount.textContent = `${availableCategories.length} categories`;
    
    // Clear and repopulate list
    availableList.innerHTML = '';
    
    // Add accordion functionality if there are many categories
    if (availableCategories.length > 5) {
      // Create collapsible sections
      const categoriesPerSection = 10;
      const sections = Math.ceil(availableCategories.length / categoriesPerSection);
      
      for (let i = 0; i < sections; i++) {
        const sectionStart = i * categoriesPerSection;
        const sectionEnd = Math.min((i + 1) * categoriesPerSection, availableCategories.length);
        const sectionCategories = availableCategories.slice(sectionStart, sectionEnd);
        
        const sectionElement = document.createElement('div');
        sectionElement.className = 'available-categories-section';
        
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'available-categories-section-header';
        sectionHeader.innerHTML = `
          <span class="section-title">Categories ${sectionStart + 1}-${sectionEnd}</span>
          <span class="section-toggle">▼</span>
        `;
        
        const sectionContent = document.createElement('div');
        sectionContent.className = 'available-categories-section-content';
        
        // Add categories to this section
        sectionCategories.forEach(category => {
          const categoryElement = document.createElement('div');
          categoryElement.className = 'available-category';
          categoryElement.setAttribute('data-category', category);
          
          categoryElement.innerHTML = `
            <div class="category-header">
              <div class="category-title">
                <span>📦 ${category}</span>
              </div>
              <div class="category-drag-handle" title="Drag to add to container">⋮⋮⋮</div>
            </div>
          `;
          
          sectionContent.appendChild(categoryElement);
        });
        
        // Add click handler for accordion
        sectionHeader.addEventListener('click', function() {
          const isExpanded = sectionContent.style.display !== 'none';
          sectionContent.style.display = isExpanded ? 'none' : 'block';
          sectionHeader.querySelector('.section-toggle').textContent = isExpanded ? '▶' : '▼';
        });
        
        // Start with first section expanded, others collapsed
        if (i === 0) {
          sectionContent.style.display = 'block';
          sectionHeader.querySelector('.section-toggle').textContent = '▼';
        } else {
          sectionContent.style.display = 'none';
          sectionHeader.querySelector('.section-toggle').textContent = '▶';
        }
        
        sectionElement.appendChild(sectionHeader);
        sectionElement.appendChild(sectionContent);
        availableList.appendChild(sectionElement);
      }
    } else {
      // Show all categories without sections if there are few
      availableCategories.forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'available-category';
        categoryElement.setAttribute('data-category', category);
        
        categoryElement.innerHTML = `
          <div class="category-header">
            <div class="category-title">
              <span>📦 ${category}</span>
            </div>
            <div class="category-drag-handle" title="Drag to add to container">⋮⋮⋮</div>
          </div>
        `;
        
        availableList.appendChild(categoryElement);
      });
    }
    
    // Show/hide zone based on edit mode
    if (isEditMode && currentView === 'custom') {
      availableZone.classList.remove('hidden');
      console.log('Available categories zone shown with', availableCategories.length, 'categories');
      
      // Re-initialize sortable for available categories after DOM update
      setTimeout(() => {
        const availableCategoriesList = $('#available-categories-list');
        if (availableCategoriesList.length > 0) {
          // Destroy existing sortable if it exists
          if (availableCategoriesList.hasClass('ui-sortable')) {
            availableCategoriesList.sortable('destroy');
          }
          
          // Re-create sortable with updated configuration
          availableCategoriesList.sortable({
            items: '.available-category',
            handle: '.category-drag-handle',
            placeholder: 'category-placeholder',
            tolerance: 'pointer',
            cursor: 'grabbing',
            opacity: 0.9,
            distance: 8,
            connectWith: '.container-categories',
            // Allow dragging from accordion sections
            cancel: '.available-categories-section-header',
            // Add more debugging
            activate: function(event, ui) {
              console.log('Available categories sortable activated');
            },
            deactivate: function(event, ui) {
              console.log('Available categories sortable deactivated');
            },
            helper: function(event, item) {
              const categoryName = item.attr('data-category');
              const helper = $('<div class="category-drag-helper"></div>');
              helper.css({
                'width': '250px',
                'height': '50px',
                'background': 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
                'color': 'white',
                'border': '2px solid #343a40',
                'border-radius': '8px',
                'padding': '10px 15px',
                'font-size': '14px',
                'font-weight': 'bold',
                'text-align': 'center',
                'box-shadow': '0 8px 25px rgba(108, 117, 125, 0.5)',
                'z-index': '10001',
                'display': 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'cursor': 'grabbing',
                'user-select': 'none',
                'position': 'absolute'
              });
              helper.text(`📦 ${categoryName}`);
              return helper;
            },
            cursorAt: { top: 25, left: 125 },
            start: function(event, ui) {
              console.log('Available category sort started:', ui.item.attr('data-category'));
              console.log('Start event details:', {
                event: event,
                ui: ui,
                item: ui.item,
                itemData: ui.item.attr('data-category'),
                helper: ui.helper
              });
              ui.item.addClass('dragging');
              $('*').css('transition', 'none');
            },
            stop: function(event, ui) {
              const categoryName = ui.item.attr('data-category');
              
              // Check if dropped in a container by looking at the placeholder or the item's new position
              let newContainerId = null;
              
              // Try to find the container by checking where the item ended up
              const containerCategories = ui.item.closest('.container-categories');
              if (containerCategories.length > 0) {
                newContainerId = containerCategories.attr('data-container-id');
              }
              
              console.log('Available category sort stopped:', categoryName, 'moved to container:', newContainerId);
              
              ui.item.removeClass('dragging');
              $('*').css('transition', '');
              
              if (newContainerId) {
                // Add to container
                const newContainer = getContainerById(newContainerId);
                if (newContainer && !newContainer.categories.includes(categoryName)) {
                  newContainer.categories.push(categoryName);
                  showReorderFeedback(`Category "${categoryName}" added to container! 🎉`, 'success');
                  
                  // Re-render containers and update available categories zone
                  setTimeout(() => {
                    renderContainers();
                    updateAvailableCategoriesZone();
                    saveCustomViewContainersToBackend();
                  }, 100);
                }
              } else {
                // If not dropped in a container, just update available categories zone
                updateAvailableCategoriesZone();
              }
            }
          });
          
          console.log('Re-initialized available categories sortable');
          console.log('Available categories list found:', availableCategoriesList.length > 0);
          console.log('Available category elements found:', availableCategoriesList.find('.available-category').length);
          console.log('Drag handles found:', availableCategoriesList.find('.category-drag-handle').length);
          
          // Test if sortable is working by adding a click handler to drag handles
          availableCategoriesList.find('.category-drag-handle').on('mousedown', function(e) {
            console.log('Drag handle mousedown detected:', e.target);
            console.log('Parent category:', $(this).closest('.available-category').attr('data-category'));
          });
          
          // Test if sortable instance is working
          console.log('Sortable instance check:', {
            hasSortable: availableCategoriesList.hasClass('ui-sortable'),
            sortableInstance: availableCategoriesList.sortable('instance'),
            options: availableCategoriesList.sortable('option')
          });
        }
      }, 50);
    } else {
      availableZone.classList.add('hidden');
      console.log('Available categories zone hidden');
    }
  }

  // Get available categories
  function getAvailableCategories() {
    const assignedCategories = new Set();
    customViewContainers.forEach(container => {
      container.categories.forEach(category => {
        assignedCategories.add(category);
      });
    });
    
    const allCategories = new Set();
    containers.forEach(container => {
      if (container.categories && container.categories.length > 0) {
        container.categories.forEach(category => {
          allCategories.add(category);
        });
      }
    });
    
    return Array.from(allCategories).filter(category => !assignedCategories.has(category));
  }

  // Debug function to move a category to available zone for testing
  function moveCategoryToAvailable(categoryName) {
    if (!isEditMode) {
      console.log('Edit mode must be enabled to move categories');
      return;
    }
    
    // Find which container has this category
    const containerWithCategory = customViewContainers.find(container => 
      container.categories && container.categories.includes(categoryName)
    );
    
    if (containerWithCategory) {
      // Remove from container
      const categoryIndex = containerWithCategory.categories.indexOf(categoryName);
      if (categoryIndex > -1) {
        containerWithCategory.categories.splice(categoryIndex, 1);
        console.log(`Moved category "${categoryName}" from container "${containerWithCategory.name}" to available zone`);
        
        // Update the display
        renderContainers();
        updateAvailableCategoriesZone();
        
        // Save changes
        saveCustomViewContainersToBackend();
      }
    } else {
      console.log(`Category "${categoryName}" not found in any container`);
    }
  }

  // Add debug helper to window for testing
  window.debugMoveCategory = function(categoryName) {
    console.log('Debug: Moving category to available zone:', categoryName);
    moveCategoryToAvailable(categoryName);
  };

  // Add debug helper to list all categories
  window.debugListCategories = function() {
    console.log('=== DEBUG: All Categories ===');
    console.log('Custom View Containers:', customViewContainers);
    console.log('Main Containers:', containers);
    console.log('Available Categories:', getAvailableCategories());
  };

  // Show container styling modal
  function showContainerStyleModal(containerId) {
    const container = getContainerById(containerId);
    if (!container) {
      showReorderFeedback('Container not found', 'error');
      return;
    }
    
    selectedCustomViewContainerId = containerId;
    const modal = document.getElementById('container-styling-modal');
    const form = document.getElementById('container-styling-form');
    
    if (!modal || !form) {
      showReorderFeedback('Container settings modal not found', 'error');
      return;
    }
    
    // Populate form with current values
    form.querySelector('input[name="containerId"]').value = containerId;
    form.querySelector('input[name="headingText"]').value = container.name;
    form.querySelector('select[name="role"]').value = container.role;
    form.querySelector('input[name="hideHeader"]').checked = container.styling?.hideHeader || false;
    form.querySelector('select[name="bgType"]').value = container.styling?.bgType || 'color';
    form.querySelector('input[name="backgroundColor"]').value = container.styling?.backgroundColor || '#f9f9f9';
    form.querySelector('input[name="backgroundGradient"]').value = container.styling?.backgroundGradient || '';
    form.querySelector('textarea[name="backgroundCSS"]').value = container.styling?.backgroundCSS || '';
    form.querySelector('input[name="backgroundImage"]').value = container.styling?.backgroundImage || '';
    form.querySelector('input[name="backgroundOpacity"]').value = container.styling?.backgroundOpacity || 100;
    form.querySelector('input[name="borderColor"]').value = container.styling?.borderColor || '#e0e0e0';
    form.querySelector('input[name="borderSize"]').value = container.styling?.borderSize || 2;
    form.querySelector('select[name="borderStyle"]').value = container.styling?.borderStyle || 'solid';
    form.querySelector('textarea[name="borderCSS"]').value = container.styling?.borderCSS || '';
    form.querySelector('textarea[name="customCSS"]').value = container.styling?.customCSS || '';
    form.querySelector('input[name="borderRadius"]').value = container.styling?.borderRadius || 8;
    form.querySelector('input[name="boxShadow"]').value = container.styling?.boxShadow || '0 2px 4px rgba(0,0,0,0.1)';
    form.querySelector('input[name="padding"]').value = container.styling?.padding || 15;
    form.querySelector('input[name="margin"]').value = container.styling?.margin || 10;
    
    // Update background options visibility
    updateContainerBackgroundOptions();
    
    // Reset to General tab by default
    modal.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    modal.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    modal.querySelector('#general-tab').classList.add('active');
    modal.querySelector('.tab-btn[onclick*="general"]').classList.add('active');
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Set up form submission
    form.onsubmit = saveContainerStyling;
  }

  // Hide container styling modal
  function hideContainerStyleModal() {
    const modal = document.getElementById('container-styling-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
    selectedCustomViewContainerId = null;
  }

  // Update container background options
  function updateContainerBackgroundOptions() {
    const bgType = document.querySelector('select[name="bgType"]').value;
    const colorOption = document.getElementById('container-bg-color-option');
    const gradientOption = document.getElementById('container-bg-gradient-option');
    const cssOption = document.getElementById('container-bg-css-option');
    
    if (colorOption) colorOption.classList.toggle('hidden', bgType !== 'color');
    if (gradientOption) gradientOption.classList.toggle('hidden', bgType !== 'gradient');
    if (cssOption) cssOption.classList.toggle('hidden', bgType !== 'css');
  }

  // Delete container
  function deleteContainer(containerId) {
    if (!isEditMode) {
      showReorderFeedback('Please enable Edit Mode first', 'error');
      return;
    }
    
    const container = getContainerById(containerId);
    if (!container) {
      showReorderFeedback('Container not found', 'error');
      return;
    }
    
    if (customViewContainers.length <= 1) {
      showReorderFeedback('Cannot delete the last container!', 'error');
      return;
    }
    
    // Check if container is empty
    if (container.categories.length > 0) {
      showReorderFeedback(`Cannot delete container "${container.name}" - it contains ${container.categories.length} categories. Move or remove categories first.`, 'error');
      return;
    }
    
    const confirmDelete = confirm(`Are you sure you want to delete the empty container "${container.name}"?`);
    if (!confirmDelete) return;
    
    // Remove container
    const containerIndex = customViewContainers.findIndex(cont => cont.id === containerId);
    if (containerIndex > -1) {
      customViewContainers.splice(containerIndex, 1);
    }
    
    const orderIndex = customViewContainerOrder.indexOf(containerId);
    if (orderIndex > -1) {
      customViewContainerOrder.splice(orderIndex, 1);
    }
    
    showReorderFeedback(`Empty container "${container.name}" deleted successfully! 🗑️`, 'success');
    renderContainers(); // Re-render to reflect changes
    
    // Maintain edit mode after deletion
    if (isEditMode && currentView === 'custom') {
      requestAnimationFrame(() => {
        setTimeout(() => {
          console.log('Setting up sortable from deleteContainer...');
          setupContainerSortable();
        }, 150);
      });
    }
  }

  // Reset Custom View
  function resetCustomView() {
    if (!isEditMode) {
      showReorderFeedback('Please enable Edit Mode first', 'error');
      return;
    }
    
    const confirmReset = confirm('Are you sure you want to reset the Custom View? This will clear all containers and move all categories to the available list.');
    if (!confirmReset) return;
    
    // Clear all containers
    customViewContainers = [];
    customViewContainerOrder = [];
    
    // Create a new default container
    createDefaultContainer();
    
    showReorderFeedback('Custom View reset successfully! All categories moved to available list. 🔄', 'success');
    renderContainers();
    
    // Maintain edit mode after reset
    if (isEditMode && currentView === 'custom') {
      requestAnimationFrame(() => {
        setTimeout(() => {
          console.log('Setting up sortable from resetCustomView...');
          setupContainerSortable();
        }, 150);
      });
    }
  }

  // Make container title editable
  function makeContainerTitleEditable(titleSpan, containerId) {
    if (!isEditMode) {
      showReorderFeedback('Please enable Edit Mode to edit container names', 'error');
      return;
    }
    
    const container = getContainerById(containerId);
    if (!container) {
      showReorderFeedback('Container not found', 'error');
      return;
    }
    
    const currentText = titleSpan.textContent;
    const roleIcon = container.role === 'column' ? '📁' : '➡️';
    const currentName = currentText.replace(`${roleIcon} `, '');
    
    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'container-title-input';
    input.style.cssText = `
      width: 100%;
      padding: 4px 8px;
      border: 2px solid #0077cc;
      border-radius: 4px;
      font-size: inherit;
      font-weight: inherit;
      background: white;
      color: #333;
    `;
    
    // Replace span with input
    titleSpan.style.display = 'none';
    titleSpan.parentNode.insertBefore(input, titleSpan);
    input.focus();
    input.select();
    
    const saveEdit = () => {
      const newName = input.value.trim();
      if (newName && newName !== currentName) {
        container.name = newName;
        titleSpan.textContent = `${roleIcon} ${newName}`;
        showReorderFeedback(`Container renamed to "${newName}"! ✏️`, 'success');
      }
      titleSpan.style.display = '';
      input.remove();
    };
    
    const cancelEdit = () => {
      titleSpan.style.display = '';
      input.remove();
    };
    
    // Handle input events
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    });
  }
  

  
  // ========================================
  // WIDGET SYSTEM FUNCTIONS
  // ========================================
  
  // Load available widgets from backend
  async function loadAvailableWidgets() {
    try {
      const response = await fetch('/api/widgets');
      if (response.ok) {
        availableWidgets = await response.json();
        console.log('Loaded available widgets:', availableWidgets);
        updateWidgetGallery();
      } else {
        console.error('Failed to load widgets:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading widgets:', error);
    }
  }
  
  // Create widget container
  function createWidgetContainer(widgetId, config = {}) {
    return {
      id: generateId(),
      type: 'widget',
      widgetId: widgetId,
      config: config,
      role: 'widget',
      name: `Widget ${widgetId}`,
      styling: {
        hideHeader: false,
        bgType: 'color',
        backgroundColor: '#ffffff',
        backgroundGradient: '',
        backgroundCSS: '',
        backgroundImage: '',
        backgroundOpacity: 100,
        borderColor: '#e0e0e0',
        borderSize: 1,
        borderStyle: 'solid',
        borderCSS: '',
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: 10,
        margin: 5,
        customCSS: ''
      },
      categories: [],
      children: []
    };
  }
  
  // Create widget element
  function createWidgetElement(widgetContainer) {
    const widgetElement = document.createElement('div');
    widgetElement.className = 'widget-container';
    widgetElement.setAttribute('data-widget-id', widgetContainer.widgetId);
    widgetElement.setAttribute('data-container-id', widgetContainer.id);
    
    // Create widget header
    const widgetHeader = document.createElement('div');
    widgetHeader.className = 'widget-header';
    
    const widgetTitle = document.createElement('div');
    widgetTitle.className = 'widget-title';
    
    const titleSpan = document.createElement('span');
    titleSpan.className = 'widget-title-text';
    titleSpan.textContent = `🔧 ${widgetContainer.name}`;
    titleSpan.setAttribute('data-container-id', widgetContainer.id);
    
    if (isEditMode) {
      titleSpan.style.cursor = 'pointer';
      titleSpan.title = 'Click to edit widget name';
      titleSpan.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        makeWidgetTitleEditable(titleSpan, widgetContainer.id);
      };
      titleSpan.classList.add('editable');
    }
    
    widgetTitle.appendChild(titleSpan);
    
    const widgetActions = document.createElement('div');
    widgetActions.className = 'widget-actions';
    
    if (isEditMode) {
      const configBtn = document.createElement('button');
      configBtn.className = 'widget-action-btn';
      configBtn.innerHTML = '⚙️';
      configBtn.title = 'Configure Widget';
      configBtn.onclick = () => showWidgetConfigModal(widgetContainer.widgetId, widgetContainer.config);
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'widget-action-btn';
      deleteBtn.innerHTML = '🗑️';
      deleteBtn.title = 'Delete Widget';
      deleteBtn.onclick = () => deleteWidgetContainer(widgetContainer.id);
      
      widgetActions.appendChild(configBtn);
      widgetActions.appendChild(deleteBtn);
    }
    
    widgetHeader.appendChild(widgetTitle);
    widgetHeader.appendChild(widgetActions);
    
    // Create widget content area
    const widgetContent = document.createElement('div');
    widgetContent.className = 'widget-content';
    
    // Create iframe for widget isolation
    const iframe = document.createElement('iframe');
    iframe.className = 'widget-frame';
    iframe.src = `/api/widgets/${widgetContainer.widgetId}/render`;
    iframe.setAttribute('data-config', JSON.stringify(widgetContainer.config));
    iframe.style.cssText = `
      width: 100%;
      height: 200px;
      border: none;
      border-radius: 4px;
      background: transparent;
    `;
    
    // Handle widget events
    iframe.addEventListener('load', () => {
      try {
        const config = JSON.parse(iframe.getAttribute('data-config'));
        iframe.contentWindow.postMessage({
          type: 'widget-config',
          config: config
        }, '*');
      } catch (error) {
        console.error('Error sending config to widget:', error);
      }
    });
    
    widgetContent.appendChild(iframe);
    
    widgetElement.appendChild(widgetHeader);
    widgetElement.appendChild(widgetContent);
    
    // Apply widget styling
    applyWidgetStyling(widgetElement, widgetContainer);
    
    return widgetElement;
  }
  
  // Apply widget styling
  function applyWidgetStyling(widgetElement, widgetContainer) {
    if (!widgetContainer.styling) return;
    
    const style = widgetContainer.styling;
    
    // Apply header visibility
    const widgetHeader = widgetElement.querySelector('.widget-header');
    if (widgetHeader) {
      if (style.hideHeader && !isEditMode) {
        widgetHeader.style.display = 'none';
      } else {
        widgetHeader.style.display = '';
      }
    }
    
    // Apply background
    if (style.bgType === 'color' && style.backgroundColor) {
      widgetElement.style.backgroundColor = style.backgroundColor;
    } else if (style.bgType === 'gradient' && style.backgroundGradient) {
      widgetElement.style.background = style.backgroundGradient;
    } else if (style.bgType === 'css' && style.backgroundCSS) {
      widgetElement.style.cssText += style.backgroundCSS;
    }
    
    // Apply border
    if (style.borderColor) {
      widgetElement.style.borderColor = style.borderColor;
    }
    if (style.borderSize) {
      widgetElement.style.borderWidth = style.borderSize + 'px';
    }
    if (style.borderStyle) {
      widgetElement.style.borderStyle = style.borderStyle;
    }
    
    // Apply additional styles
    if (style.borderRadius) {
      widgetElement.style.borderRadius = style.borderRadius + 'px';
    }
    if (style.boxShadow) {
      widgetElement.style.boxShadow = style.boxShadow;
    }
    if (style.padding) {
      widgetElement.style.padding = style.padding + 'px';
    }
    if (style.margin) {
      widgetElement.style.margin = style.margin + 'px';
    }
    if (style.customCSS) {
      widgetElement.style.cssText += style.customCSS;
    }
  }
  
  // Show widget configuration modal
  async function showWidgetConfigModal(widgetId, currentConfig = {}) {
    try {
      const response = await fetch(`/api/widgets/${widgetId}`);
      if (!response.ok) {
        throw new Error('Widget not found');
      }
      
      const widget = await response.json();
      const modal = createWidgetConfigModal(widget, currentConfig);
      document.body.appendChild(modal);
    } catch (error) {
      console.error('Error loading widget config:', error);
      showReorderFeedback('Failed to load widget configuration', 'error');
    }
  }
  
  // Create widget configuration modal
  function createWidgetConfigModal(widget, currentConfig) {
    const modal = document.createElement('div');
    modal.className = 'modal widget-config-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    `;
    
    const form = document.createElement('form');
    form.innerHTML = `
      <div class="modal-header">
        <h3>Configure ${widget.manifest.name}</h3>
        <button type="button" class="close-btn" onclick="closeWidgetConfigModal()">×</button>
      </div>
      <div class="modal-body">
        <p>${widget.manifest.description}</p>
        <div id="widget-config-fields">
          ${generateConfigFields(widget.manifest.configSchema || {}, currentConfig)}
        </div>
      </div>
      <div class="modal-footer">
        <button type="submit" class="btn btn-primary">Save Configuration</button>
        <button type="button" class="btn btn-secondary" onclick="closeWidgetConfigModal()">Cancel</button>
      </div>
    `;
    
    form.onsubmit = (e) => {
      e.preventDefault();
      const config = collectConfigData(form, widget.manifest.configSchema || {});
      saveWidgetConfig(widget.manifest.id, config);
      closeWidgetConfigModal();
    };
    
    modalContent.appendChild(form);
    modal.appendChild(modalContent);
    
    // Close modal when clicking outside
    modal.onclick = (e) => {
      if (e.target === modal) {
        closeWidgetConfigModal();
      }
    };
    
    return modal;
  }
  
  // Generate configuration fields
  function generateConfigFields(configSchema, currentConfig) {
    let fields = '';
    
    Object.entries(configSchema).forEach(([key, field]) => {
      const value = currentConfig[key] !== undefined ? currentConfig[key] : field.default;
      
      switch (field.type) {
        case 'string':
          fields += `
            <div class="form-group">
              <label for="${key}">${field.description || key}:</label>
              <input type="text" id="${key}" name="${key}" value="${value || ''}" />
            </div>
          `;
          break;
        case 'number':
          fields += `
            <div class="form-group">
              <label for="${key}">${field.description || key}:</label>
              <input type="number" id="${key}" name="${key}" value="${value || ''}" />
            </div>
          `;
          break;
        case 'select':
          const options = field.options.map(option => 
            `<option value="${option}" ${value === option ? 'selected' : ''}>${option}</option>`
          ).join('');
          fields += `
            <div class="form-group">
              <label for="${key}">${field.description || key}:</label>
              <select id="${key}" name="${key}">${options}</select>
            </div>
          `;
          break;
        case 'range':
          fields += `
            <div class="form-group">
              <label for="${key}">${field.description || key}:</label>
              <input type="range" id="${key}" name="${key}" 
                     min="${field.min}" max="${field.max}" value="${value || field.default}" />
              <span class="range-value">${value || field.default}</span>
            </div>
          `;
          break;
        case 'color':
          fields += `
            <div class="form-group">
              <label for="${key}">${field.description || key}:</label>
              <input type="color" id="${key}" name="${key}" value="${value || field.default}" />
            </div>
          `;
          break;
        case 'boolean':
          fields += `
            <div class="form-group">
              <label>
                <input type="checkbox" id="${key}" name="${key}" ${value ? 'checked' : ''} />
                ${field.description || key}
              </label>
            </div>
          `;
          break;
      }
    });
    
    return fields || '<p>No configuration options available for this widget.</p>';
  }
  
  // Collect configuration data from form
  function collectConfigData(form, configSchema) {
    const config = {};
    
    Object.entries(configSchema).forEach(([key, field]) => {
      const element = form.querySelector(`[name="${key}"]`);
      if (!element) return;
      
      switch (field.type) {
        case 'boolean':
          config[key] = element.checked;
          break;
        case 'number':
          config[key] = parseFloat(element.value) || field.default;
          break;
        case 'range':
          config[key] = parseInt(element.value) || field.default;
          break;
        default:
          config[key] = element.value || field.default;
      }
    });
    
    return config;
  }
  
  // Save widget configuration
  function saveWidgetConfig(widgetId, config) {
    // Find widget container and update config
    const widgetContainer = customViewContainers.find(container => 
      container.type === 'widget' && container.widgetId === widgetId
    );
    
    if (widgetContainer) {
      widgetContainer.config = config;
      saveCustomViewContainersToBackend();
      showReorderFeedback('Widget configuration saved! ⚙️', 'success');
      
      // Re-render to apply new config
      renderContainers();
    }
  }
  
  // Close widget configuration modal
  function closeWidgetConfigModal() {
    const modal = document.querySelector('.widget-config-modal');
    if (modal) {
      modal.remove();
    }
  }
  
  // Delete widget container
  function deleteWidgetContainer(containerId) {
    if (!isEditMode) {
      showReorderFeedback('Please enable Edit Mode first', 'error');
      return;
    }
    
    const container = getContainerById(containerId);
    if (!container) {
      showReorderFeedback('Widget container not found', 'error');
      return;
    }
    
    const confirmDelete = confirm(`Are you sure you want to delete the widget "${container.name}"?`);
    if (!confirmDelete) return;
    
    // Remove container
    const containerIndex = customViewContainers.findIndex(cont => cont.id === containerId);
    if (containerIndex > -1) {
      customViewContainers.splice(containerIndex, 1);
    }
    
    const orderIndex = customViewContainerOrder.indexOf(containerId);
    if (orderIndex > -1) {
      customViewContainerOrder.splice(orderIndex, 1);
    }
    
    showReorderFeedback(`Widget "${container.name}" deleted successfully! 🗑️`, 'success');
    renderContainers();
  }
  
  // Make widget title editable
  function makeWidgetTitleEditable(titleSpan, containerId) {
    if (!isEditMode) {
      showReorderFeedback('Please enable Edit Mode to edit widget names', 'error');
      return;
    }
    
    const container = getContainerById(containerId);
    if (!container) {
      showReorderFeedback('Widget container not found', 'error');
      return;
    }
    
    const currentText = titleSpan.textContent;
    const currentName = currentText.replace('🔧 ', '');
    
    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'widget-title-input';
    input.style.cssText = `
      width: 100%;
      padding: 4px 8px;
      border: 2px solid #0077cc;
      border-radius: 4px;
      font-size: inherit;
      font-weight: inherit;
      background: white;
      color: #333;
    `;
    
    // Replace span with input
    titleSpan.style.display = 'none';
    titleSpan.parentNode.insertBefore(input, titleSpan);
    input.focus();
    input.select();
    
    const saveEdit = () => {
      const newName = input.value.trim();
      if (newName && newName !== currentName) {
        container.name = newName;
        titleSpan.textContent = `🔧 ${newName}`;
        showReorderFeedback(`Widget renamed to "${newName}"! ✏️`, 'success');
      }
      titleSpan.style.display = '';
      input.remove();
    };
    
    const cancelEdit = () => {
      titleSpan.style.display = '';
      input.remove();
    };
    
    // Handle input events
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    });
  }
  
  // Show widget gallery
  function showWidgetGallery() {
    const gallery = createWidgetGallery();
    document.body.appendChild(gallery);
  }
  
  // Create widget gallery
  function createWidgetGallery() {
    const gallery = document.createElement('div');
    gallery.className = 'modal widget-gallery';
    gallery.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;
    
    const galleryContent = document.createElement('div');
    galleryContent.className = 'gallery-content';
    galleryContent.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 800px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    `;
    
    galleryContent.innerHTML = `
      <div class="modal-header">
        <h3>Widget Gallery</h3>
        <button onclick="closeWidgetGallery()" class="close-btn">×</button>
      </div>
      <div class="widget-grid">
        ${availableWidgets.map(widget => `
          <div class="widget-card" onclick="addWidgetToContainer('${widget.id}')">
            <div class="widget-icon">${widget.icon || '🔧'}</div>
            <h4>${widget.name}</h4>
            <p>${widget.description}</p>
            <div class="widget-meta">
              <span>By ${widget.author}</span>
              <span>v${widget.version}</span>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="gallery-footer">
        <button onclick="showWidgetUploadModal()" class="btn btn-primary">Upload Widget</button>
        <button onclick="closeWidgetGallery()" class="btn btn-secondary">Close</button>
      </div>
    `;
    
    gallery.appendChild(galleryContent);
    
    // Close gallery when clicking outside
    gallery.onclick = (e) => {
      if (e.target === gallery) {
        closeWidgetGallery();
      }
    };
    
    return gallery;
  }
  
  // Close widget gallery
  function closeWidgetGallery() {
    const gallery = document.querySelector('.widget-gallery');
    if (gallery) {
      gallery.remove();
    }
  }
  
  // Add widget to container
  function addWidgetToContainer(widgetId) {
    if (!isEditMode) {
      showReorderFeedback('Please enable Edit Mode to add widgets', 'error');
      return;
    }
    
    const widgetContainer = createWidgetContainer(widgetId);
    customViewContainers.push(widgetContainer);
    customViewContainerOrder.push(widgetContainer.id);
    
    saveCustomViewContainersToBackend();
    showReorderFeedback('Widget added to Custom View! 🔧', 'success');
    
    closeWidgetGallery();
    renderContainers();
  }
  
  // Show widget upload modal
  function showWidgetUploadModal() {
    const modal = document.createElement('div');
    modal.className = 'modal widget-upload-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
    `;
    
    modalContent.innerHTML = `
      <div class="modal-header">
        <h3>Install Widget</h3>
        <button onclick="closeWidgetUploadModal()" class="close-btn">×</button>
      </div>
      <form id="widget-upload-form" enctype="multipart/form-data">
        <div class="form-group">
          <label for="widget-file">Select Widget Package (ZIP file):</label>
          <input type="file" id="widget-file" name="widget" accept=".zip" required />
        </div>
        <div class="form-group">
          <p class="help-text">
            Widget packages must be ZIP files containing a manifest.json file and widget code.
            See the developer documentation for more details.
          </p>
        </div>
        <div class="modal-footer">
          <button type="submit" class="btn btn-primary">Install Widget</button>
          <button type="button" class="btn btn-secondary" onclick="closeWidgetUploadModal()">Cancel</button>
        </div>
      </form>
    `;
    
    const form = modalContent.querySelector('#widget-upload-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      
      const formData = new FormData();
      const fileInput = document.getElementById('widget-file');
      
      if (!fileInput.files[0]) {
        showReorderFeedback('Please select a widget file', 'error');
        return;
      }
      
      formData.append('widget', fileInput.files[0]);
      
      try {
        const response = await fetch('/api/widgets', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          showReorderFeedback('Widget installed successfully! 🎉', 'success');
          closeWidgetUploadModal();
          closeWidgetGallery();
          
          // Reload widgets and update gallery
          await loadAvailableWidgets();
        } else {
          const error = await response.json();
          showReorderFeedback(`Failed to install widget: ${error.error}`, 'error');
        }
      } catch (error) {
        console.error('Error installing widget:', error);
        showReorderFeedback('Failed to install widget', 'error');
      }
    };
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.onclick = (e) => {
      if (e.target === modal) {
        closeWidgetUploadModal();
      }
    };
  }
  
  // Close widget upload modal
  function closeWidgetUploadModal() {
    const modal = document.querySelector('.widget-upload-modal');
    if (modal) {
      modal.remove();
    }
  }
  
  // Update widget gallery
  function updateWidgetGallery() {
    // This function will be called when widgets are loaded
    // It can be used to update any widget-related UI elements
    console.log('Widget gallery updated with', availableWidgets.length, 'widgets');
  }
  
  // Initialize widget system
  function initializeWidgetSystem() {
    loadAvailableWidgets();
    
    // Add widget button to custom view toolbar
    const customToolbar = document.getElementById('custom-view-toolbar');
    if (customToolbar) {
      const widgetBtn = document.createElement('button');
      widgetBtn.id = 'widget-gallery-btn';
      widgetBtn.innerHTML = '🔧 Widgets';
      widgetBtn.title = 'Open Widget Gallery';
      widgetBtn.onclick = showWidgetGallery;
      customToolbar.appendChild(widgetBtn);
    }
  }
  
  // Modify createContainerElement to handle widgets
  const originalCreateContainerElement = createContainerElement;
  createContainerElement = function(container, categoryGroups, term) {
    if (container.type === 'widget') {
      return createWidgetElement(container);
    }
    return originalCreateContainerElement(container, categoryGroups, term);
  };
  
  // Initialize widget system when page loads
  window.addEventListener('load', () => {
    setTimeout(initializeWidgetSystem, 1000); // Delay to ensure other systems are loaded
  });
  
  
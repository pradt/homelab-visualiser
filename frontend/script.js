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
  function initializeColumns(columnsData) {
    if (columnsData && Array.isArray(columnsData) && columnsData.length > 0) {
      columns = columnsData;
      columnOrder = columnsData.map(col => col.id);
    } else {
      // Create default column if none exist
      createDefaultColumn();
    }
    console.log('Columns initialized:', columns);
  }

  function createDefaultColumn() {
    const defaultColumn = {
      id: generateId(),
      name: 'Default Categories',
      order: 0,
      styling: {
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
      categories: [] // Will be populated based on existing categoryOrder
    };
    
    columns = [defaultColumn];
    columnOrder = [defaultColumn.id];
    
    // Assign existing categories to default column
    if (categoryOrder.length > 0) {
      defaultColumn.categories = [...categoryOrder];
    }
  }

  function createNewColumn(name = 'New Column') {
    const newColumn = {
      id: generateId(),
      name: name,
      order: columns.length,
      styling: {
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
      categories: []
    };
    
    columns.push(newColumn);
    columnOrder.push(newColumn.id);
    return newColumn;
  }

  function getColumnById(columnId) {
    return columns.find(col => col.id === columnId);
  }

  function getCategoryColumn(categoryName) {
    return columns.find(col => col.categories.includes(categoryName));
  }

  function moveCategoryToColumn(categoryName, fromColumnId, toColumnId) {
    const fromColumn = getColumnById(fromColumnId);
    const toColumn = getColumnById(toColumnId);
    
    if (fromColumn && toColumn && fromColumnId !== toColumnId) {
      // Remove from source column
      const categoryIndex = fromColumn.categories.indexOf(categoryName);
      if (categoryIndex > -1) {
        fromColumn.categories.splice(categoryIndex, 1);
      }
      
      // Add to target column
      if (!toColumn.categories.includes(categoryName)) {
        toColumn.categories.push(categoryName);
      }
      
      console.log(`Moved category "${categoryName}" from column "${fromColumn.name}" to "${toColumn.name}"`);
      return true;
    }
    return false;
  }

  function saveColumnsToBackend() {
    return fetch('/api/columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(columns)
    }).then(response => {
      if (!response.ok) {
        throw new Error('Failed to save columns');
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

// Column management for custom view
let columns = [];
let columnOrder = [];
let selectedColumnId = null; // For styling modal
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
    
    // Load containers and columns
    Promise.all([
      fetch('/api/containers').then(res => res.json()),
      fetch('/api/columns').then(res => res.json()).catch(() => null) // Graceful fallback
    ]).then(([containersData, columnsData]) => {
      containers = containersData;
      initializeColumns(columnsData);
      renderContainers();
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
    console.log('renderCustomView called - isEditMode:', isEditMode, 'columns count:', columns.length);
    
    // Clear any existing sortable instances before re-rendering
    try {
      // Destroy column sortable
      if ($.fn.sortable && $('#columns-container').length && $('#columns-container').hasClass('ui-sortable')) {
        $('#columns-container').sortable('destroy');
        console.log('Destroyed columns-container sortable');
      }
      
      // Destroy all category sortables
      $('.column-categories').each(function() {
        if ($(this).hasClass('ui-sortable')) {
          $(this).sortable('destroy');
          console.log('Destroyed column-categories sortable');
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

    // Ensure uncategorized items are in the first column if no columns exist
    if (columns.length === 0) {
      createDefaultColumn();
    }

    // Migrate existing categoryOrder to first column if columns are new
    if (columns[0] && columns[0].categories.length === 0 && categoryOrder.length > 0) {
      columns[0].categories = [...categoryOrder];
    }

    // Add any new categories that aren't assigned to any column to the first column
    Object.keys(categoryGroups).forEach(category => {
      const assignedColumn = getCategoryColumn(category);
      if (!assignedColumn && columns.length > 0) {
        columns[0].categories.push(category);
      }
    });
    
    // Create columns container
    const columnsContainer = document.createElement('div');
    columnsContainer.className = 'columns-container';
    columnsContainer.id = 'columns-container';
    
    // Render each column
    console.log('About to render columns - columnOrder:', columnOrder, 'columns data available:', columns.length);
    columnOrder.forEach(columnId => {
      const column = getColumnById(columnId);
      console.log('Processing column ID:', columnId, 'found column:', column?.name);
      if (column) {
        const columnElement = createColumnElement(column, categoryGroups, term);
        columnsContainer.appendChild(columnElement);
      }
    });
    
    root.appendChild(columnsContainer);
    
    // Initialize sortable if in edit mode - do this only once after DOM is ready
    if (isEditMode) {
      // Use requestAnimationFrame and setTimeout for better timing
      requestAnimationFrame(() => {
        setTimeout(() => {
          console.log('Setting up sortable after DOM render...');
          setupColumnSortable();
        }, 50);
      });
    }
  }
  
  function createColumnElement(column, categoryGroups, term) {
    console.log('createColumnElement called for column:', column.name, 'hideHeader:', column.styling?.hideHeader, 'isEditMode:', isEditMode);
    
    const columnElement = document.createElement('div');
    columnElement.className = 'column';
    columnElement.setAttribute('data-column-id', column.id);
    
    // Column header
    const columnHeader = document.createElement('div');
    columnHeader.className = 'column-header';
    
    const columnTitle = document.createElement('div');
    columnTitle.className = 'column-title';
    
    // Create editable title span
    const titleSpan = document.createElement('span');
    titleSpan.className = 'column-title-text';
    titleSpan.textContent = `📁 ${column.name}`;
    titleSpan.setAttribute('data-column-id', column.id);
    
    // Always make title editable (will check edit mode in the function)
    titleSpan.style.cursor = 'pointer';
    titleSpan.title = 'Click to edit column name (Edit Mode required)';
    titleSpan.onclick = (e) => {
      console.log('Column title clicked:', column.name, 'Edit mode:', isEditMode);
      e.stopPropagation();
      e.preventDefault();
      makeColumnTitleEditable(titleSpan, column.id);
    };
    
    // Visual indicator in edit mode
    if (isEditMode) {
      titleSpan.classList.add('editable');
    }
    
    columnTitle.appendChild(titleSpan);
    
    const columnActions = document.createElement('div');
    columnActions.className = 'column-actions';
    
    if (isEditMode) {
      // Create hamburger menu for column actions
      const hamburgerMenu = document.createElement('div');
      hamburgerMenu.className = 'column-hamburger-menu';
      hamburgerMenu.innerHTML = `
        <div class="column-hamburger-actions">
          <button onclick="showColumnStyleModal('${column.id}')" title="Style Column">🎨 Style</button>
          <button onclick="deleteColumn('${column.id}')" title="Delete Column">🗑️ Delete</button>
        </div>
        <button class="column-hamburger-btn" onclick="toggleColumnHamburgerMenu(this, event)">☰</button>
      `;
      
      const dragHandle = document.createElement('div');
      dragHandle.className = 'column-drag-handle';
      dragHandle.title = 'Drag to reorder column';
      dragHandle.innerHTML = `⋮⋮⋮`;
      
      columnActions.appendChild(hamburgerMenu);
      columnActions.appendChild(dragHandle);
    }
    
    columnHeader.appendChild(columnTitle);
    columnHeader.appendChild(columnActions);
    
    // Categories container for this column
    const categoriesContainer = document.createElement('div');
    categoriesContainer.className = 'column-categories';
    categoriesContainer.setAttribute('data-column-id', column.id);
    
    // Render categories assigned to this column
    column.categories.forEach(categoryName => {
      if (categoryGroups[categoryName]) {
        const categoryGroup = createCategoryGroup(categoryName, categoryGroups[categoryName], column.id);
        categoriesContainer.appendChild(categoryGroup);
      }
    });
    
    // Add drop zone for empty columns (visibility controlled by CSS)
    if (column.categories.length === 0) {
      const dropZone = document.createElement('div');
      dropZone.className = 'category-drop-zone';
      dropZone.innerHTML = '<div class="drop-zone-content">📦 Drop categories here</div>';
      categoriesContainer.appendChild(dropZone);
    }
    
    columnElement.appendChild(columnHeader);
    columnElement.appendChild(categoriesContainer);
    
    // Apply column styling AFTER all elements are created and added to the DOM
    applyColumnStyling(columnElement, column);
    
    return columnElement;
  }

  function createCategoryGroup(category, containers, columnId) {
    const group = document.createElement('div');
    group.className = 'category-group';
    group.setAttribute('data-category', category);
    group.setAttribute('data-column-id', columnId);
    
    const header = document.createElement('div');
    header.className = 'category-header';
    
    const title = document.createElement('div');
    title.className = 'category-title';
    title.innerHTML = `<span>🏷️ ${category}</span>`;
    
    // Only create drag handle, don't set draggable attribute (conflicts with jQuery UI)
    const dragHandle = document.createElement('div');
    dragHandle.className = 'category-drag-handle';
    dragHandle.innerHTML = '⋮⋮⋮';
    dragHandle.title = 'Drag to reorder category or move to another column';
    
    header.appendChild(title);
    header.appendChild(dragHandle);
    
    const containersDiv = document.createElement('div');
    containersDiv.className = 'category-containers';
    
    containers.forEach(container => {
      const containerBox = renderBox(container, '', 0);
      containersDiv.appendChild(containerBox);
    });
    
    group.appendChild(header);
    group.appendChild(containersDiv);
    
    return group;
  }

  function applyColumnStyling(columnElement, column) {
    console.log('applyColumnStyling called for column:', column.name, 'has styling:', !!column.styling);
    if (!column.styling) {
      console.log('No styling found, returning early');
      return;
    }
    
    const style = column.styling;
    console.log('Column styling object:', style);
    
    // Apply header visibility - only hide when NOT in edit mode
    // In edit mode, we need to keep headers visible so users can access menus
    const columnHeader = columnElement.querySelector('.column-header');
    console.log('Found columnHeader element:', !!columnHeader);
    if (columnHeader) {
      console.log('applyColumnStyling - hideHeader:', style.hideHeader, 'isEditMode:', isEditMode, 'will hide:', style.hideHeader && !isEditMode);
      if (style.hideHeader && !isEditMode) {
        columnHeader.style.display = 'none';
        console.log('Hiding column header');
      } else {
        columnHeader.style.display = '';
        console.log('Showing column header');
      }
    } else {
      console.log('columnHeader element not found!');
    }
    
    // Apply background
    if (style.bgType === 'color' && style.backgroundColor) {
      columnElement.style.backgroundColor = style.backgroundColor;
    } else if (style.bgType === 'gradient' && style.backgroundGradient) {
      columnElement.style.background = style.backgroundGradient;
    } else if (style.bgType === 'css' && style.backgroundCSS) {
      columnElement.style.cssText += style.backgroundCSS;
    }
    
    // Apply background image
    if (style.backgroundImage) {
      columnElement.style.backgroundImage = `url('${style.backgroundImage}')`;
      columnElement.style.backgroundSize = 'cover';
      columnElement.style.backgroundPosition = 'center';
    }
    
    // Apply background opacity
    if (style.backgroundOpacity && style.backgroundOpacity !== 100) {
      columnElement.style.opacity = style.backgroundOpacity / 100;
    }
    
    // Apply border
    if (style.borderColor) {
      columnElement.style.borderColor = style.borderColor;
    }
    if (style.borderSize) {
      columnElement.style.borderWidth = style.borderSize + 'px';
    }
    if (style.borderStyle) {
      columnElement.style.borderStyle = style.borderStyle;
    }
    if (style.borderCSS) {
      columnElement.style.cssText += style.borderCSS;
    }
    
    // Apply additional styles
    if (style.borderRadius) {
      columnElement.style.borderRadius = style.borderRadius + 'px';
    }
    if (style.boxShadow) {
      columnElement.style.boxShadow = style.boxShadow;
    }
    if (style.padding) {
      columnElement.style.padding = style.padding + 'px';
    }
    if (style.margin) {
      columnElement.style.margin = style.margin + 'px';
    }
    if (style.customCSS) {
      columnElement.style.cssText += style.customCSS;
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
            const newColumn = getColumnById(newColumnId);
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
      status.textContent = '📝 Edit Mode: Drag categories between columns, reorder columns, and style them. Container content is hidden for better performance.';
      
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
        
        // Show immediate feedback
        showReorderFeedback('Edit mode activated - drag categories between columns!', 'success');
        
        // Better timing to ensure DOM is ready and feedback is shown
        requestAnimationFrame(() => {
          setTimeout(() => {
            console.log('Setting up sortable from toggleEditMode...');
            console.log('Edit mode class present before setup:', containerRoot.classList.contains('edit-mode-active'));
            setupColumnSortable();
          }, 150);
        });
      }
      
      console.log('Edit mode activated - multi-column editing enabled');
    } else {
      editBtn.textContent = '✏️ Edit Mode';
      editBtn.classList.remove('edit-active');
      status.textContent = 'Click Edit Mode to manage columns and categories';
      containerRoot.classList.remove('edit-mode-active');
      
      // Remove from toolbar too
      if (customToolbar) {
        customToolbar.classList.remove('edit-mode-active');
      }
      
      // Destroy sortable instances
      try {
        if ($('#columns-container').hasClass('ui-sortable')) {
          $('#columns-container').sortable('destroy');
        }
        $('.column-categories').each(function() {
          if ($(this).hasClass('ui-sortable')) {
            $(this).sortable('destroy');
          }
        });
        console.log('All sortable instances destroyed successfully');
      } catch (e) {
        console.warn('Failed to destroy sortable instances:', e);
      }
      
      // Re-render to hide drop zones and edit controls
      if (currentView === 'custom') {
        renderContainers();
      }
      
      // Save columns to backend when exiting edit mode
      saveColumnsToBackend()
        .then(() => {
          showReorderFeedback('Column configuration saved successfully! 💾', 'success');
        })
        .catch((error) => {
          console.error('Failed to save columns:', error);
          showReorderFeedback('Failed to save column configuration', 'error');
        });
      
      console.log('Edit mode deactivated - columns saved to backend');
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
    const column = getColumnById(columnId);
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
    
    const column = getColumnById(columnId);
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
        saveColumnsToBackend()
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
        const column = getColumnById(columnId);
        
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
          applyColumnStyling(columnElement, column);
          console.log('Applied styling immediately to column:', column.name);
        }
        
        // Save to backend
        saveColumnsToBackend()
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
  
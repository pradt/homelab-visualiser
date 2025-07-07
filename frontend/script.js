function debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }
  
  function generateId() {
    return 'xxxxxx-xxxx-4xxx'.replace(/[x]/g, c =>
      (Math.random() * 16 | 0).toString(16)
    );
  }
  
  let containers = [];
  let currentView = 'box';
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
    fetch('/api/containers')
      .then(res => res.json())
      .then(data => {
        containers = data;
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
    root.innerHTML = '';
    const term = document.getElementById('search').value.toLowerCase();
  
    if (currentView === 'box') {
      renderBoxView(root, term);
    } else {
      root.className = 'tree-view';
      renderTreeView(root, term);
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
  
    header.innerHTML = `
      <span class="tree-toggle" onclick="toggleTreeItem(this)">${toggleIcon}</span>
      <div class="tree-item-content-wrapper">
        <span class="tree-item-left">${renderIcon(container.icon)} <strong>${container.name}</strong></span>
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
    currentView = view;
    document.getElementById('box-view-btn').classList.toggle('active', view === 'box');
    document.getElementById('tree-view-btn').classList.toggle('active', view === 'tree');
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
  
  // Close hamburger menus when clicking outside
  document.addEventListener('click', function(event) {
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
  });
  
  // Prevent menu from closing when clicking inside it
  document.addEventListener('click', function(event) {
    if (event.target.closest('.hamburger-actions')) {
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
  
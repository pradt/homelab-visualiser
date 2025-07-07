// FontAwesome Icon Definitions
const fontAwesomeIcons = [
    // Core server/devices
    { class: 'fas fa-server', name: 'Server' },
    { class: 'fas fa-desktop', name: 'Desktop' },
    { class: 'fas fa-laptop', name: 'Laptop' },
    { class: 'fas fa-mobile-alt', name: 'Mobile' },
    { class: 'fas fa-tablet-alt', name: 'Tablet' },
  
    // Infrastructure & environment
    { class: 'fas fa-home', name: 'Home' },
    { class: 'fas fa-building', name: 'Building' },
    { class: 'fas fa-warehouse', name: 'Warehouse' },
  
    // Settings/security/tools
    { class: 'fas fa-cog', name: 'Settings' },
    { class: 'fas fa-tools', name: 'Tools' },
    { class: 'fas fa-wrench', name: 'Wrench' },
    { class: 'fas fa-shield-alt', name: 'Shield' },
    { class: 'fas fa-lock', name: 'Lock' },
    { class: 'fas fa-key', name: 'Key' },
  
    // Data & connectivity
    { class: 'fas fa-database', name: 'Database' },
    { class: 'fas fa-network-wired', name: 'Network' },
    { class: 'fas fa-cloud', name: 'Cloud' },
  
    // Alerts & status
    { class: 'fas fa-fire', name: 'Fire' },
    { class: 'fas fa-star', name: 'Star' },
    { class: 'fas fa-heart', name: 'Heart' },
    { class: 'fas fa-check', name: 'Check' },
    { class: 'fas fa-times', name: 'Times' },
    { class: 'fas fa-exclamation-triangle', name: 'Warning' },
    { class: 'fas fa-info-circle', name: 'Info' },
    { class: 'fas fa-question-circle', name: 'Question' },
  
    // Brands
    { class: 'fab fa-docker', name: 'Docker' },
    { class: 'fab fa-github', name: 'GitHub' },
    { class: 'fab fa-ubuntu', name: 'Ubuntu' },
    { class: 'fab fa-debian', name: 'Debian' },
    { class: 'fab fa-centos', name: 'CentOS' },
    { class: 'fab fa-redhat', name: 'Red Hat' },
    { class: 'fab fa-raspberry-pi', name: 'Raspberry Pi' },
    { class: 'fab fa-aws', name: 'AWS' },
    { class: 'fab fa-google', name: 'Google' },
    { class: 'fab fa-microsoft', name: 'Microsoft' },
    { class: 'fab fa-apple', name: 'Apple' },
    { class: 'fab fa-linux', name: 'Linux' },
    { class: 'fab fa-windows', name: 'Windows' },
  
    // Hardware components & power
    { class: 'fas fa-hdd', name: 'Hard Drive' },
    { class: 'fas fa-memory', name: 'Memory' },
    { class: 'fas fa-microchip', name: 'CPU' },
    { class: 'fas fa-ethernet', name: 'Ethernet' },
    { class: 'fas fa-wifi', name: 'WiFi' },
    { class: 'fas fa-bluetooth', name: 'Bluetooth' },
    { class: 'fas fa-usb', name: 'USB' },
    { class: 'fas fa-plug', name: 'Plug' },
    { class: 'fas fa-bolt', name: 'Lightning' },
    { class: 'fas fa-solar-panel', name: 'Solar Panel' },
    { class: 'fas fa-battery-full', name: 'Battery' },
  
    // Environmental & diagnostics
    { class: 'fas fa-thermometer-half', name: 'Temperature' },
    { class: 'fas fa-tachometer-alt', name: 'Speedometer' },
    { class: 'fas fa-chart-line', name: 'Chart' },
    { class: 'fas fa-chart-bar', name: 'Bar Chart' },
    { class: 'fas fa-chart-pie', name: 'Pie Chart' },
  
    // Time & scheduling
    { class: 'fas fa-clock', name: 'Clock' },
    { class: 'fas fa-calendar', name: 'Calendar' },
    { class: 'fas fa-calendar-alt', name: 'Calendar Alt' },
    { class: 'fas fa-calendar-check', name: 'Calendar Check' },
    { class: 'fas fa-calendar-times', name: 'Calendar Times' },
  
    // Notifications & communication
    { class: 'fas fa-bell', name: 'Bell' },
    { class: 'fas fa-bell-slash', name: 'Bell Slash' },
    { class: 'fas fa-envelope', name: 'Envelope' },
    { class: 'fas fa-envelope-open', name: 'Envelope Open' },
    { class: 'fas fa-phone', name: 'Phone' },
    { class: 'fas fa-phone-alt', name: 'Phone Alt' },
    { class: 'fas fa-fax', name: 'Fax' },
  
    // Media devices
    { class: 'fas fa-print', name: 'Printer' },
    { class: 'fas fa-scanner', name: 'Scanner' },
    { class: 'fas fa-camera', name: 'Camera' },
    { class: 'fas fa-video', name: 'Video' },
    { class: 'fas fa-microphone', name: 'Microphone' },
    { class: 'fas fa-headphones', name: 'Headphones' },
    { class: 'fas fa-speaker', name: 'Speaker' },
  
    // Volume controls
    { class: 'fas fa-volume-up', name: 'Volume Up' },
    { class: 'fas fa-volume-down', name: 'Volume Down' },
    { class: 'fas fa-volume-mute', name: 'Volume Mute' },
    { class: 'fas fa-volume-off', name: 'Volume Off' },
  
    // Playback controls
    { class: 'fas fa-play', name: 'Play' },
    { class: 'fas fa-pause', name: 'Pause' },
    { class: 'fas fa-stop', name: 'Stop' },
    { class: 'fas fa-forward', name: 'Forward' },
    { class: 'fas fa-backward', name: 'Backward' },
    { class: 'fas fa-step-forward', name: 'Step Forward' },
    { class: 'fas fa-step-backward', name: 'Step Backward' },
    { class: 'fas fa-fast-forward', name: 'Fast Forward' },
    { class: 'fas fa-fast-backward', name: 'Fast Backward' },
    { class: 'fas fa-eject', name: 'Eject' },
  
    // View & window controls
    { class: 'fas fa-compress', name: 'Compress' },
    { class: 'fas fa-expand', name: 'Expand' },
    { class: 'fas fa-expand-arrows-alt', name: 'Expand Arrows' },
    { class: 'fas fa-compress-arrows-alt', name: 'Compress Arrows' },
  
    // Search & filtering
    { class: 'fas fa-search', name: 'Search' },
    { class: 'fas fa-search-plus', name: 'Search Plus' },
    { class: 'fas fa-search-minus', name: 'Search Minus' },
    { class: 'fas fa-search-location', name: 'Search Location' },
    { class: 'fas fa-filter', name: 'Filter' },
    { class: 'fas fa-sort', name: 'Sort' },
    { class: 'fas fa-sort-up', name: 'Sort Up' },
    { class: 'fas fa-sort-down', name: 'Sort Down' },
    { class: 'fas fa-sort-alpha-up', name: 'Sort Alpha Up' },
    { class: 'fas fa-sort-alpha-down', name: 'Sort Alpha Down' },
    { class: 'fas fa-sort-numeric-up', name: 'Sort Numeric Up' },
    { class: 'fas fa-sort-numeric-down', name: 'Sort Numeric Down' },
    { class: 'fas fa-sort-amount-up', name: 'Sort Amount Up' },
    { class: 'fas fa-sort-amount-down', name: 'Sort Amount Down' },
  
    // Feedback & reactions
    { class: 'fas fa-thumbs-up', name: 'Thumbs Up' },
    { class: 'fas fa-thumbs-down', name: 'Thumbs Down' },
    { class: 'fas fa-heart-broken', name: 'Heart Broken' },
    { class: 'fas fa-heartbeat', name: 'Heartbeat' },
  
    // Emoticons/faces
    { class: 'fas fa-smile', name: 'Smile' },
    { class: 'fas fa-frown', name: 'Frown' },
    { class: 'fas fa-meh', name: 'Meh' },
    { class: 'fas fa-laugh', name: 'Laugh' },
    { class: 'fas fa-angry', name: 'Angry' },
    { class: 'fas fa-sad-tear', name: 'Sad Tear' },
    { class: 'fas fa-sad-cry', name: 'Sad Cry' },
    { class: 'fas fa-surprise', name: 'Surprise' },
    { class: 'fas fa-tired', name: 'Tired' },
    { class: 'fas fa-dizzy', name: 'Dizzy' },
    { class: 'fas fa-kiss', name: 'Kiss' },
    { class: 'fas fa-kiss-wink-heart', name: 'Kiss Wink Heart' },
    { class: 'fas fa-grin', name: 'Grin' },
    { class: 'fas fa-grin-alt', name: 'Grin Alt' },
    { class: 'fas fa-grin-beam', name: 'Grin Beam' },
    { class: 'fas fa-grin-beam-sweat', name: 'Grin Beam Sweat' },
    { class: 'fas fa-grin-hearts', name: 'Grin Hearts' },
    { class: 'fas fa-grin-squint', name: 'Grin Squint' },
    { class: 'fas fa-grin-squint-tears', name: 'Grin Squint Tears' },
    { class: 'fas fa-grin-stars', name: 'Grin Stars' },
    { class: 'fas fa-grin-tears', name: 'Grin Tears' },
    { class: 'fas fa-grin-tongue', name: 'Grin Tongue' },
    { class: 'fas fa-grin-tongue-squint', name: 'Grin Tongue Squint' },
    { class: 'fas fa-grin-tongue-wink', name: 'Grin Tongue Wink' },
    { class: 'fas fa-grin-wink', name: 'Grin Wink' },
    { class: 'fas fa-grin-wink-tears', name: 'Grin Wink Tears' }
  ];
  
  module.exports = fontAwesomeIcons;
  
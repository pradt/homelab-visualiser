const crypto = require('crypto');

class ConfigManager {
  constructor() {
    this.encryptionKey = process.env.WIDGET_ENCRYPTION_KEY;
    if (!this.encryptionKey) {
      console.warn('[ConfigManager] WIDGET_ENCRYPTION_KEY not set. Sensitive fields will not be encrypted.');
    }
  }

  // Encrypt sensitive fields in widget configuration
  encryptSensitiveFields(config, manifest) {
    if (!this.encryptionKey || !manifest.configSchema) {
      return config;
    }

    const encryptedConfig = { ...config };
    
    for (const [fieldName, fieldSchema] of Object.entries(manifest.configSchema)) {
      if (fieldSchema.sensitive === true && encryptedConfig[fieldName]) {
        encryptedConfig[fieldName] = this.encrypt(encryptedConfig[fieldName]);
      }
    }
    
    return encryptedConfig;
  }

  // Decrypt sensitive fields in widget configuration
  decryptSensitiveFields(config, manifest) {
    if (!this.encryptionKey || !manifest.configSchema) {
      return config;
    }

    const decryptedConfig = { ...config };
    
    for (const [fieldName, fieldSchema] of Object.entries(manifest.configSchema)) {
      if (fieldSchema.sensitive === true && decryptedConfig[fieldName]) {
        try {
          decryptedConfig[fieldName] = this.decrypt(decryptedConfig[fieldName]);
        } catch (error) {
          console.error(`[ConfigManager] Failed to decrypt field ${fieldName}:`, error);
          // Keep encrypted value if decryption fails
        }
      }
    }
    
    return decryptedConfig;
  }

  // Encrypt a string value
  encrypt(text) {
    if (!this.encryptionKey) {
      return text;
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  // Decrypt a string value
  decrypt(encryptedText) {
    if (!this.encryptionKey) {
      return encryptedText;
    }

    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encrypted = textParts.join(':');
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Check if a field is marked as sensitive
  isSensitiveField(fieldName, manifest) {
    return manifest.configSchema && 
           manifest.configSchema[fieldName] && 
           manifest.configSchema[fieldName].sensitive === true;
  }

  // Get a list of sensitive fields for a widget
  getSensitiveFields(manifest) {
    if (!manifest.configSchema) {
      return [];
    }

    return Object.entries(manifest.configSchema)
      .filter(([_, schema]) => schema.sensitive === true)
      .map(([fieldName, _]) => fieldName);
  }
}

module.exports = ConfigManager; 
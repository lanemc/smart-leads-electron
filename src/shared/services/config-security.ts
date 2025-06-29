import { safeStorage } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AppConfig } from '../types/leads';

const CONFIG_FILE = 'config.json';
const ENCRYPTED_CONFIG_FILE = 'config.encrypted';

export class ConfigSecurity {
  private static configDir = process.env.NODE_ENV === 'development' 
    ? './config' 
    : path.join(process.env.HOME || process.env.USERPROFILE || '', '.smart-leads');

  static async saveConfig(config: AppConfig): Promise<void> {
    try {
      // Ensure config directory exists
      await fs.mkdir(this.configDir, { recursive: true });

      // Create a copy without sensitive data for plaintext storage
      const publicConfig = {
        ...config,
        openai: {
          ...config.openai,
          apiKey: config.openai.apiKey ? '[ENCRYPTED]' : ''
        }
      };

      // Save public config
      const publicConfigPath = path.join(this.configDir, CONFIG_FILE);
      await fs.writeFile(publicConfigPath, JSON.stringify(publicConfig, null, 2));

      // Encrypt and save sensitive data if available
      if (config.openai.apiKey && safeStorage.isEncryptionAvailable()) {
        const sensitiveData = {
          openaiApiKey: config.openai.apiKey,
          apiAuthToken: config.api?.authToken
        };

        const encrypted = safeStorage.encryptString(JSON.stringify(sensitiveData));
        const encryptedConfigPath = path.join(this.configDir, ENCRYPTED_CONFIG_FILE);
        await fs.writeFile(encryptedConfigPath, encrypted);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      throw new Error('Failed to save configuration');
    }
  }

  static async loadConfig(): Promise<AppConfig | null> {
    try {
      const configPath = path.join(this.configDir, CONFIG_FILE);
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config: AppConfig = JSON.parse(configContent);

      // Load encrypted sensitive data if available
      if (safeStorage.isEncryptionAvailable()) {
        try {
          const encryptedConfigPath = path.join(this.configDir, ENCRYPTED_CONFIG_FILE);
          const encryptedData = await fs.readFile(encryptedConfigPath);
          const decryptedString = safeStorage.decryptString(encryptedData);
          const sensitiveData = JSON.parse(decryptedString);

          // Restore sensitive data
          if (sensitiveData.openaiApiKey) {
            config.openai.apiKey = sensitiveData.openaiApiKey;
          }
          if (sensitiveData.apiAuthToken && config.api) {
            config.api.authToken = sensitiveData.apiAuthToken;
          }
        } catch (encryptionError) {
          console.warn('Failed to decrypt sensitive data:', encryptionError);
          // Continue with public config only
        }
      }

      return config;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return null; // Config file doesn't exist
      }
      console.error('Failed to load config:', error);
      throw new Error('Failed to load configuration');
    }
  }

  static async deleteConfig(): Promise<void> {
    try {
      const configPath = path.join(this.configDir, CONFIG_FILE);
      const encryptedConfigPath = path.join(this.configDir, ENCRYPTED_CONFIG_FILE);

      await Promise.allSettled([
        fs.unlink(configPath),
        fs.unlink(encryptedConfigPath)
      ]);
    } catch (error) {
      console.error('Failed to delete config:', error);
    }
  }

  static async configExists(): Promise<boolean> {
    try {
      const configPath = path.join(this.configDir, CONFIG_FILE);
      await fs.access(configPath);
      return true;
    } catch {
      return false;
    }
  }

  static validateApiKey(apiKey: string): boolean {
    // OpenAI API key validation
    if (apiKey.startsWith('sk-') && apiKey.length >= 20) {
      return true;
    }
    return false;
  }

  static sanitizeForLogs(config: AppConfig): AppConfig {
    return {
      ...config,
      openai: {
        ...config.openai,
        apiKey: config.openai.apiKey ? '***[REDACTED]***' : ''
      },
      api: config.api ? {
        ...config.api,
        authToken: config.api.authToken ? '***[REDACTED]***' : ''
      } : undefined
    };
  }
}
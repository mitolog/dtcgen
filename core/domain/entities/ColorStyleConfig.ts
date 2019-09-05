export class ColorStyleConfig {
  isEnabled: boolean;
  keywords?: string[];
  caseSensitive?: boolean;

  constructor(config: ColorStyleConfig) {
    this.isEnabled = config.isEnabled || false;
    this.keywords = config.keywords || null;
    this.caseSensitive = config.caseSensitive || false;
  }
}

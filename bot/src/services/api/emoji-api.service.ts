import { AxiosInstance } from "axios";
import { BaseAPIService } from "./base-api.service";

export interface CreateEmojiDto {
  type: string;
  key: string;
  emoji: string;
}

export interface EmojiConfig {
  id: number;
  type: string;
  key: string;
  emoji: string;
  createdAt: Date;
  updatedAt: Date;
}

export class EmojiAPIService extends BaseAPIService {
  constructor(api: AxiosInstance) {
    super(api);
  }

  /**
   * Crée une nouvelle configuration d'emoji
   */
  async createEmoji(type: string, key: string, emoji: string): Promise<EmojiConfig> {
    return this.post<EmojiConfig>("/admin/emojis", { type, key, emoji });
  }

  /**
   * Liste tous les emojis (avec filtre optionnel par type)
   */
  async listEmojis(type?: string): Promise<EmojiConfig[]> {
    const params = type ? { type } : undefined;
    return this.get<EmojiConfig[]>("/admin/emojis/list", params);
  }

  /**
   * Supprime une configuration d'emoji
   */
  async deleteEmoji(type: string, key: string): Promise<void> {
    return this.delete<void>(`/admin/emojis/${type}/${key}`);
  }

  /**
   * Récupère les emojis disponibles (pour le picker)
   */
  async getAvailableEmojis(type?: string): Promise<Record<string, string>> {
    const params = type ? { type } : undefined;
    return this.get<Record<string, string>>("/admin/emojis/available", params);
  }
}

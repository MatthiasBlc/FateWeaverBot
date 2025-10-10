export interface HelpSection {
  name: string;
  value: string;
  inline?: boolean;
}

export interface HelpEmbedData {
  title: string;
  description: string;
  color: string;
  sections: HelpSection[];
  username: string;
  avatarUrl: string;
}
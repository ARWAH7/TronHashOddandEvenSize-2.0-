
export type BlockType = 'ODD' | 'EVEN';
export type SizeType = 'BIG' | 'SMALL';

export interface BlockData {
  height: number;
  hash: string;
  resultValue: number;
  type: BlockType;
  sizeType: SizeType;
  timestamp: string;
}

export interface IntervalRule {
  id: string;
  label: string;
  value: number;
  startBlock: number; // 0 implies alignment to absolute height
  trendRows: number;  // Grid rows for Trend (Big Road) charts
  beadRows: number;   // Grid rows for Bead Road charts
}

export type IntervalType = number;

export interface GridCell {
  type: BlockType | SizeType | null;
  value?: number;
}

export interface AppConfig {
  apiKey: string;
}

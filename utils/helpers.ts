
import { BlockData, BlockType, SizeType, GridCell } from '../types';

const TRON_GRID_BASE = "https://api.trongrid.io";

// Persistent memory cache for blocks to avoid re-fetching same data
const memoryCache = new Map<number, BlockData>();

export const deriveResultFromHash = (hash: string): number => {
  if (!hash) return 0;
  const digits = hash.match(/\d/g);
  if (digits && digits.length > 0) {
    return parseInt(digits[digits.length - 1], 10);
  }
  return 0;
};

export const formatTimestamp = (ts: number): string => {
  const date = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchWithRetry = async (url: string, options: any, retries = 3, backoff = 500): Promise<any> => {
  try {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      if (retries > 0) {
        await wait(backoff);
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
      throw new Error("Rate limit exceeded (429). Please try again later.");
    }

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    const data = await response.json();
    if (data.Error) throw new Error(data.Error);
    return data;
  } catch (error) {
    if (retries > 0) {
      await wait(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
};

export const fetchLatestBlock = async (apiKey: string) => {
  return fetchWithRetry(`${TRON_GRID_BASE}/wallet/getnowblock`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
      'TRON-PRO-API-KEY': apiKey
    },
    body: '{}'
  });
};

export const fetchBlockByNum = async (num: number, apiKey: string) => {
  if (memoryCache.has(num)) return memoryCache.get(num);

  const data = await fetchWithRetry(`${TRON_GRID_BASE}/wallet/getblockbynum`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
      'TRON-PRO-API-KEY': apiKey
    },
    body: JSON.stringify({ num })
  });

  if (!data.blockID) throw new Error(`Block ${num} not found`);
  
  const block = transformTronBlock(data);
  memoryCache.set(num, block);
  return block;
};

export const transformTronBlock = (raw: any): BlockData => {
  const hash = raw.blockID;
  const height = raw.block_header.raw_data.number;
  const timestampRaw = raw.block_header.raw_data.timestamp;
  const resultValue = deriveResultFromHash(hash);
  
  return {
    height,
    hash,
    resultValue,
    type: resultValue % 2 === 0 ? 'EVEN' : 'ODD',
    sizeType: resultValue >= 5 ? 'BIG' : 'SMALL',
    timestamp: formatTimestamp(timestampRaw)
  };
};

export const isAligned = (height: number, interval: number): boolean => {
  if (interval === 1) return true;
  return height % interval === 0;
};

/**
 * Big Road Calculation:
 * New column when result changes.
 */
export const calculateTrendGrid = (
  blocks: BlockData[], 
  typeKey: 'type' | 'sizeType',
  rows: number = 6
): GridCell[][] => {
  if (blocks.length === 0) return Array(24).fill(Array(rows).fill({ type: null }));
  
  const chronological = [...blocks].sort((a, b) => a.height - b.height);
  const columns: GridCell[][] = [];
  let currentColumn: GridCell[] = [];
  let lastVal: string | null = null;

  chronological.forEach((block) => {
    const currentVal = block[typeKey];
    if (currentVal !== lastVal || currentColumn.length >= rows) {
      if (currentColumn.length > 0) {
        while (currentColumn.length < rows) {
          currentColumn.push({ type: null });
        }
        columns.push(currentColumn);
      }
      currentColumn = [];
      lastVal = currentVal;
    }
    currentColumn.push({ type: currentVal as any, value: block.resultValue });
  });

  if (currentColumn.length > 0) {
    while (currentColumn.length < rows) {
      currentColumn.push({ type: null });
    }
    columns.push(currentColumn);
  }

  const minCols = 24;
  while (columns.length < minCols) {
    columns.push(Array(rows).fill({ type: null }));
  }

  return columns;
};

/**
 * Bead Road Calculation:
 * Sequential filling: top-to-bottom, column-by-column.
 */
export const calculateBeadGrid = (
  blocks: BlockData[],
  typeKey: 'type' | 'sizeType',
  rows: number = 6
): GridCell[][] => {
  const minCols = 24;
  const chronological = [...blocks].sort((a, b) => a.height - b.height);
  const totalItems = chronological.length;
  const numCols = Math.max(minCols, Math.ceil(totalItems / rows));
  
  const columns: GridCell[][] = [];
  for (let c = 0; c < numCols; c++) {
    const column: GridCell[] = [];
    for (let r = 0; r < rows; r++) {
      const index = c * rows + r;
      if (index < totalItems) {
        const block = chronological[index];
        column.push({ type: block[typeKey] as any, value: block.resultValue });
      } else {
        column.push({ type: null });
      }
    }
    columns.push(column);
  }
  
  return columns;
};

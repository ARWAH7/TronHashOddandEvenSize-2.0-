// 长龙统计 API 客户端

const BACKEND_API_URL = 'http://localhost:3001';

// 防抖函数
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 保存长龙统计
 */
export async function saveDragonStats(stats: any): Promise<void> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/dragon/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats)
    });
    const result = await response.json();
    if (!result.success) {
      console.error('[Dragon API] 保存统计失败:', result.error);
    }
  } catch (error) {
    console.error('[Dragon API] 保存统计失败:', error);
  }
}

/**
 * 防抖保存（避免频繁调用）
 */
export const debouncedSaveDragonStats = debounce(saveDragonStats, 2000);

/**
 * 获取长龙统计
 */
export async function loadDragonStats(): Promise<any> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/dragon/stats`);
    const result = await response.json();

    if (result.success && result.data) {
      console.log('[Dragon API] 加载统计成功');
      return result.data;
    } else {
      return null;
    }
  } catch (error) {
    console.error('[Dragon API] 加载统计失败:', error);
    return null;
  }
}

/**
 * 清除长龙统计
 */
export async function clearDragonStats(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/dragon/stats`, {
      method: 'DELETE'
    });
    const result = await response.json();

    if (result.success) {
      console.log('[Dragon API] 统计已清除');
      return true;
    } else {
      console.error('[Dragon API] 清除统计失败:', result.error);
      return false;
    }
  } catch (error) {
    console.error('[Dragon API] 清除统计失败:', error);
    return false;
  }
}

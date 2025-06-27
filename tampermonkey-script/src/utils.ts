export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error("Capacity must be greater than 0.");
    }
    this.capacity = capacity;
    this.cache = new Map<K, V>();
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    // 删除并重新设置以更新顺序（最近使用）
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key); // 删除旧位置
    } else if (this.cache.size >= this.capacity) {
      // 删除最早插入（即最少使用）的 key
      const oldestKey = this.cache.keys().next().value;
      oldestKey && this.cache.delete(oldestKey);
    }
    this.cache.set(key, value); // 插入到 Map 末尾（最新使用）
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  values(): V[] {
    return Array.from(this.cache.values());
  }

  entries(): [K, V][] {
    return Array.from(this.cache.entries());
  }
}


export function omit<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result: Record<string, any> = {};

  // Iterate over the object's own enumerable property keys
  Object.keys(obj).forEach((key) => {
    // Only copy the key if it is not in the keys to omit
    if (!(keys as string[]).includes(key)) {
      result[key] = obj[key as keyof T];
    }
  });

  return result as Omit<T, K>;
}

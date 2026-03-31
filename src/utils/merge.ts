/**
 * 递归合并两个对象 (深拷贝)
 * - 对象内部的键值对会逐一对比合并
 * - 数组会被直接替换 (符合视频配置列表的常见逻辑)
 * - 原始类型会被直接替换
 */
export const deepMerge = <T extends Record<string, any>>(target: T, source: any): T => {
  if (!source) return target;
  
  const result = { ...target };

  Object.keys(source).forEach((key) => {
    const targetValue = target[key];
    const sourceValue = source[key];

    if (
      sourceValue && 
      typeof sourceValue === 'object' && 
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      // 递归处理嵌套对象
      result[key as keyof T] = deepMerge(targetValue, sourceValue);
    } else {
      // 数组或原始值直接覆盖
      result[key as keyof T] = sourceValue;
    }
  });

  return result;
};

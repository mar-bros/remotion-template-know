# Remotion 项目开发经验与坑点总结 (Best Practices)

本项目在开发过程中经历了几次重大的布局重构，从最初的 CSS `vh/vw` 到 `rem/em`，再到最终定稿的自定义 `useScale` 体系。以下是总结出的核心经验，建议在后续所有 Remotion 项目中推广。

## 1. 核心缩放哲学：禁用原生 Viewport 单位

### ❌ 坑点：`vh/vw` 的渲染不一致性
在 Remotion 的 **Studio 预览** 和 **Headless 渲染 (npx remotion render)** 之间，原生的 CSS `vh` 和 `vw` 可能会表现不一致。这是因为 Headless 渲染时的视口定义可能受限于宿主环境，导致最终导出的视频出现裁剪或字体过大。

### ✅ 解决方案：自定义 `useScale` 钩子
通过 `useVideoConfig()` 获取物理像素宽度和高度，自己计算比例。
- **`s(px)`**: 基于高度（如 1920）计算的缩放像素。
- **`vw(%) / vh(%)`**: 基于当前视频配置的精确百分比宽度/高度。
- **`vv(%)` (Smart Viewport)**: 自动根据横竖屏切换基准轴。横排用 `vw`，竖排用 `vh`。这保证了 UI 元素在不同画幅下视觉体感一致。

```typescript
// useScale.ts 核心逻辑
const vw = (p: number) => (width * p) / 100;
const vh = (p: number) => (height * p) / 100;
const vv = (p: number) => isLandscape ? vw(p) : vh(p);
```

---

## 2. 布局陷阱：Flexbox 与占位

### ❌ 坑点：`flex: 1` 导致的空洞
在横屏布局中，如果给“左侧图片”和“右侧选项”都设置 `flex: 1`，它们会各自强行占据 50% 的宽度。如果图片本身是长方形（受高度限制），在宽屏下图片两边会出现巨大的死白空洞，将选项挤向边缘。

### ✅ 解决方案：Center 聚拢法
- 容器使用 `justifyContent: "center"`。
- 图片容器设置 `flex: "none"` 并给定基于比例的宽度（如 `s(950)`）。
- 选项容器使用 `flex: 1` 或 `flex: "1 1 auto"` 来吸收剩余空间。
这样可以确保内容始终向中心靠拢，视觉更紧致。

---

## 3. 渲染性能与抖动 (Jitter)

### ❌ 坑点：CSS `transition` 鬼畜
**严禁在 Remotion 核心交互元素上使用 CSS `transition`！**
由于 Remotion 是逐帧截屏渲染，如果使用了 `transition: all 0.3s`，在渲染时可能会因为补帧逻辑与截屏时机冲突，导致生成的视频中元素发生疯狂抖动（Ghosting/Stuttering）。

### ✅ 解决方案：Spring 动画
统一使用 Remotion 自带的 `spring` 或 `interpolate` 函数：
- 它们是基于 Frame 的确定性数学计算。
- 无论渲染速度如何，同一帧产生的结果永远一致。

---

## 4. 文字防爆屏策略

### ❌ 坑点：长文本溢出
在参数化视频中，题目文本的长度不可控。使用固定像素或不稳定的 `em` 极易导致文字冲出屏幕。

### ✅ 解决方案：
- 使用 `vv()` 这种相对大轴的单位定义字号。
- 给容器设置基于比例的 `maxWidth`。
- 建议配合 `lineHeight: 1.4` 及以上，增加呼吸感，防止多行文本挤成一团。

---

## 5. 音频同步

### ⚠️ 注意项：Sequence 包装
音频（`Audio`）必须配合 `Sequence` 使用，以确保它在特定的时间轴段落精准触发。直接在主组件里通过条件判定渲染 `Audio` 可能会导致音频在某些帧丢失或重置。

---

## 6. 开发工作流建议

- **横竖屏随时切换**：在开发过程中，应随时修改 `example.json` 的 `width` 和 `height` 来检查布局鲁棒性。
- **确定性思维**：记住你写的是“每一帧的状态”，而不是“随着时间流逝的动画”。所有依赖 `frame` 的变量都应该是纯函数计算。

---

## 7. 参数读取与深度合并 (Param Merging)

### ❌ 坑点：Remotion 默认的浅合并 (Shallow Merge)
Remotion 默认会将 `defaultProps` 和通过 CLI/Studio 传入的 `inputProps` 进行**浅合并**。
这意味着，如果你的配置对象极其复杂（如嵌套的 `globalAudio` 或 `theme`），一旦你在 CLI 中只传入了 `{ globalAudio: { bgMusic: "new.mp3" } }`，那么原先在默认值里的 `bgMusicVolume` 等其他同级字段会全部丢失。

### ✅ 解决方案：在 `calculateMetadata` 中执行 `deepMerge`
不要完全依赖 Remotion 的默认行为。在 `Root.tsx` 的 `calculateMetadata` 函数中：
1. 使用 `getInputProps()` 获取原始传入参数。
2. 手动将其与 `example.json` (默认值) 进行 `deepMerge`。
3. 这样可以确保即使只传了一个子字段，其他默认配置依然能够完美保留。

```typescript
const calculateMetadata = async ({ props }) => {
  const inputProps = getInputProps();
  // 手动深度合并，保护嵌套的默认值
  const mergedConfig = deepMerge(exampleData, inputProps);
  const config = KnowConfigSchema.parse(mergedConfig);
  
  return {
    props: config, // 将合并后的完整对象传给组件
    // ...
  };
};
```

---
*总结：在 Remotion 的世界里，绝对的确定性 (Deterministic Rendering) 高于一切。所有的 UI 尺寸都应该闭环在 `useScale` 钩子中，所有的参数合并都应该显式地在 `calculateMetadata` 中完成。*

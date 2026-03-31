import { useVideoConfig } from "remotion";

/**
 * 设计系统缩放勾子 (useScale)
 * 
 * 基准设计稿高度: 1920px (对应 1080p 竖排标准)
 * 逻辑: s(v) = (v / 1920) * height * multiplier
 * 
 * @multiplier: 如果是竖屏，自动缩小 50% 以防内容过于拥挤 
 */
export const useScale = () => {
	const { height, width } = useVideoConfig();
	const BASE = 1920;
	const isPortrait = height > width;
	const isLandscape = !isPortrait;

	// 竖屏模式下，所有比例结果自动缩小 50%
	const multiplier = isPortrait ? 0.5 : 1;

	/**
	 * 比例缩放函数 s (Scale)
	 * @param v 设计稿中的原始像素值
	 */
	const s = (v: number) => {
		return (v / BASE) * height * multiplier;
	};

	/**
	 * 基于视频宽度的绝对比例 (替代有渲染兼容性问题的 vw)
	 * @param percentage 0-100 的数值
	 */
	const vw = (percentage: number) => (width * percentage) / 100;

	/**
	 * 基于视频高度的绝对比例 (替代有渲染兼容性问题的 vh)
	 * @param percentage 0-100 的数值
	 */
	const vh = (percentage: number) => (height * percentage) / 100;

	const vv = (percentage: number) => isLandscape ? vw(percentage) : vh(percentage);

	return {
		s,
		vw,
		vh,
		vv,
		isLandscape,
		isPortrait,
		width,
		height
	};
};

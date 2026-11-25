/**
 * Pure whole-page scroll progress, contribution-square block ramp, and scrubbing calculations.
 */

export function clamp01(value) {
	if (!Number.isFinite(value)) return 0;
	if (value <= 0) return 0;
	if (value >= 1) return 1;
	return value;
}

/**
 * Computes normalized whole-page scroll progress [0..1] and integer percent [0..100].
 * Safely clamps Safari/trackpad rubber-band overscroll and non-scrollable documents.
 *
 * @param {number} scrollY
 * @param {number} scrollHeight
 * @param {number} viewportHeight
 * @returns {{ progress: number, percent: number, scrollable: boolean, maxScroll: number }}
 */
export function computePageScrollProgress(scrollY, scrollHeight, viewportHeight) {
	var sh = Number(scrollHeight);
	var vh = Number(viewportHeight);
	var y = Number(scrollY);

	if (!Number.isFinite(sh) || !Number.isFinite(vh) || sh <= 0 || vh <= 0) {
		return { progress: 0, percent: 0, scrollable: false, maxScroll: 0 };
	}

	var maxScroll = Math.max(0, sh - vh);
	if (maxScroll <= 1) {
		return { progress: 0, percent: 0, scrollable: false, maxScroll: 0 };
	}

	var progress = clamp01((Number.isFinite(y) ? y : 0) / maxScroll);
	return {
		progress: progress,
		percent: Math.round(progress * 100),
		scrollable: true,
		maxScroll: maxScroll,
	};
}

/**
 * Converts a pointer ratio [0..1] along the scrollbar column into a target scrollY.
 *
 * @param {number} ratio
 * @param {number} scrollHeight
 * @param {number} viewportHeight
 * @returns {number}
 */
export function computeScrollTargetFromRatio(ratio, scrollHeight, viewportHeight) {
	var sh = Number(scrollHeight);
	var vh = Number(viewportHeight);
	if (!Number.isFinite(sh) || !Number.isFinite(vh) || sh <= vh) {
		return 0;
	}
	var maxScroll = sh - vh;
	return Math.round(clamp01(ratio) * maxScroll);
}

/**
 * Computes visibility and contribution-graph colour level (0..4) for each square
 * in the vertical scroll stack.
 *
 * - As progress rises from 0 -> 1, active squares grow from 1 -> totalBlocks.
 * - The leading (bottom-most active) square uses level 4 (brightest).
 * - Squares above the leading square fade smoothly across all 5 contribution-graph
 *   shades (levels 0 -> 1 -> 2 -> 3 -> 4).
 *
 * @param {number} progress
 * @param {number} [totalBlocks=18]
 * @returns {Array<{ index: number, visible: boolean, level: number }>}
 */
export function computeScrollBlocks(progress, totalBlocks) {
	var count = Math.max(1, Math.floor(Number(totalBlocks) || 18));
	var p = clamp01(progress);
	var headIndex = count === 1 ? 0 : Math.round(p * (count - 1));

	var blocks = [];
	for (var i = 0; i < count; i++) {
		if (i > headIndex) {
			blocks.push({ index: i, visible: false, level: 0 });
			continue;
		}

		var level;
		if (i === headIndex) {
			level = 4;
		} else if (headIndex < 4) {
			level = Math.max(0, 4 - (headIndex - i));
		} else {
			level = Math.min(3, Math.floor((i / headIndex) * 4));
		}

		blocks.push({ index: i, visible: true, level: level });
	}

	return blocks;
}

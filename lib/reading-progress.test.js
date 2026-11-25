import test from "node:test";
import assert from "node:assert/strict";
import {
	clamp01,
	computePageScrollProgress,
	computeScrollTargetFromRatio,
	computeScrollBlocks,
} from "./reading-progress.js";

test("clamp01 bounds values safely", () => {
	assert.equal(clamp01(-0.5), 0);
	assert.equal(clamp01(0), 0);
	assert.equal(clamp01(0.42), 0.42);
	assert.equal(clamp01(1), 1);
	assert.equal(clamp01(2.3), 1);
	assert.equal(clamp01(Number.NaN), 0);
	assert.equal(clamp01(Number.POSITIVE_INFINITY), 0);
});

test("computePageScrollProgress maps top, mid, and bottom of the whole page accurately", () => {
	const top = computePageScrollProgress(0, 3900, 900);
	assert.deepEqual(top, { progress: 0, percent: 0, scrollable: true, maxScroll: 3000 });

	const mid = computePageScrollProgress(1500, 3900, 900);
	assert.deepEqual(mid, { progress: 0.5, percent: 50, scrollable: true, maxScroll: 3000 });

	const bottom = computePageScrollProgress(3000, 3900, 900);
	assert.deepEqual(bottom, { progress: 1, percent: 100, scrollable: true, maxScroll: 3000 });
});

test("computePageScrollProgress clamps rubber-band overscroll and handles non-scrollable pages", () => {
	const negative = computePageScrollProgress(-80, 2900, 900);
	assert.equal(negative.progress, 0);
	assert.equal(negative.percent, 0);

	const pastEnd = computePageScrollProgress(2500, 2900, 900);
	assert.equal(pastEnd.progress, 1);
	assert.equal(pastEnd.percent, 100);

	const shortPage = computePageScrollProgress(0, 800, 900);
	assert.deepEqual(shortPage, { progress: 0, percent: 0, scrollable: false, maxScroll: 0 });

	const invalid = computePageScrollProgress(100, 0, 0);
	assert.deepEqual(invalid, { progress: 0, percent: 0, scrollable: false, maxScroll: 0 });
});

test("computeScrollTargetFromRatio maps pointer ratios cleanly to scroll offsets", () => {
	assert.equal(computeScrollTargetFromRatio(0, 3900, 900), 0);
	assert.equal(computeScrollTargetFromRatio(0.5, 3900, 900), 1500);
	assert.equal(computeScrollTargetFromRatio(1, 3900, 900), 3000);
	assert.equal(computeScrollTargetFromRatio(-0.2, 3900, 900), 0);
	assert.equal(computeScrollTargetFromRatio(1.4, 3900, 900), 3000);
	assert.equal(computeScrollTargetFromRatio(0.5, 800, 900), 0);
});

test("computeScrollBlocks grows visible squares and fades above squares across levels 0..4", () => {
	// At top (0%): only block 0 is visible at level 4
	const top = computeScrollBlocks(0, 18);
	assert.equal(top.length, 18);
	assert.equal(top.filter((b) => b.visible).length, 1);
	assert.equal(top[0].level, 4);
	assert.equal(top[1].visible, false);

	// At 5 active blocks (headIndex = 4): exact 5-step ramp [0, 1, 2, 3, 4]
	const five = computeScrollBlocks(4 / 17, 18);
	const fiveLevels = five.filter((b) => b.visible).map((b) => b.level);
	assert.deepEqual(fiveLevels, [0, 1, 2, 3, 4]);

	// At bottom (100%): all 18 blocks visible, monotonically non-decreasing 0..4, last is 4
	const bottom = computeScrollBlocks(1, 18);
	assert.equal(bottom.filter((b) => b.visible).length, 18);
	assert.equal(bottom[0].level, 0);
	assert.equal(bottom[17].level, 4);
	for (let i = 1; i < bottom.length; i++) {
		assert.ok(bottom[i].level >= bottom[i - 1].level);
	}
	// All 5 contribution graph levels are represented
	assert.deepEqual(
		Array.from(new Set(bottom.map((b) => b.level))).sort((a, b) => a - b),
		[0, 1, 2, 3, 4]
	);
});

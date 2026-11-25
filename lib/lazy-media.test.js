import test from "node:test";
import assert from "node:assert/strict";
import { parseMediaSources, shouldLoadMedia, planFallbackShots } from "./lazy-media.js";

test("parseMediaSources extracts live, override, and whitespace-separated shot URLs cleanly", () => {
	assert.deepEqual(
		parseMediaSources({
			override: " https://example.com/preview.png ",
			shots: "  https://example.com/a.png\n  https://example.com/b.png  ",
		}),
		{
			liveUrl: null,
			overrideUrl: "https://example.com/preview.png",
			shotUrls: ["https://example.com/a.png", "https://example.com/b.png"],
		}
	);

	assert.deepEqual(parseMediaSources({ live: "https://site.app" }), {
		liveUrl: "https://site.app",
		overrideUrl: null,
		shotUrls: [],
	});

	assert.deepEqual(parseMediaSources(null), {
		liveUrl: null,
		overrideUrl: null,
		shotUrls: [],
	});
});

test("shouldLoadMedia defers offscreen open projects and closed onscreen projects/notes", () => {
	// Open project below the fold on initial page load -> MUST NOT load yet
	assert.equal(
		shouldLoadMedia({ loaded: false, inViewport: false, hasDetails: true, detailsOpen: true }),
		false
	);

	// Closed project or note scrolled into view -> MUST NOT load yet
	assert.equal(
		shouldLoadMedia({ loaded: false, inViewport: true, hasDetails: true, detailsOpen: false }),
		false
	);

	// Open project or note scrolled into viewport -> SHOULD load
	assert.equal(
		shouldLoadMedia({ loaded: false, inViewport: true, hasDetails: true, detailsOpen: true }),
		true
	);

	// Standalone image/preview outside <details> when in viewport -> SHOULD load
	assert.equal(
		shouldLoadMedia({ loaded: false, inViewport: true, hasDetails: false, detailsOpen: false }),
		true
	);

	// Forced load (beforeprint) -> SHOULD load if not already loaded
	assert.equal(
		shouldLoadMedia({ loaded: false, inViewport: false, hasDetails: true, detailsOpen: false, force: true }),
		true
	);

	// Already loaded -> never triggers again
	assert.equal(
		shouldLoadMedia({ loaded: true, inViewport: true, hasDetails: true, detailsOpen: true, force: true }),
		false
	);
});

test("planFallbackShots skips fallback requests when override succeeds and defers extra slides", () => {
	const shots = ["https://a/1.png", "https://a/2.png", "https://a/3.png"];

	// Override image succeeded -> zero fallback shot requests
	assert.deepEqual(planFallbackShots(true, shots), {
		shouldFetchShots: false,
		initialShotUrl: null,
		deferredShotUrls: [],
	});

	// Override missing/failed -> load first immediately, defer remaining sequentially
	assert.deepEqual(planFallbackShots(false, shots), {
		shouldFetchShots: true,
		initialShotUrl: "https://a/1.png",
		deferredShotUrls: ["https://a/2.png", "https://a/3.png"],
	});

	// Empty shots list
	assert.deepEqual(planFallbackShots(false, []), {
		shouldFetchShots: false,
		initialShotUrl: null,
		deferredShotUrls: [],
	});
});

/**
 * Pure gating and fallback planning helpers for lazy-loading project & note previews/screenshots.
 */

/**
 * Parses preview media source attributes from a DOM element's dataset.
 *
 * @param {{ live?: string, override?: string, shots?: string } | null | undefined} dataset
 * @returns {{ liveUrl: string | null, overrideUrl: string | null, shotUrls: string[] }}
 */
export function parseMediaSources(dataset) {
	var ds = dataset || {};
	var liveUrl = typeof ds.live === "string" && ds.live.trim() ? ds.live.trim() : null;
	var overrideUrl = typeof ds.override === "string" && ds.override.trim() ? ds.override.trim() : null;
	var shotUrls =
		typeof ds.shots === "string"
			? ds.shots
					.split(/\s+/)
					.map(function (u) {
						return u.trim();
					})
					.filter(Boolean)
			: [];

	return {
		liveUrl: liveUrl,
		overrideUrl: overrideUrl,
		shotUrls: shotUrls,
	};
}

/**
 * Determines whether a lazy media container (preview or deferred image in Projects/Notes)
 * should start fetching its network resources right now.
 *
 * - Never re-triggers if already loaded.
 * - Allows forced loading (e.g. beforeprint).
 * - Requires both viewport proximity AND open disclosure state when inside <details>.
 *
 * @param {{
 *   loaded: boolean,
 *   inViewport: boolean,
 *   hasDetails: boolean,
 *   detailsOpen: boolean,
 *   force?: boolean
 * }} state
 * @returns {boolean}
 */
export function shouldLoadMedia(state) {
	if (!state || state.loaded) return false;
	if (state.force) return true;
	if (!state.inViewport) return false;
	if (state.hasDetails && !state.detailsOpen) return false;
	return true;
}

/**
 * Plans whether and how to load fallback slideshow screenshots (`data-shots`)
 * after checking the primary `data-override` image.
 *
 * - If `data-override` loaded, zero fallback shots are requested.
 * - Otherwise, the first screenshot loads immediately and the rest defer sequentially.
 *
 * @param {boolean} overrideSucceeded
 * @param {string[]} shotUrls
 * @returns {{ shouldFetchShots: boolean, initialShotUrl: string | null, deferredShotUrls: string[] }}
 */
export function planFallbackShots(overrideSucceeded, shotUrls) {
	var list = Array.isArray(shotUrls) ? shotUrls.filter(Boolean) : [];
	if (overrideSucceeded || list.length === 0) {
		return {
			shouldFetchShots: false,
			initialShotUrl: null,
			deferredShotUrls: [],
		};
	}

	return {
		shouldFetchShots: true,
		initialShotUrl: list[0],
		deferredShotUrls: list.slice(1),
	};
}

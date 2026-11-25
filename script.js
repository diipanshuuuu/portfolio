/* Progressive enhancement only: the page works fully without this file. */
(function () {
	var root = document.documentElement;
	root.classList.add("js");

	var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
	var EMAIL = "diipanshuuuu@gmail.com";

	// Replaced by the sparks section below when motion is allowed
	var celebrate = function () {};
	var triggerMatrixRain = function () {};

	/* ---------- Theme toggle: the new theme grows out of the button ---------- */
	var toggle = document.querySelector(".theme-toggle");
	var themeColor = document.querySelector('meta[name="theme-color"]');

	function applyTheme(theme) {
		root.dataset.theme = theme;
		if (themeColor) themeColor.content = theme === "light" ? "#fdf6e3" : "#08090a";
	}

	applyTheme(root.dataset.theme || "dark");

	function toggleTheme() {
		var next = root.dataset.theme === "light" ? "dark" : "light";
		try {
			localStorage.setItem("theme", next);
		} catch (e) {}

		if (!document.startViewTransition || reduceMotion) {
			applyTheme(next);
			return next;
		}

		var rect = toggle.getBoundingClientRect();
		var x = rect.left + rect.width / 2;
		var y = rect.top + rect.height / 2;
		var radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

		document
			.startViewTransition(function () {
				applyTheme(next);
			})
			.ready.then(function () {
				root.animate(
					{
						clipPath: [
							"circle(0px at " + x + "px " + y + "px)",
							"circle(" + radius + "px at " + x + "px " + y + "px)"
						]
					},
					{ duration: 500, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" }
				);
			}, function () {});

		return next;
	}

	toggle.addEventListener("click", function () {
		toggleTheme();
	});

	/* ---------- Copy email ---------- */
	var copyBtn = document.querySelector(".copy-email");
	var copyStatus = document.querySelector("[data-copy-status]");
	var copyTimer;

	function markCopied() {
		copyBtn.classList.add("is-copied");
		copyStatus.textContent = "Email copied to clipboard";
		clearTimeout(copyTimer);
		copyTimer = setTimeout(function () {
			copyBtn.classList.remove("is-copied");
			copyStatus.textContent = "";
		}, 2000);
	}

	function fallbackCopy(text) {
		var ta = document.createElement("textarea");
		ta.value = text;
		ta.setAttribute("readonly", "");
		ta.style.position = "fixed";
		ta.style.opacity = "0";
		document.body.appendChild(ta);
		ta.select();
		var ok = false;
		try {
			ok = document.execCommand("copy");
		} catch (e) {}
		document.body.removeChild(ta);
		return ok;
	}

	copyBtn.addEventListener("click", function () {
		if (!navigator.clipboard) {
			if (fallbackCopy(EMAIL)) markCopied();
			else window.location.href = "mailto:" + EMAIL;
			return;
		}
		navigator.clipboard.writeText(EMAIL).then(
			markCopied,
			function () {
				if (fallbackCopy(EMAIL)) markCopied();
				else toast(EMAIL + " · copy blocked by browser");
			}
		);
	});

	/* ---------- Toast ---------- */
	var toastEl = document.querySelector(".toast");
	var toastTimer;

	function toast(message) {
		if (!toastEl) return;
		toastEl.textContent = message;
		toastEl.classList.add("is-on");
		clearTimeout(toastTimer);
		toastTimer = setTimeout(function () {
			toastEl.classList.remove("is-on");
		}, 2200);
	}

	/* ---------- Accent colors (Konami code, or `accent` in the shell) ---------- */
	var ACCENTS = ["mono", "orange", "blue", "pink"];

	function currentAccent() {
		return ACCENTS.indexOf(root.dataset.accent) > 0 ? root.dataset.accent : "mono";
	}

	function setAccent(name) {
		if (ACCENTS.indexOf(name) === -1) return false;
		if (name === "mono") delete root.dataset.accent;
		else root.dataset.accent = name;
		try {
			localStorage.setItem("accent", name);
		} catch (e) {}
		return true;
	}

	var KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
	var konamiAt = 0;

	window.addEventListener("keydown", function (e) {
		var key = (e.key || "").toLowerCase();
		konamiAt = key === KONAMI[konamiAt] ? konamiAt + 1 : key === KONAMI[0] ? 1 : 0;
		if (konamiAt < KONAMI.length) return;
		konamiAt = 0;
		var next = ACCENTS[(ACCENTS.indexOf(currentAccent()) + 1) % ACCENTS.length];
		setAccent(next);
		toast("new territory unlocked · accent → " + next);
		celebrate(innerWidth / 2, innerHeight / 2);
	});

	/* ---------- Local time in Ayodhya ---------- */
	var clockEl = document.querySelector("[data-clock]");

	if (clockEl && window.Intl) {
		var clockFormat = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false });
		var tickClock = function () {
			clockEl.textContent = clockFormat.format(new Date()) + " ist";
		};
		tickClock();
		setInterval(tickClock, 15000);
	}

	/* ---------- GitHub contribution graph (above "where i am") ---------- */
	var contribData = null; // shared with the shell's `stats` command
	var contribGrid = document.querySelector("[data-contrib-grid]");
	var contribTotal = document.querySelector("[data-contrib-total]");
	var contribScroll = document.querySelector("[data-contrib-scroll]");
	var contribFrame = document.querySelector("[data-contrib-frame]");
	var contribTooltip = document.querySelector("[data-contrib-tooltip]");

	if (contribGrid && contribTotal) {
		var CONTRIB_WEEKS = 38;
		var CONTRIB_ACCOUNTS = ["diipanshuuuu", "htmnsrc"];
		var CONTRIB_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		var pinnedCell = null;

		// Render skeleton cells immediately so layout height never shifts
		(function renderSkeleton() {
			var frag = document.createDocumentFragment();
			for (var i = 0; i < CONTRIB_WEEKS * 7; i++) {
				var cell = document.createElement("span");
				cell.className = "contrib-cell is-skeleton";
				cell.setAttribute("data-level", "0");
				cell.setAttribute("aria-hidden", "true");
				frag.appendChild(cell);
			}
			contribGrid.appendChild(frag);
		})();

		function formatContribLabel(day) {
			var parts = day.date.split("-");
			var y = Number(parts[0]);
			var m = Number(parts[1]);
			var d = Number(parts[2]);
			var month = CONTRIB_MONTHS[m - 1] || "";
			var count = Number(day.count) || 0;
			var prefix = count === 0 ? "No contributions" : count === 1 ? "1 contribution" : count + " contributions";
			return prefix + " on " + month + " " + d + ", " + y;
		}

		function showContribTooltip(target, text) {
			if (!contribTooltip || !contribFrame) return;
			contribTooltip.textContent = text;
			contribTooltip.hidden = false;
			var frameRect = contribFrame.getBoundingClientRect();
			var cellRect = target.getBoundingClientRect();
			var center = cellRect.left - frameRect.left + cellRect.width / 2;
			var half = contribTooltip.offsetWidth / 2;
			var clamped = Math.max(half + 4, Math.min(frameRect.width - half - 4, center));
			contribTooltip.style.left = clamped + "px";
		}

		function clearPinnedCell() {
			if (pinnedCell) {
				pinnedCell.classList.remove("is-pinned");
				pinnedCell = null;
			}
		}

		function hideContribTooltip(force) {
			if (!force && pinnedCell) return;
			if (force) clearPinnedCell();
			if (contribTooltip) contribTooltip.hidden = true;
		}

		function snapContribRight() {
			if (contribScroll && contribScroll.scrollWidth > contribScroll.clientWidth) {
				contribScroll.scrollLeft = contribScroll.scrollWidth;
			}
		}

		if (contribScroll && "ResizeObserver" in window) {
			var lastScrollWidth = 0;
			new ResizeObserver(function () {
				var w = contribScroll.clientWidth;
				if (w && w !== lastScrollWidth) {
					lastScrollWidth = w;
					snapContribRight();
				}
			}).observe(contribScroll);
		}

		document.addEventListener("click", function (e) {
			if (!pinnedCell) return;
			if (contribFrame && contribFrame.contains(e.target)) return;
			hideContribTooltip(true);
		});

		function groupIntoWeeks(contributions, maxWeeks) {
			var weeks = [];
			var week = [null, null, null, null, null, null, null];
			contributions.forEach(function (day) {
				if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day.date)) return;
				var p = day.date.split("-").map(Number);
				var dow = new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay();
				if (dow === 0 && week.some(Boolean)) {
					weeks.push(week);
					week = [null, null, null, null, null, null, null];
				}
				week[dow] = day;
			});
			if (week.some(Boolean)) weeks.push(week);
			return weeks.length > maxWeeks ? weeks.slice(weeks.length - maxWeeks) : weeks;
		}

		function computeContribStatsClient(contributions) {
			var activeDays = 0;
			var longestStreak = 0;
			var runningStreak = 0;
			var busiestDay = null;
			contributions.forEach(function (day) {
				var c = Number(day.count) || 0;
				if (c > 0) {
					activeDays += 1;
					runningStreak += 1;
					if (runningStreak > longestStreak) longestStreak = runningStreak;
					if (!busiestDay || c > busiestDay.count) busiestDay = { date: day.date, count: c };
				} else {
					runningStreak = 0;
				}
			});
			var currentStreak = 0;
			for (var i = contributions.length - 1; i >= 0; i--) {
				var count = Number(contributions[i].count) || 0;
				if (count > 0) currentStreak += 1;
				else if (i === contributions.length - 1) continue;
				else break;
			}
			return { activeDays: activeDays, longestStreak: longestStreak, currentStreak: currentStreak, busiestDay: busiestDay };
		}

		function mergePayloadsClient(entries) {
			var map = Object.create(null);
			var byAccount = Object.create(null);
			entries.forEach(function (entry) {
				var payload = entry.payload;
				var user = entry.user;
				var list = payload && Array.isArray(payload.contributions) ? payload.contributions : [];
				var acctTotal = 0;
				list.forEach(function (item) {
					if (!item || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) return;
					var c = Math.max(0, Math.floor(Number(item.count) || 0));
					map[item.date] = (map[item.date] || 0) + c;
					acctTotal += c;
				});
				if (user) byAccount[user] = acctTotal;
			});
			var dates = Object.keys(map).sort();
			var total = 0;
			var maxCount = 0;
			dates.forEach(function (date) {
				var c = map[date];
				total += c;
				if (c > maxCount) maxCount = c;
			});
			var contributions = dates.map(function (date) {
				var c = map[date];
				var lvl = c <= 0 ? 0 : maxCount <= 1 ? 4 : c / maxCount <= 0.25 ? 1 : c / maxCount <= 0.5 ? 2 : c / maxCount <= 0.75 ? 3 : 4;
				return { date: date, count: c, level: lvl };
			});
			return {
				total: total,
				byAccount: byAccount,
				stats: computeContribStatsClient(contributions),
				contributions: contributions
			};
		}

		function buildBreakdownSummary(data) {
			var bits = [];
			if (data && data.byAccount) {
				Object.keys(data.byAccount).forEach(function (user) {
					bits.push(data.byAccount[user] + " on @" + user);
				});
			}
			if (data && data.stats) {
				if (data.stats.activeDays) bits.push(data.stats.activeDays + " active days");
				if (data.stats.longestStreak) bits.push("streak " + data.stats.longestStreak + "d");
				if (data.stats.busiestDay) bits.push("best " + data.stats.busiestDay.count + "/day");
			}
			return bits.join(" · ");
		}

		function renderContributions(data) {
			contribData = data;
			var weeks = groupIntoWeeks(data.contributions || [], CONTRIB_WEEKS);
			if (!weeks.length) {
				contribTotal.textContent = "view contributions on github ↗";
				return;
			}
			var frag = document.createDocumentFragment();
			weeks.forEach(function (week) {
				for (var row = 0; row < 7; row++) {
					var day = week[row];
					if (!day) {
						var spacer = document.createElement("span");
						spacer.className = "contrib-cell is-empty";
						spacer.setAttribute("aria-hidden", "true");
						frag.appendChild(spacer);
						continue;
					}
					var cell = document.createElement("button");
					var label = formatContribLabel(day);
					cell.type = "button";
					cell.className = "contrib-cell";
					cell.setAttribute("data-level", String(day.level || 0));
					cell.setAttribute("data-date", day.date);
					cell.setAttribute("data-count", String(day.count || 0));
					cell.setAttribute("aria-label", label);
					cell.title = label;
					(function (el, text) {
						el.addEventListener("pointerenter", function (e) {
							if (e.pointerType === "touch") return;
							showContribTooltip(el, text);
						});
						el.addEventListener("focus", function () {
							showContribTooltip(el, text);
						});
						el.addEventListener("blur", function () {
							hideContribTooltip(false);
						});
						el.addEventListener("click", function (e) {
							e.stopPropagation();
							if (pinnedCell === el) {
								hideContribTooltip(true);
								return;
							}
							clearPinnedCell();
							pinnedCell = el;
							el.classList.add("is-pinned");
							showContribTooltip(el, text);
						});
					})(cell, label);
					frag.appendChild(cell);
				}
			});

			contribGrid.textContent = "";
			contribGrid.appendChild(frag);
			contribGrid.addEventListener("pointerleave", function () {
				hideContribTooltip(false);
			});

			var totalNum = Number(data.total) || 0;
			contribTotal.textContent = totalNum.toLocaleString("en-US") + " contribution" + (totalNum === 1 ? "" : "s") + " in the last year";

			var summary = buildBreakdownSummary(data);
			if (summary) {
				contribTotal.title = summary;
				contribTotal.addEventListener("pointerenter", function (e) {
					if (e.pointerType === "touch") return;
					showContribTooltip(contribTotal, summary);
				});
				contribTotal.addEventListener("focus", function () {
					showContribTooltip(contribTotal, summary);
				});
				contribTotal.addEventListener("pointerleave", function () {
					hideContribTooltip(false);
				});
				contribTotal.addEventListener("blur", function () {
					hideContribTooltip(false);
				});
			}

			snapContribRight();
		}

		function loadDirectFromPublicApi() {
			return Promise.all(
				CONTRIB_ACCOUNTS.map(function (user) {
					return fetch("https://github-contributions-api.jogruber.de/v4/" + encodeURIComponent(user) + "?y=last")
						.then(function (r) {
							return r.ok ? r.json() : null;
						})
						.then(function (payload) {
							return payload ? { user: user, payload: payload } : null;
						})
						.catch(function () {
							return null;
						});
				})
			).then(function (results) {
				var valid = results.filter(Boolean);
				if (!valid.length) throw new Error("No contribution data");
				return mergePayloadsClient(valid);
			});
		}

		fetch("/api/github-contributions")
			.then(function (r) {
				if (!r.ok) throw new Error("API unavailable");
				return r.json();
			})
			.catch(loadDirectFromPublicApi)
			.then(renderContributions)
			.catch(function () {
				contribTotal.textContent = "view contributions on github ↗";
				contribGrid.querySelectorAll(".is-skeleton").forEach(function (el) {
					el.classList.remove("is-skeleton");
				});
			});
	}

	/* ---------- Live GitHub repo stars & commit freshness ---------- */
	var repoMetaEls = Array.prototype.slice.call(document.querySelectorAll("[data-repo-meta]"));
	if (repoMetaEls.length) {
		function formatRelativePush(iso) {
			if (!iso) return "";
			var ms = Date.now() - Date.parse(iso);
			if (!Number.isFinite(ms) || ms < 0) return "today";
			var days = Math.floor(ms / 86400000);
			if (days <= 0) return "today";
			if (days === 1) return "1d ago";
			if (days < 14) return days + "d ago";
			if (days < 60) return Math.floor(days / 7) + "w ago";
			if (days < 365) return Math.floor(days / 30) + "mo ago";
			return Math.floor(days / 365) + "y ago";
		}

		function paintRepoMeta(repos) {
			if (!repos || typeof repos !== "object") return;
			repoMetaEls.forEach(function (el) {
				var slug = el.getAttribute("data-repo-meta");
				var info = repos[slug];
				if (!info) return;
				var parts = [];
				if (typeof info.stars === "number" && info.stars > 0) parts.push("★ " + info.stars);
				var rel = formatRelativePush(info.pushedAt);
				if (rel) parts.push("updated " + rel);
				if (!parts.length) return;
				el.textContent = parts.join(" · ");
				el.hidden = false;
			});
		}

		function loadReposDirectly() {
			var slugs = repoMetaEls.map(function (el) {
				return el.getAttribute("data-repo-meta");
			}).filter(Boolean);
			return Promise.all(
				slugs.map(function (slug) {
					return fetch("https://api.github.com/repos/" + slug, { headers: { Accept: "application/vnd.github+json" } })
						.then(function (r) {
							return r.ok ? r.json() : null;
						})
						.then(function (d) {
							return d ? [slug, { stars: Number(d.stargazers_count) || 0, pushedAt: d.pushed_at || null }] : null;
						})
						.catch(function () {
							return null;
						});
				})
			).then(function (pairs) {
				var out = Object.create(null);
				pairs.forEach(function (p) {
					if (p) out[p[0]] = p[1];
				});
				return { repos: out };
			});
		}

		fetch("/api/github-repos")
			.then(function (r) {
				if (!r.ok) throw new Error("API unavailable");
				return r.json();
			})
			.catch(loadReposDirectly)
			.then(function (json) {
				if (json && json.repos) paintRepoMeta(json.repos);
			})
			.catch(function () {});
	}

	/* ---------- Interactive Kavach on-device PII redaction sandbox ---------- */
	var kavachLab = document.querySelector("[data-kavach-lab]");
	if (kavachLab) {
		var kavachInput = kavachLab.querySelector("[data-kavach-input]");
		var kavachOutput = kavachLab.querySelector("[data-kavach-output]");
		var kavachStatus = kavachLab.querySelector("[data-kavach-status]");
		var kavachSamples = Array.prototype.slice.call(kavachLab.querySelectorAll("[data-kavach-sample]"));

		var KAVACH_SAMPLES = {
			kyc: "Share Rahul's Aadhaar 2345 6789 0123 and PAN ABCDE1234F to rahul@okicici",
			bank: "Wire Rs 45,000 to IFSC SBIN0001234, confirm on +91 9876543210 or finance@acme.in",
			invoice: "Client PAN BXZPK9012M · UPI priya.dev@oksbi · call 9123456789 before dispatch"
		};

		var KAVACH_RULES = [
			{ type: "AADHAAR", regex: /\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b/g },
			{ type: "PAN", regex: /\b[A-Z]{5}\d{4}[A-Z]\b/g },
			{ type: "IFSC", regex: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g },
			{ type: "UPI", regex: /\b[a-zA-Z0-9._-]{2,}@(?:okaxis|okhdfcbank|okicici|oksbi|upi|ybl|paytm|ibl|axl)\b/gi },
			{ type: "EMAIL", regex: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g },
			{ type: "PHONE", regex: /(?:\+91[\s-]?)?\b[6-9]\d{9}\b/g }
		];

		function redactIndianPIIClient(text) {
			if (!text) return { segments: [], entities: [] };
			var candidates = [];
			KAVACH_RULES.forEach(function (rule) {
				rule.regex.lastIndex = 0;
				var m;
				while ((m = rule.regex.exec(text)) !== null) {
					candidates.push({ type: rule.type, start: m.index, end: m.index + m[0].length, raw: m[0] });
				}
			});
			candidates.sort(function (a, b) {
				return a.start - b.start || b.end - a.end;
			});
			var accepted = [];
			var cursor = 0;
			candidates.forEach(function (c) {
				if (c.start < cursor) return;
				accepted.push(c);
				cursor = c.end;
			});
			var counts = Object.create(null);
			var segments = [];
			var entities = [];
			var pos = 0;
			accepted.forEach(function (item) {
				if (item.start > pos) segments.push({ kind: "text", value: text.slice(pos, item.start) });
				counts[item.type] = (counts[item.type] || 0) + 1;
				var token = "[" + item.type + "_" + counts[item.type] + "]";
				entities.push({ type: item.type, token: token });
				segments.push({ kind: "mask", value: token, type: item.type });
				pos = item.end;
			});
			if (pos < text.length) segments.push({ kind: "text", value: text.slice(pos) });
			return { segments: segments, entities: entities };
		}

		function renderKavachLab() {
			if (!kavachInput || !kavachOutput || !kavachStatus) return;
			var val = kavachInput.value;
			var result = redactIndianPIIClient(val);
			kavachOutput.textContent = "";
			if (!val.trim()) {
				kavachOutput.textContent = "masked prompt preview appears here…";
				kavachStatus.textContent = "stays 100% in your browser";
				kavachStatus.classList.remove("is-masked");
				return;
			}
			result.segments.forEach(function (seg) {
				if (seg.kind === "mask") {
					var span = document.createElement("span");
					span.className = "kavach-mask";
					span.textContent = seg.value;
					kavachOutput.appendChild(span);
				} else {
					kavachOutput.appendChild(document.createTextNode(seg.value));
				}
			});
			if (result.entities.length) {
				var seen = [];
				result.entities.forEach(function (e) {
					if (seen.indexOf(e.type) === -1) seen.push(e.type);
				});
				kavachStatus.textContent =
					"✓ " +
					result.entities.length +
					" " +
					(result.entities.length === 1 ? "entity" : "entities") +
					" masked on-device (" +
					seen.join(", ") +
					")";
				kavachStatus.classList.add("is-masked");
			} else {
				kavachStatus.textContent = "no Indian PII detected · safe to send";
				kavachStatus.classList.remove("is-masked");
			}
		}

		if (kavachInput) {
			kavachInput.addEventListener("input", function () {
				kavachSamples.forEach(function (btn) {
					var key = btn.getAttribute("data-kavach-sample");
					btn.classList.toggle("is-active", KAVACH_SAMPLES[key] === kavachInput.value);
				});
				renderKavachLab();
			});
			kavachSamples.forEach(function (btn) {
				btn.addEventListener("click", function () {
					var key = btn.getAttribute("data-kavach-sample");
					if (!KAVACH_SAMPLES[key]) return;
					kavachInput.value = KAVACH_SAMPLES[key];
					kavachSamples.forEach(function (other) {
						other.classList.toggle("is-active", other === btn);
					});
					renderKavachLab();
				});
			});
			renderKavachLab();
		}
	}

	/* ---------- Live signal: Discord presence via Lanyard (api.lanyard.rest) ---------- */
	var DISCORD_ID = "1287480096806011007";
	var presence = null; // latest Lanyard data, also read by the shell's `discord` command
	// One element per placement; <html data-presence="now|clock|dot"> picks which one shows
	var presenceEls = Array.prototype.slice.call(document.querySelectorAll(".presence"));
	var presenceEl = presenceEls[0];

	var STATUS_TEXT = { online: "online", idle: "idle", dnd: "do not disturb", offline: "offline" };
	var ACTIVITY_KIND = { 0: "playing", 1: "streaming", 3: "watching", 5: "competing in" };

	function currentActivity(data) {
		return (data.activities || []).filter(function (a) {
			return a.type !== 2 && a.type !== 4;
		})[0];
	}

	function minutesSince(start) {
		var mins = Math.floor((Date.now() - start) / 60000);
		return mins < 60 ? mins + "m" : Math.floor(mins / 60) + "h " + (mins % 60) + "m";
	}

	if (presenceEl) {
		// Single-line placements rotate through items; the name dot lists them all in its popover
		var presenceLines = presenceEls
			.map(function (el) {
				return el.querySelector(".presence-line");
			})
			.filter(Boolean);
		var presenceLists = presenceEls
			.map(function (el) {
				return el.querySelector(".presence-list");
			})
			.filter(Boolean);
		var presenceItems = [];
		var presenceAt = 0;

		// Each item is [label, highlighted bit, trailing text, isMusic]
		var buildItems = function (data) {
			var items = [];
			var spotify = data.listening_to_spotify && data.spotify;
			var activity = currentActivity(data);
			var custom = (data.activities || []).filter(function (a) {
				return a.type === 4 && a.state;
			})[0];
			if (spotify) items.push(["listening to ", spotify.song, " — " + spotify.artist, true]);
			if (activity) {
				var kind = activity.name === "Visual Studio Code" || activity.name === "Code" ? "coding in " : (ACTIVITY_KIND[activity.type] || "on") + " ";
				var since = activity.timestamps && activity.timestamps.start ? " · " + minutesSince(activity.timestamps.start) : "";
				items.push([kind, activity.name, since, false]);
			}
			if (custom) items.push(["“", custom.state, "”", false]);
			if (!items.length) {
				var status = data.discord_status || "offline";
				items.push(status === "offline" ? ["offline · ", "away from keyboard", "", false] : [STATUS_TEXT[status] + " on ", "discord", "", false]);
			}
			return items;
		};

		var fill = function (line, item) {
			line.textContent = "";
			line.appendChild(document.createTextNode(item[0]));
			var strong = document.createElement("b");
			strong.textContent = item[1];
			line.appendChild(strong);
			line.appendChild(document.createTextNode(item[2]));
		};

		var paint = function (item) {
			presenceLines.forEach(function (line) {
				fill(line, item);
				var eq = line.parentNode.querySelector(".presence-eq");
				if (eq) eq.hidden = !item[3];
			});
		};

		var paintLists = function (data) {
			var status = data.discord_status || "offline";
			presenceLists.forEach(function (list) {
				list.textContent = "";
				var head = document.createElement("li");
				head.className = "presence-list-status";
				head.textContent = STATUS_TEXT[status] + " on discord";
				list.appendChild(head);
				presenceItems.forEach(function (item) {
					if (item[1] === "discord") return; // already said by the status line
					var li = document.createElement("li");
					fill(li, item);
					list.appendChild(li);
				});
			});
		};

		var renderPresence = function (data) {
			if (!data || !data.discord_user) return;
			presence = data;
			var user = data.discord_user;
			var status = data.discord_status || "offline";
			presenceEls.forEach(function (el) {
				el.title = (user.global_name || user.username) + " on discord: " + STATUS_TEXT[status];
				el.dataset.status = status;
			});
			presenceItems = buildItems(data);
			presenceAt = Math.min(presenceAt, presenceItems.length - 1);
			paint(presenceItems[presenceAt]);
			paintLists(data);
			presenceEls.forEach(function (el) {
				var wrapper = el.closest("[hidden]");
				if (wrapper) wrapper.hidden = false;
			});
		};

		// With more than one thing going on, rotate gently between them
		setInterval(function () {
			if (presenceItems.length < 2 || document.hidden) return;
			presenceAt = (presenceAt + 1) % presenceItems.length;
			if (reduceMotion) {
				paint(presenceItems[presenceAt]);
				return;
			}
			presenceLines.forEach(function (line) {
				line.classList.add("is-swapping");
			});
			setTimeout(function () {
				paint(presenceItems[presenceAt]);
				presenceLines.forEach(function (line) {
					line.classList.remove("is-swapping");
				});
			}, 280);
		}, 4500);

		// Keep "47m" fresh
		setInterval(function () {
			if (presence) presenceItems = buildItems(presence);
		}, 30000);

		if ("WebSocket" in window) {
			// Paint straight away from the REST API, then stay live over the socket
			fetch("https://api.lanyard.rest/v1/users/" + DISCORD_ID)
				.then(function (r) {
					return r.json();
				})
				.then(function (json) {
					if (json && json.success) renderPresence(json.data);
				})
				.catch(function () {});

			var socket;
			var heartbeat = 0;
			var retries = 0;

			var connect = function () {
				socket = new WebSocket("wss://api.lanyard.rest/socket");
				socket.addEventListener("message", function (e) {
					var msg;
					try {
						msg = JSON.parse(e.data);
					} catch (err) {
						return;
					}
					if (msg.op === 1) {
						clearInterval(heartbeat);
						heartbeat = setInterval(function () {
							if (socket.readyState === 1) socket.send(JSON.stringify({ op: 3 }));
						}, msg.d.heartbeat_interval);
						socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_ID } }));
					} else if (msg.op === 0 && (msg.t === "INIT_STATE" || msg.t === "PRESENCE_UPDATE")) {
						retries = 0;
						renderPresence(msg.d);
					}
				});
				socket.addEventListener("close", function () {
					clearInterval(heartbeat);
					setTimeout(connect, Math.min(30000, 1000 * Math.pow(2, retries++)));
				});
			};
			connect();
		}
	}

	/* ---------- Hidden shell: press / to open ---------- */
	var shell = document.querySelector(".shell");

	if (shell) {
		var shellWindow = shell.querySelector(".shell-window");
		var shellOut = shell.querySelector(".shell-out");
		var shellForm = shell.querySelector(".shell-form");
		var shellIn = shell.querySelector(".shell-in");
		var shellClose = shell.querySelector(".shell-close");
		var shellHint = document.querySelector(".shell-hint");
		var opener = null;
		var past = [];
		var pastAt = 0;

		var LINKS = {
			"kool-playground": "https://koolplayground.web.app",
			unprompted: "https://unpromted.web.app",
			cortext: "https://unpromted.web.app",
			kavach: "https://github.com/diipanshuuuu/Kavach",
			syscleanx: "https://syscleanx.web.app",
			"nst-sdc": "https://nst-sdc-site-ten.vercel.app",
			github: "https://github.com/diipanshuuuu",
			linkedin: "https://www.linkedin.com/in/diipanshuuuu",
			resume: "resume.pdf",
			discord: "https://discord.com/users/" + DISCORD_ID
		};

		var print = function (text, className) {
			var p = document.createElement("p");
			if (className) p.className = className;
			p.textContent = text;
			shellOut.appendChild(p);
		};

		// Only ever called with the fixed markup below, never with user input
		var printHTML = function (markup) {
			var div = document.createElement("div");
			div.innerHTML = markup;
			shellOut.appendChild(div);
		};

		var scrollShell = function () {
			shellOut.scrollTop = shellOut.scrollHeight;
		};

		var isShellOpen = function () {
			return Boolean(shell.open);
		};

		var openShell = function () {
			if (isShellOpen()) return;
			opener = document.activeElement;
			if (typeof shell.showModal === "function") shell.showModal();
			else shell.setAttribute("open", "");
			document.body.style.overflow = "hidden";
			shellIn.focus();
			scrollShell();
		};

		var closeShell = function () {
			if (!isShellOpen()) return;
			if (typeof shell.close === "function") shell.close();
			else shell.removeAttribute("open");
		};

		shell.addEventListener("close", function () {
			document.body.style.overflow = "";
			if (opener && opener.focus) opener.focus({ preventScroll: true });
		});

		var hireMe = function () {
			var steps = [
				["[sudo] password for guest: ********", ""],
				["checking vibes ................ immaculate", "dim"],
				["permission granted.", "acc"]
			];
			shellIn.disabled = true;
			steps.forEach(function (step, i) {
				setTimeout(function () {
					print(step[0], step[1]);
					scrollShell();
					if (i < steps.length - 1) return;
					var copied = navigator.clipboard ? navigator.clipboard.writeText(EMAIL) : Promise.reject();
					copied.then(
						function () {
							print("→ " + EMAIL + " copied to your clipboard. let's build something together.", "acc");
							scrollShell();
						},
						function () {
							print("→ " + EMAIL + " · say hi", "acc");
							scrollShell();
						}
					);
					var r = shellWindow.getBoundingClientRect();
					celebrate(r.left + r.width / 2, r.top + r.height / 2);
					shellIn.disabled = false;
					shellIn.focus();
				}, 420 * (i + 1));
			});
		};

		// Sections of the page, as places you can travel to from the shell
		var WAYPOINTS = [
			["where", "today-title", "where i am"],
			["edu", "education-title", "education"],
			["kit", "skills-title", "what i carry"],
			["trail", "journey-title", "the trail so far"],
			["built", "projects-title", "built along the way"],
			["notes", "notes-title", "field notes"],
			["horizon", "horizon-title", "on the horizon"],
			["find", "links-title", "find me"]
		];

		var findWaypoint = function (key) {
			return WAYPOINTS.filter(function (w) {
				return w[0] === key;
			})[0];
		};

		var commands = {
			help: function () {
				printHTML(
					"<pre><b>about</b>         who's behind this\n" +
						"<b>projects</b>      built along the way (open &lt;name&gt; to visit)\n" +
						"<b>skills</b>        what i carry\n" +
						"<b>stats</b>         live github contribution stats\n" +
						"<b>where</b>         current position\n" +
						"<b>map</b>           waypoints on this page (goto &lt;place&gt;)\n" +
						"<b>compass</b>       pick a heading\n" +
						"<b>contact</b>       send a signal (copies my email)\n" +
						"<b>discord</b>       live signal from discord\n" +
						"<b>presence</b>      now · clock · dot\n" +
						"<b>neofetch</b>      system info, obviously\n" +
						"<b>theme</b>         day / night\n" +
						"<b>accent</b>        mono · orange · blue · pink\n" +
						"<b>clear</b>         wipe the screen\n" +
						"<b>exit</b>          back to the trail\n" +
						"<b>sudo hire-me</b>  you know you want to</pre>"
				);
			},
			about: function () {
				print("Dipanshu Singh: first-year B.Tech CSE (AI & ML) at Newton School of Technology, based in Ayodhya.");
				print("building open-source tools, web & systems software, and local AI with Ollama & Hugging Face.", "dim");
			},
			whoami: function () {
				print("a fellow builder. could be my next teammate → sudo hire-me", "dim");
			},
			projects: function () {
				print("kool-playground  minimal byok multi-provider llm workbench");
				print("unprompted       8-stage 3d webgl llm explainer + live distilgpt-2 perplexity");
				print("kavach           local privacy shield for ai chats");
				print("syscleanx        fast, safety-first windows cleaner in rust + next.js site");
				print("nst-sdc          vanilla redesign of my college's dev club site");
				print("type: open <name>", "dim");
			},
			skills: function () {
				print("languages  python · typescript · javascript · rust · c · c++ · bash");
				print("web        react · next.js · tailwind css · vite · express · fastapi · three.js · html · css");
				print("ai / ml    ollama · hugging face · tesseract ocr · local llms · model training");
				print("tools      git · github · linux · vim · vs code · egui · firebase · vercel");
			},
			stats: function () {
				if (!contribData) {
					print("github contribution stats aren't loaded yet. try again in a second.", "dim");
					return;
				}
				var total = Number(contribData.total) || 0;
				print(total.toLocaleString("en-US") + " contributions in the last year", "acc");
				if (contribData.byAccount) {
					var split = Object.keys(contribData.byAccount).map(function (u) {
						return "@" + u + " (" + contribData.byAccount[u] + ")";
					});
					if (split.length) print("accounts   " + split.join(" · "));
				}
				if (contribData.stats) {
					var s = contribData.stats;
					print("active     " + (s.activeDays || 0) + " days · longest streak " + (s.longestStreak || 0) + "d · current " + (s.currentStreak || 0) + "d");
					if (s.busiestDay) print("busiest    " + s.busiestDay.count + " contributions on " + s.busiestDay.date, "dim");
				}
			},
			open: function (args) {
				var key = (args[0] || "").toLowerCase();
				if (!LINKS[key]) {
					print("usage: open kool-playground | unprompted | kavach | syscleanx | nst-sdc | github | linkedin | discord | resume", "err");
					return;
				}
				print("opening " + key + " ↗", "acc");
				window.open(LINKS[key], "_blank", "noopener");
			},
			contact: function () {
				if (!navigator.clipboard) {
					print(EMAIL, "acc");
					return;
				}
				navigator.clipboard.writeText(EMAIL).then(
					function () {
						print("copied " + EMAIL + " to your clipboard. say hi.", "acc");
						scrollShell();
					},
					function () {
						print(EMAIL, "acc");
						scrollShell();
					}
				);
			},
			discord: function () {
				if (!presence) {
					print("no signal from discord right now. try: open discord", "dim");
					return;
				}
				var user = presence.discord_user;
				print((user.global_name || user.username) + " (@" + user.username + ") · " + (STATUS_TEXT[presence.discord_status] || "offline"), "acc");
				var activity = currentActivity(presence);
				if (activity) print((ACTIVITY_KIND[activity.type] || "doing") + " " + activity.name + (activity.details ? " · " + activity.details : ""));
				if (presence.listening_to_spotify && presence.spotify) print("listening to " + presence.spotify.song + " by " + presence.spotify.artist);
				if (!activity && !presence.listening_to_spotify) print("nothing running. probably away from keyboard.", "dim");
			},
			github: function () {
				commands.open(["github"]);
			},
			linkedin: function () {
				commands.open(["linkedin"]);
			},
			resume: function () {
				commands.open(["resume"]);
			},
			neofetch: function () {
				printHTML(
					'<div class="neo"><pre class="acc">     _\n  __| |\n / _` |\n| (_| | _\n \\__,_|(_)</pre>' +
						"<pre><b>guest</b>@<b>dipanshu</b>\n---------------\n" +
						"<b>os</b>      compass 26.10 (work in progress)\n" +
						"<b>loc</b>     26.79°n 82.20°e, ayodhya\n" +
						"<b>kernel</b>  b.tech-cse-ai-ml (year 1)\n" +
						"<b>uptime</b>  building since 2025\n" +
						"<b>shell</b>   vanilla html, css & js\n" +
						"<b>status</b>  open to work\n" +
						'<span class="neo-colors"><i style="background:#e5e7eb"></i><i style="background:#a6abb2"></i><i style="background:#6d7279"></i><i style="background:#3b3f45"></i><i style="background:#16181b"></i></span></pre></div>'
				);
			},
			where: function () {
				var time = clockEl ? clockEl.textContent : "";
				print("26.79°n 82.20°e · ayodhya, in" + (time ? " · " + time : ""), "acc");
			},
			map: function () {
				print("waypoints on this page:", "dim");
				WAYPOINTS.forEach(function (w, i) {
					print("  0" + (i + 1) + "  " + (w[2] + "                    ").slice(0, 20) + " goto " + w[0]);
				});
			},
			goto: function (args) {
				var stop = findWaypoint((args[0] || "").toLowerCase());
				if (!stop) {
					print(
						"usage: goto " +
							WAYPOINTS.map(function (w) {
								return w[0];
							}).join(" | "),
						"err"
					);
					return;
				}
				closeShell();
				document.getElementById(stop[1]).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
			},
			compass: function () {
				var headings = ["open source", "local ai", "rust", "the next hackathon", "wherever the next bug is"];
				printHTML("<pre>     n\n     │\n w ──┼── e\n     │\n     s</pre>");
				print("heading: " + headings[(Math.random() * headings.length) | 0], "acc");
			},
			theme: function () {
				var next = toggleTheme();
				print("theme → " + next, "acc");
			},
			presence: function (args) {
				var mode = (args[0] || "").toLowerCase();
				var modes = ["now", "clock", "dot"];
				if (!mode) {
					print("current: " + (root.dataset.presence || "clock") + " · try: presence " + modes.join(" | "), "dim");
					return;
				}
				if (modes.indexOf(mode) === -1) {
					print("unknown presence mode: " + args[0] + " (use now | clock | dot)", "err");
					return;
				}
				root.dataset.presence = mode;
				try {
					localStorage.setItem("presence", mode);
				} catch (e) {}
				print("presence → " + mode, "acc");
			},
			accent: function (args) {
				var name = (args[0] || "").toLowerCase();
				if (!name) {
					print("current: " + currentAccent() + " · try: accent " + ACCENTS.join(" | "), "dim");
					return;
				}
				if (setAccent(name)) print("accent → " + name, "acc");
				else print("unknown accent: " + args[0], "err");
			},
			sudo: function (args) {
				if (args[0] === "hire-me" || args.join(" ") === "hire me") hireMe();
				else if (args[0] === "rm") commands.rm(args.slice(1));
				else print("guest is not in the sudoers file. this incident will be reported.", "err");
			},
			"hire-me": function () {
				print("permission denied. try: sudo hire-me", "err");
			},
			rm: function (args) {
				if (args.join(" ").indexOf("-rf") === -1) {
					print("rm: refusing to erase the map", "err");
					return;
				}
				print("nice try.", "err");
				shellWindow.classList.remove("is-shaking");
				void shellWindow.offsetWidth;
				shellWindow.classList.add("is-shaking");
			},
			ls: function () {
				print("projects/   kit.txt   map.txt   resume.pdf   uncharted/   .secrets");
			},
			cat: function (args) {
				var file = (args[0] || "").toLowerCase();
				if (file === "kit.txt" || file === "skills.txt") commands.skills();
				else if (file === "map.txt") commands.map();
				else if (file === ".secrets" || file === ".secret" || file === "secrets") commands.secrets();
				else if (file === "resume.pdf") print("binary file. try: resume", "dim");
				else if (file.indexOf("uncharted") === 0) print("cat: uncharted/: nobody's been there yet", "err");
				else if (file.indexOf("projects") === 0) commands.projects();
				else print("cat: " + (args[0] || "") + ": no such file", "err");
			},
			secrets: function () {
				var reveal = function () {
					printHTML(
						"<pre><b>[01] konami</b>    ↑ ↑ ↓ ↓ ← → ← → b a  (on the page)\n" +
							"<b>[02] rain</b>      type <b>matrix</b>          (monochrome canvas rain)\n" +
							"<b>[03] vim keys</b>  j / k · gg · G       (page scroll)\n" +
							"<b>[04] hire</b>      type <b>sudo hire-me</b>    (copies email + sparks)\n" +
							"<b>[05] system</b>    type <b>neofetch</b>        (rig &amp; palette)\n" +
							"<b>[06] coffee</b>    type <b>coffee</b>          (+10 focus, -2 sleep)</pre>"
					);
					scrollShell();
					var r = shellWindow.getBoundingClientRect();
					celebrate(r.left + r.width / 2, r.top + r.height / 2);
				};
				if (reduceMotion) {
					print("decrypting .secrets ................ ok", "acc");
					reveal();
					return;
				}
				print("decrypting .secrets ................", "dim");
				scrollShell();
				setTimeout(function () {
					print("access granted.", "acc");
					reveal();
				}, 260);
			},
			matrix: function () {
				print("streaming monochrome rain…", "acc");
				scrollShell();
				setTimeout(function () {
					closeShell();
					triggerMatrixRain();
				}, 220);
			},
			cd: function (args) {
				var key = (args[0] || "").toLowerCase();
				if (findWaypoint(key)) commands.goto([key]);
				else print("you're already at base camp.", "dim");
			},
			pwd: function () {
				print("/base-camp/ayodhya");
			},
			date: function () {
				print(new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short" }) + " (ist)");
			},
			echo: function (args) {
				print(args.join(" "));
			},
			ping: function () {
				print("pong", "acc");
			},
			coffee: function () {
				print("brewing… done. +10 focus, -2 sleep.", "acc");
			},
			history: function () {
				past.forEach(function (c, i) {
					print(String(i + 1).padStart(3, " ") + "  " + c);
				});
			},
			clear: function () {
				shellOut.textContent = "";
			},
			exit: function () {
				closeShell();
			}
		};
		var ALIASES = { "?": "help", man: "help", work: "projects", kit: "skills", contrib: "stats", whereami: "where", waypoints: "map", go: "goto", hire: "hire-me", email: "contact", rain: "matrix", secret: "secrets", ".secrets": "secrets", ".secret": "secrets", cls: "clear", quit: "exit" };
		var ARG_COMPLETIONS = {
			open: function () {
				return Object.keys(LINKS);
			},
			goto: function () {
				return WAYPOINTS.map(function (w) {
					return w[0];
				});
			},
			cd: function () {
				return WAYPOINTS.map(function (w) {
					return w[0];
				});
			},
			cat: function () {
				return ["kit.txt", "map.txt", "projects/", "resume.pdf", ".secrets", "uncharted/"];
			},
			presence: function () {
				return ["now", "clock", "dot"];
			},
			accent: function () {
				return ACCENTS;
			}
		};

		var run = function (raw) {
			var line = raw.trim();
			print(line, "echo");
			if (line) {
				past.push(line);
				var parts = line.split(/\s+/);
				var name = parts[0].toLowerCase();
				var command = commands[ALIASES[name] || name];
				if (command) command(parts.slice(1));
				else print("command not found: " + parts[0] + " (try help)", "err");
			}
			pastAt = past.length;
			scrollShell();
		};

		shellForm.addEventListener("submit", function (e) {
			e.preventDefault();
			run(shellIn.value);
			shellIn.value = "";
		});

		shellIn.addEventListener("keydown", function (e) {
			if (e.key === "ArrowUp" && past.length) {
				e.preventDefault();
				pastAt = Math.max(0, pastAt - 1);
				shellIn.value = past[pastAt] || "";
			} else if (e.key === "ArrowDown" && past.length) {
				e.preventDefault();
				pastAt = Math.min(past.length, pastAt + 1);
				shellIn.value = past[pastAt] || "";
			} else if (e.key === "Tab" && shellIn.value.trim()) {
				var raw = shellIn.value;
				var spaceIdx = raw.indexOf(" ");
				if (spaceIdx !== -1) {
					var cmdRaw = raw.slice(0, spaceIdx).trim().toLowerCase();
					var resolved = ALIASES[cmdRaw] || cmdRaw;
					var partial = raw.slice(spaceIdx + 1).trim().toLowerCase();
					var getOptions = ARG_COMPLETIONS[resolved];
					if (getOptions) {
						var opts = getOptions();
						var argMatch = opts.filter(function (o) {
							return o.indexOf(partial) === 0 && o !== partial;
						})[0];
						if (argMatch) {
							e.preventDefault();
							shellIn.value = cmdRaw + " " + argMatch;
						}
					}
					return;
				}
				var typed = raw.trim().toLowerCase();
				var match = Object.keys(commands).filter(function (c) {
					return c.indexOf(typed) === 0 && c !== typed;
				})[0];
				if (match) {
					e.preventDefault();
					shellIn.value = match + " ";
				}
			}
		});

		var lastGTime = 0;
		document.addEventListener(
			"keydown",
			function (e) {
				if (isShellOpen() && e.key === "Escape") {
					e.preventDefault();
					closeShell();
					return;
				}
				if (isShellOpen() || e.metaKey || e.ctrlKey || e.altKey) return;
				var target = e.target;
				if (target && target.closest && target.closest("input, textarea, select, [contenteditable]")) return;
				var isSlash = e.key === "/" || e.key === "`" || (!e.shiftKey && e.code === "Slash") || e.code === "NumpadDivide";
				if (isSlash) {
					e.preventDefault();
					e.stopPropagation();
					openShell();
					return;
				}
				/* Subtle Vim-style scrolling: j / k / gg / G */
				if (e.key === "j" && !e.shiftKey) {
					lastGTime = 0;
					window.scrollBy({ top: 180, behavior: reduceMotion ? "auto" : "smooth" });
				} else if (e.key === "k" && !e.shiftKey) {
					lastGTime = 0;
					window.scrollBy({ top: -180, behavior: reduceMotion ? "auto" : "smooth" });
				} else if (e.key === "G" && e.shiftKey) {
					lastGTime = 0;
					window.scrollTo({ top: document.documentElement.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
				} else if (e.key === "g" && !e.shiftKey) {
					var now = performance.now();
					if (now - lastGTime < 500) {
						lastGTime = 0;
						window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
					} else {
						lastGTime = now;
					}
				} else {
					lastGTime = 0;
				}
			},
			true
		);

		var easterLabel = document.querySelector("[data-easter-label]");
		var easterUnlocked = false;

		var launchFromFooterHint = function () {
			if (shellHint && !reduceMotion) {
				var rect = shellHint.getBoundingClientRect();
				celebrate(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5);
				shellHint.classList.remove("is-pulsing");
				void shellHint.offsetWidth;
				shellHint.classList.add("is-pulsing");
			}

			var firstTime = !easterUnlocked;
			if (firstTime) {
				easterUnlocked = true;
				if (shellHint) shellHint.classList.add("is-unlocked");
				if (easterLabel) {
					easterLabel.innerHTML = 'shell unlocked · press <kbd>/</kbd> anytime';
				}
			}

			var openNow = function () {
				openShell();
				if (firstTime) {
					print("// psst — try: cat .secrets", "dim");
					scrollShell();
				}
			};

			if (reduceMotion) openNow();
			else setTimeout(openNow, 150);
		};

		if (shellHint) shellHint.addEventListener("click", launchFromFooterHint);
		shellClose.addEventListener("click", closeShell);
		shell.addEventListener("click", function (e) {
			if (e.target === shell) closeShell();
		});
		shellOut.addEventListener("click", function () {
			var selection = window.getSelection();
			if (!selection || selection.isCollapsed) shellIn.focus({ preventScroll: true });
		});
	}

	/* ---------- Print-mode completeness: expand details while printing ---------- */
	var closedForPrint = [];
	var lazyMediaLoaders = [];
	window.addEventListener("beforeprint", function () {
		closedForPrint = [];
		document.querySelectorAll("details.project, details.note").forEach(function (d) {
			if (!d.open) {
				closedForPrint.push(d);
				d.open = true;
			}
		});
		lazyMediaLoaders.forEach(function (loadNow) {
			loadNow();
		});
	});
	window.addEventListener("afterprint", function () {
		closedForPrint.forEach(function (d) {
			d.open = false;
		});
		closedForPrint = [];
	});

	/* ---------- Project & Note previews: viewport + disclosure lazy loading ---------- */
	function probe(url) {
		return new Promise(function (resolve) {
			var img = new Image();
			img.decoding = "async";
			if ("fetchPriority" in img) img.fetchPriority = "low";
			img.onload = function () {
				img.loading = "lazy";
				resolve(img);
			};
			img.onerror = function () {
				resolve(null);
			};
			img.src = url;
		});
	}

	function setPreviewTag(preview, text, state) {
		var tag = preview.querySelector(".preview-tag");
		if (!tag) return;
		tag.classList.toggle("is-live", state === "live");
		tag.classList.toggle("is-synced", state === "synced");
		tag.lastChild.nodeValue = text;
	}

	// Several screenshots: one at a time, crossfading, with dots to jump between them.
	// The active dot fills like a progress bar; when it finishes (CSS animationend), the next shot slides in.
	// Screenshots arrive lazily: first shot loads immediately, additional slides load sequentially.
	function startSlides(preview, strip) {
		var imgs = [];
		var buttons = [];
		var at = 0;
		var dots = document.createElement("div");
		dots.className = "preview-dots";
		dots.hidden = true;

		function show(i) {
			if (imgs[at]) imgs[at].classList.remove("is-active");
			at = (i + imgs.length) % imgs.length;
			imgs[at].classList.add("is-active");
			buttons.forEach(function (button, j) {
				button.setAttribute("aria-current", String(j === at));
			});
		}

		dots.addEventListener("animationend", function (e) {
			if (e.animationName === "slide-timer") show(at + 1);
		});

		// Hold still (bar and drift freeze) while someone is looking
		var pause = function (on) {
			preview.classList.toggle("is-paused", on);
		};
		preview.addEventListener("pointerenter", function () {
			pause(true);
		});
		preview.addEventListener("pointerleave", function () {
			pause(false);
		});
		dots.addEventListener("focusin", function () {
			pause(true);
		});
		dots.addEventListener("focusout", function () {
			pause(false);
		});

		strip.classList.add("is-slides");
		preview.appendChild(dots);

		return {
			add: function (img) {
				var i = imgs.length;
				imgs.push(img);
				strip.appendChild(img);
				var button = document.createElement("button");
				button.type = "button";
				button.addEventListener("click", function () {
					show(i);
				});
				dots.appendChild(button);
				buttons.push(button);
				buttons.forEach(function (b, j) {
					b.setAttribute("aria-label", "Show screenshot " + (j + 1) + " of " + imgs.length);
				});
				// Dots (and the countdown) only make sense once there are two
				dots.hidden = imgs.length < 2;
				if (i === 0) show(0);
			}
		};
	}

	function scheduleIdle(fn) {
		if ("requestIdleCallback" in window) {
			window.requestIdleCallback(fn, { timeout: 1200 });
		} else {
			setTimeout(fn, 180);
		}
	}

	function loadPreview(preview) {
		if (preview.dataset.loaded) return;
		preview.dataset.loaded = "1";

		// Websites: embed the real thing lazily, rendered at desktop size and scaled to fit
		if (preview.dataset.live) {
			var wrap = document.createElement("div");
			var frame = document.createElement("iframe");
			var loaded = false;
			wrap.className = "preview-live";
			wrap.inert = true;
			frame.title = preview.dataset.alt || "Live preview";
			frame.loading = "lazy";
			frame.tabIndex = -1;
			frame.referrerPolicy = "no-referrer";
			frame.setAttribute("sandbox", "allow-scripts allow-same-origin");
			var fallbackToDemo = function () {
				if (loaded) return;
				setPreviewTag(preview, "demo", "demo");
			};
			var loadTimer = setTimeout(fallbackToDemo, 8000);
			frame.addEventListener("load", function () {
				loaded = true;
				clearTimeout(loadTimer);
				wrap.classList.add("is-loaded");
				setPreviewTag(preview, "live", "live");
			});
			frame.addEventListener("error", function () {
				clearTimeout(loadTimer);
				fallbackToDemo();
			});
			frame.src = preview.dataset.live;
			wrap.appendChild(frame);
			preview.appendChild(wrap);

			var fit = function () {
				wrap.style.setProperty("--s", (preview.clientWidth / 1280).toFixed(4));
			};
			fit();
			if ("ResizeObserver" in window) new ResizeObserver(fit).observe(preview);
			return;
		}

		// Apps: check preview.png first; only fetch fallback screenshots if preview.png is absent/missing,
		// and load extra slideshow screenshots sequentially during idle time instead of blasting them all at once.
		var shots = (preview.dataset.shots || "").split(/\s+/).filter(Boolean);
		var first = preview.dataset.override ? probe(preview.dataset.override) : Promise.resolve(null);
		var label = preview.dataset.alt || "Screenshot";

		var makeStrip = function (single) {
			var strip = document.createElement("div");
			strip.className = "preview-shots" + (single ? " is-single" : "");
			preview.appendChild(strip);
			requestAnimationFrame(function () {
				strip.classList.add("is-loaded");
			});
			setPreviewTag(preview, "synced from github", "synced");
			return strip;
		};

		first.then(function (img) {
			if (img) {
				img.alt = label;
				makeStrip(true).appendChild(img);
				return;
			}
			if (!shots.length) return;

			var slides = null;
			var count = 0;

			function loadNextShot(index) {
				if (index >= shots.length) return;
				probe(shots[index]).then(function (shot) {
					if (shot) {
						count += 1;
						shot.alt = label + " " + count;
						if (!slides) slides = startSlides(preview, makeStrip(false));
						slides.add(shot);
					}
					if (index + 1 < shots.length) {
						scheduleIdle(function () {
							loadNextShot(index + 1);
						});
					}
				});
			}

			loadNextShot(0);
		});
	}

	// Lazy-load media across both Projects (.projects) and Field Notes (.notes):
	// Mirrors lib/lazy-media.js shouldLoadMedia — requires BOTH viewport proximity AND open <details>
	(function initLazySectionMedia() {
		var items = [];
		var observedEls = new Map();

		function tryLoad(item, force) {
			if (item.loaded) return;
			if (!force) {
				if (!item.inViewport) return;
				if (item.details && !item.details.open) return;
			}
			item.loaded = true;
			if (mediaObserver && item.observeEl) {
				var group = observedEls.get(item.observeEl);
				if (group) {
					var remaining = group.filter(function (entry) {
						return !entry.loaded;
					});
					if (remaining.length) {
						observedEls.set(item.observeEl, remaining);
					} else {
						mediaObserver.unobserve(item.observeEl);
						observedEls.delete(item.observeEl);
					}
				}
			}
			item.load();
		}

		var mediaObserver =
			"IntersectionObserver" in window
				? new IntersectionObserver(
						function (entries) {
							entries.forEach(function (entry) {
								var group = observedEls.get(entry.target);
								if (!group) return;
								group.forEach(function (item) {
									item.inViewport = entry.isIntersecting;
									if (entry.isIntersecting) tryLoad(item, false);
								});
							});
						},
						{ rootMargin: "240px 0px", threshold: 0.01 }
					)
				: null;

		function register(targetEl, loadFn) {
			var details = targetEl.closest("details");
			// Observe the <details> container when inside one (collapsed previews have 0 height)
			var observeEl = details || targetEl;
			var item = {
				observeEl: observeEl,
				details: details,
				inViewport: !mediaObserver,
				loaded: false,
				load: loadFn,
			};
			items.push(item);
			lazyMediaLoaders.push(function () {
				tryLoad(item, true);
			});

			if (mediaObserver) {
				var list = observedEls.get(observeEl);
				if (!list) {
					list = [];
					observedEls.set(observeEl, list);
					mediaObserver.observe(observeEl);
				}
				list.push(item);
			}

			if (details) {
				details.addEventListener("toggle", function () {
					if (details.open) {
						// Also check live bounding rect in case the toggle happened while already in view
						if (!item.inViewport) {
							var r = observeEl.getBoundingClientRect();
							var vh = window.innerHeight || document.documentElement.clientHeight || 0;
							if (r.top < vh + 240 && r.bottom > -240) item.inViewport = true;
						}
						tryLoad(item, false);
					}
				});
			}

			if (!mediaObserver) tryLoad(item, false);
		}

		// 1. All .preview cards across Projects and Notes
		document.querySelectorAll(".projects .preview, .notes .preview, .preview").forEach(function (preview) {
			if (preview.dataset.lazyBound) return;
			preview.dataset.lazyBound = "1";
			register(preview, function () {
				loadPreview(preview);
			});
		});

		// 2. Any <img> inside Projects or Field Notes (native lazy attrs + optional data-src hydration)
		document.querySelectorAll(".projects img, .notes img").forEach(function (img) {
			if (!img.getAttribute("loading")) img.setAttribute("loading", "lazy");
			if (!img.getAttribute("decoding")) img.setAttribute("decoding", "async");
			if (img.dataset.src && !img.getAttribute("src")) {
				register(img, function () {
					if (img.dataset.srcset) img.srcset = img.dataset.srcset;
					img.src = img.dataset.src;
					delete img.dataset.src;
				});
			}
		});
	})();

	/* ---------- Projects open on hover (desktop); click and keyboard still toggle ---------- */
	// One project open at a time. Hovering a row opens it, holds that row still while the others
	// collapse, then glides the page so the open project sits near the top with the rest reachable.
	// Nothing closes when the cursor leaves; rows only change when you hover another or click.
	if (finePointer) {
		var projects = Array.prototype.slice.call(document.querySelectorAll(".project"));
		var hoverTimer = 0;
		var userMoved = true;
		var lastX = -1;
		var lastY = -1;

		// Driven by real pointer movement only: rows sliding under a still cursor
		// (while the page glides) never open themselves
		var candidate = null;
		window.addEventListener(
			"pointermove",
			function (e) {
				if (e.clientX === lastX && e.clientY === lastY) return;
				lastX = e.clientX;
				lastY = e.clientY;
				userMoved = true;
				var project = e.target.closest ? e.target.closest(".project") : null;
				if (project === candidate) return;
				candidate = project;
				clearTimeout(hoverTimer);
				if (!project || project.open) return;
				// A short pause so sweeping across the list doesn't flap rows open
				hoverTimer = setTimeout(function () {
					if (candidate === project && userMoved) openProject(project);
				}, 160);
			},
			{ passive: true }
		);

		// Layout position (offsetTop ignores transforms from the scroll-reveal animation)
		var pageTop = function (el) {
			var top = 0;
			for (var node = el; node; node = node.offsetParent) top += node.offsetTop;
			return top;
		};

		var openProject = function (project) {
			var summary = project.querySelector("summary");
			var onScreen = pageTop(summary) - window.scrollY;
			userMoved = false;

			projects.forEach(function (other) {
				other.open = other === project;
			});

			// Hold the hovered row still while the rows around it open and close
			var until = performance.now() + 420;
			(function hold() {
				var target = pageTop(summary) - onScreen;
				if (Math.abs(target - window.scrollY) > 0.5) window.scrollTo({ top: target, behavior: "instant" });
				if (performance.now() < until) {
					requestAnimationFrame(hold);
					return;
				}
				// Then glide so the open project starts near the top of the screen
				var goal = pageTop(summary) - 72;
				if (Math.abs(goal - window.scrollY) > 24) {
					userMoved = false;
					window.scrollTo({ top: goal, behavior: reduceMotion ? "auto" : "smooth" });
				}
			})();
		};

		projects.forEach(function (project) {
			project.removeAttribute("name"); // exclusivity is handled above, without layout jumps
			// Clicking follows the same one-at-a-time rule
			project.querySelector("summary").addEventListener("click", function (e) {
				e.preventDefault();
				clearTimeout(hoverTimer);
				if (project.open) project.open = false;
				else openProject(project);
			});
		});
	}

	/* ---------- Scroll reveal fallback (when CSS scroll timelines are unsupported) ---------- */
	var reveals = document.querySelectorAll(".reveal");

	if (!CSS.supports("animation-timeline: view()") && "IntersectionObserver" in window) {
		var observer = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						entry.target.classList.add("is-visible");
						observer.unobserve(entry.target);
					}
				});
			},
			{ rootMargin: "0px 0px -50px 0px" }
		);
		reveals.forEach(function (el) {
			observer.observe(el);
		});
	} else {
		reveals.forEach(function (el) {
			el.classList.add("is-visible");
		});
	}

	/* ---------- Whole-page scroll indicator (auto-hiding contribution squares) ---------- */
	(function initPageScrollBar() {
		var bar = document.querySelector("[data-page-scroll-bar]");
		var blocksWrap = bar && bar.querySelector("[data-page-scroll-blocks]");
		if (!bar || !blocksWrap) return;

		var TOTAL_BLOCKS = 18;
		var AUTO_HIDE_MS = 1400;
		var blockEls = [];

		// Build 18 contribution-sized squares once using pure DOM nodes
		blocksWrap.textContent = "";
		for (var i = 0; i < TOTAL_BLOCKS; i++) {
			var cell = document.createElement("span");
			cell.className = "page-scroll-block";
			cell.setAttribute("data-level", "0");
			blocksWrap.appendChild(cell);
			blockEls.push(cell);
		}

		function clamp01(v) {
			if (!Number.isFinite(v)) return 0;
			if (v <= 0) return 0;
			if (v >= 1) return 1;
			return v;
		}

		// Mirrors lib/reading-progress.js computePageScrollProgress
		function getScrollMetrics() {
			var docEl = document.documentElement;
			var vh = window.innerHeight || docEl.clientHeight || 0;
			var sh = Math.max(docEl.scrollHeight || 0, document.body ? document.body.scrollHeight : 0);
			var maxScroll = Math.max(0, sh - vh);
			var y = window.scrollY || window.pageYOffset || docEl.scrollTop || 0;
			var scrollable = maxScroll > 1;
			var progress = scrollable ? clamp01(y / maxScroll) : 0;
			return {
				progress: progress,
				percent: Math.round(progress * 100),
				scrollable: scrollable,
				maxScroll: maxScroll,
			};
		}

		// Mirrors lib/reading-progress.js computeScrollBlocks
		function applyBlockStates(progress) {
			var headIndex = Math.round(clamp01(progress) * (TOTAL_BLOCKS - 1));
			for (var idx = 0; idx < TOTAL_BLOCKS; idx++) {
				var el = blockEls[idx];
				if (idx > headIndex) {
					el.classList.remove("is-visible");
					el.setAttribute("data-level", "0");
					continue;
				}
				var level;
				if (idx === headIndex) {
					level = 4;
				} else if (headIndex < 4) {
					level = Math.max(0, 4 - (headIndex - idx));
				} else {
					level = Math.min(3, Math.floor((idx / headIndex) * 4));
				}
				el.classList.add("is-visible");
				el.setAttribute("data-level", String(level));
			}
		}

		var frame = 0;
		var hideTimer = 0;
		var hovered = false;
		var dragging = false;
		var activePointerId = null;

		function scheduleAutoHide() {
			clearTimeout(hideTimer);
			if (hovered || dragging) return;
			hideTimer = setTimeout(function () {
				if (!hovered && !dragging) {
					bar.classList.remove("is-active");
				}
			}, AUTO_HIDE_MS);
		}

		function wakeBar() {
			if (bar.hidden) return;
			bar.classList.add("is-active");
			scheduleAutoHide();
		}

		function updateBar(shouldWake) {
			frame = 0;
			var m = getScrollMetrics();
			bar.hidden = !m.scrollable;
			if (!m.scrollable) {
				bar.classList.remove("is-active");
				return;
			}
			bar.setAttribute("aria-valuenow", String(m.percent));
			applyBlockStates(m.progress);
			if (shouldWake) wakeBar();
		}

		var pendingWake = false;
		function scheduleUpdate(shouldWake) {
			if (shouldWake) pendingWake = true;
			if (!frame) {
				frame = requestAnimationFrame(function () {
					var w = pendingWake;
					pendingWake = false;
					updateBar(w);
				});
			}
		}

		function scrubToClientY(clientY) {
			var rect = blocksWrap.getBoundingClientRect();
			if (!rect.height) return;
			var ratio = clamp01((clientY - rect.top) / rect.height);
			var m = getScrollMetrics();
			if (!m.scrollable) return;
			window.scrollTo({
				top: Math.round(ratio * m.maxScroll),
				behavior: "instant",
			});
			updateBar(true);
		}

		bar.addEventListener("pointerenter", function () {
			hovered = true;
			clearTimeout(hideTimer);
		});

		bar.addEventListener("pointerleave", function () {
			hovered = false;
			scheduleAutoHide();
		});

		bar.addEventListener("pointerdown", function (e) {
			if (e.button !== 0) return;
			dragging = true;
			activePointerId = e.pointerId;
			clearTimeout(hideTimer);
			bar.classList.add("is-active", "is-dragging");
			if (bar.setPointerCapture) {
				try {
					bar.setPointerCapture(e.pointerId);
				} catch (_) {}
			}
			scrubToClientY(e.clientY);
		});

		bar.addEventListener("pointermove", function (e) {
			if (!dragging || e.pointerId !== activePointerId) return;
			scrubToClientY(e.clientY);
		});

		function endDrag(e) {
			if (!dragging) return;
			if (e && activePointerId !== null && e.pointerId !== activePointerId) return;
			dragging = false;
			bar.classList.remove("is-dragging");
			if (activePointerId !== null && bar.releasePointerCapture) {
				try {
					bar.releasePointerCapture(activePointerId);
				} catch (_) {}
			}
			activePointerId = null;
			scheduleAutoHide();
		}

		bar.addEventListener("pointerup", endDrag);
		bar.addEventListener("pointercancel", endDrag);

		window.addEventListener(
			"scroll",
			function () {
				scheduleUpdate(true);
			},
			{ passive: true }
		);
		window.addEventListener(
			"resize",
			function () {
				scheduleUpdate(false);
			},
			{ passive: true }
		);

		// Re-measure whenever collapsible projects or field notes open/close
		document.querySelectorAll("details.project, details.note").forEach(function (el) {
			el.addEventListener("toggle", function () {
				scheduleUpdate(false);
				setTimeout(function () {
					scheduleUpdate(false);
				}, 320);
			});
		});

		if ("ResizeObserver" in window && document.body) {
			var scrollRo = new ResizeObserver(function () {
				scheduleUpdate(false);
			});
			scrollRo.observe(document.body);
		}

		// Sync initial block states silently (starts auto-hidden until user scrolls)
		updateBar(false);
	})();

	/* ---------- Tab title + a hello for whoever opens devtools ---------- */
	var baseTitle = document.title;
	document.addEventListener("visibilitychange", function () {
		document.title = document.hidden ? "hey, come back — still building…" : baseTitle;
	});
	console.log("%c d. %c building things ", "background:#e5e7eb;color:#08090a;font:700 16px monospace;padding:2px 6px", "font:13px monospace");
	console.log("you opened devtools, so you like poking under the hood too. press / on the page to open the shell, or say hi → " + EMAIL);

	if (reduceMotion) return;

	/* ---------- Name: decrypts on load, letters thin out near the cursor ---------- */
	var nameEl = document.querySelector(".accent-text");

	if (nameEl) {
		var GLYPHS = "abcdefghijklmnopqrstuvwxyz#%&*+=<>/";
		var word = nameEl.textContent;
		var spoken = document.createElement("span");
		var shown = document.createElement("span");
		spoken.className = "sr-only";
		spoken.textContent = word;
		shown.setAttribute("aria-hidden", "true");

		var letters = word.split("").map(function (ch) {
			var span = document.createElement("span");
			span.className = "ch";
			span.textContent = ch;
			shown.appendChild(span);
			return { el: span, ch: ch, weight: 700 };
		});
		nameEl.textContent = "";
		nameEl.appendChild(spoken);
		nameEl.appendChild(shown);

		// Each letter cycles through random glyphs, settling left to right
		var decryptStart = performance.now();
		(function decrypt(now) {
			var done = true;
			letters.forEach(function (l, i) {
				if (now < decryptStart + 380 + i * 65) {
					done = false;
					l.el.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
				} else {
					l.el.textContent = l.ch;
				}
			});
			if (!done) requestAnimationFrame(decrypt);
		})(decryptStart);

		// Weight follows the cursor; JetBrains Mono keeps every weight the same width, so nothing shifts
		if (finePointer) {
			var nameFrame = 0;
			var px = -1e4;
			var py = -1e4;

			var updateName = function () {
				var moving = false;
				letters.forEach(function (l) {
					var r = l.el.getBoundingClientRect();
					var d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
					var t = Math.max(0, 1 - d / 120);
					var target = 700 - 520 * t * t * (3 - 2 * t);
					l.weight += (target - l.weight) * 0.18;
					if (Math.abs(target - l.weight) > 0.5) moving = true;
					l.el.style.fontWeight = Math.round(l.weight);
				});
				nameFrame = moving ? requestAnimationFrame(updateName) : 0;
			};

			var nudgeName = function (x, y) {
				px = x;
				py = y;
				if (!nameFrame) nameFrame = requestAnimationFrame(updateName);
			};

			window.addEventListener(
				"pointermove",
				function (e) {
					nudgeName(e.clientX, e.clientY);
				},
				{ passive: true }
			);
			document.addEventListener("mouseout", function (e) {
				if (!e.relatedTarget) nudgeName(-1e4, -1e4);
			});
		}
	}

	/* ---------- Headings and links scramble for a beat on hover ---------- */
	var SCRAMBLE = "!<>-_\\/[]{}=+*^?#%&01";

	function scramble(el) {
		if (!el || el.dataset.scrambling) return;
		el.dataset.scrambling = "1";
		var nodes = [];
		var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
		while (walker.nextNode()) {
			if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
		}
		var originals = nodes.map(function (n) {
			return n.nodeValue;
		});
		var t0 = performance.now();

		(function step(now) {
			var p = Math.min(1, (now - t0) / 360);
			nodes.forEach(function (n, j) {
				var text = originals[j];
				var settled = Math.floor(p * text.length);
				var out = "";
				for (var i = 0; i < text.length; i++) {
					out += /\s/.test(text[i]) || i < settled ? text[i] : SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0];
				}
				n.nodeValue = out;
			});
			if (p < 1) requestAnimationFrame(step);
			else delete el.dataset.scrambling;
		})(t0);
	}

	if (finePointer) {
		document.querySelectorAll(".section-title, .links a").forEach(function (el) {
			el.addEventListener("pointerenter", function () {
				scramble(el);
			});
		});
		document.querySelectorAll(".project summary").forEach(function (el) {
			el.addEventListener("pointerenter", function () {
				scramble(el.querySelector(".project-name"));
			});
		});
	}

	/* ---------- Click sparks ---------- */
	var canvas = document.querySelector(".sparks");
	var ctx = canvas.getContext("2d");
	var clicks = [];
	var running = false;
	var MAX_AGE = 20;

	function resize() {
		var dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = innerWidth * dpr;
		canvas.height = innerHeight * dpr;
		canvas.style.width = innerWidth + "px";
		canvas.style.height = innerHeight + "px";
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	var rainState = null;

	function draw() {
		ctx.clearRect(0, 0, innerWidth, innerHeight);
		var rgb = getComputedStyle(root).getPropertyValue("--fg-rgb").trim().split(/\s+/).join(", ");

		if (rainState) {
			var elapsed = performance.now() - rainState.start;
			var totalMs = 3400;
			var fade = elapsed > totalMs - 900 ? Math.max(0, (totalMs - elapsed) / 900) : Math.min(1, elapsed / 260);
			ctx.font = '12px "JetBrains Mono", ui-monospace, monospace';
			for (var col = 0; col < rainState.drops.length; col++) {
				var drop = rainState.drops[col];
				drop.y += drop.speed;
				if (drop.y * 18 > innerHeight + 120) drop.y = -Math.random() * 14;
				for (var trail = 0; trail < 6; trail++) {
					var py = Math.floor(drop.y - trail) * 18;
					if (py < -18 || py > innerHeight + 18) continue;
					var alpha = (1 - trail / 6) * (trail === 0 ? 0.52 : 0.24) * fade;
					ctx.fillStyle = "rgba(" + rgb + ", " + alpha.toFixed(3) + ")";
					var glyph = rainState.chars[(col * 7 + Math.floor(drop.y) + trail) % rainState.chars.length];
					ctx.fillText(glyph, col * 24 + 8, py);
				}
			}
			if (elapsed >= totalMs) rainState = null;
		}

		clicks.forEach(function (c) {
			c.age += 1;
			ctx.strokeStyle = "rgba(" + rgb + ", " + Math.max(0, 1 - c.age / MAX_AGE) + ")";
			ctx.lineWidth = 2;
			ctx.lineCap = "round";

			for (var i = 0; i < 4; i++) {
				var angle = Math.PI - Math.PI / 8 + (Math.PI / 5) * (i + 1);
				var dist = 8 + c.age * 0.8;
				ctx.beginPath();
				ctx.moveTo(c.x + Math.cos(angle) * dist, c.y + Math.sin(angle) * dist);
				ctx.lineTo(c.x + Math.cos(angle) * (dist + 5), c.y + Math.sin(angle) * (dist + 5));
				ctx.stroke();
			}
		});

		clicks = clicks.filter(function (c) {
			return c.age < MAX_AGE;
		});

		// Only animate while there are sparks or rain on screen
		if (clicks.length || rainState) {
			requestAnimationFrame(draw);
		} else {
			ctx.clearRect(0, 0, innerWidth, innerHeight);
			running = false;
		}
	}

	function spark(x, y) {
		clicks.push({ x: x, y: y, age: 0 });
		if (!running) {
			running = true;
			requestAnimationFrame(draw);
		}
	}

	triggerMatrixRain = function () {
		var cols = Math.max(12, Math.floor(innerWidth / 24));
		var drops = [];
		for (var i = 0; i < cols; i++) {
			drops.push({ y: -Math.random() * 22, speed: 0.28 + Math.random() * 0.42 });
		}
		rainState = {
			start: performance.now(),
			drops: drops,
			chars: "01/·:+-=_[]{}<>*#"
		};
		if (!running) {
			running = true;
			requestAnimationFrame(draw);
		}
	};

	// A small ring of sparks for secrets and sudo hire-me
	celebrate = function (x, y) {
		for (var i = 0; i < 10; i++) {
			(function (i) {
				setTimeout(function () {
					var a = (i / 10) * Math.PI * 2;
					spark(x + Math.cos(a) * 70, y + Math.sin(a) * 45);
				}, i * 45);
			})(i);
		}
	};

	/* ---------- Cursor-proximity faint dot grid ---------- */
	var dotGrid = document.querySelector(".dot-grid");
	if (dotGrid && finePointer) {
		var gridFrame = 0;
		var gx = -999;
		var gy = -999;
		var paintDotGrid = function () {
			gridFrame = 0;
			dotGrid.style.setProperty("--mx", gx + "px");
			dotGrid.style.setProperty("--my", gy + "px");
		};
		window.addEventListener(
			"pointermove",
			function (e) {
				gx = e.clientX;
				gy = e.clientY;
				if (!gridFrame) gridFrame = requestAnimationFrame(paintDotGrid);
			},
			{ passive: true }
		);
		document.addEventListener("mouseout", function (e) {
			if (!e.relatedTarget) {
				gx = -999;
				gy = -999;
				if (!gridFrame) gridFrame = requestAnimationFrame(paintDotGrid);
			}
		});
	}

	resize();
	window.addEventListener("resize", resize);
	window.addEventListener("pointerdown", function (e) {
		spark(e.clientX, e.clientY);
	});
})();

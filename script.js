/* ==========================================================================
   DIPANSHU — ideas, compiled
   Vanilla JS, no dependencies. Everything here is enhancement: the page reads
   fine without it, and prefers-reduced-motion gets a loud-but-still version.
   ========================================================================== */
(() => {
	"use strict";

	/* ---------- Helpers ---------- */
	const root = document.documentElement;
	const $ = (sel, el = document) => el.querySelector(sel);
	const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
	const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
	const lerp = (a, b, t) => a + (b - a) * t;
	const rand = (min, max) => min + Math.random() * (max - min);
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	const store = {
		get(key) {
			try {
				return localStorage.getItem(key);
			} catch (e) {
				return null;
			}
		},
		set(key, value) {
			try {
				localStorage.setItem(key, value);
			} catch (e) {}
		},
	};

	const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
	const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
	const EMAIL = "diipupc@gmail.com";
	const LINKEDIN = "https://www.linkedin.com/in/dipanshu-singh-86b2ba444/";
	const GLYPHS = "!<>-_\\/[]{}=+*^?#%&$01ABCDEFXZ";

	if (!reduce) root.classList.add("js-motion");

	const pointer = { x: innerWidth / 2, y: innerHeight * 0.4, last: -1e9 };
	const scroll = { vel: 0, smooth: 0, dir: 1 };
	const heroTitle = $(".hero-title");
	let gl = null; // WebGL background, set up near the end

	addEventListener(
		"pointermove",
		(e) => {
			pointer.x = e.clientX;
			pointer.y = e.clientY;
			pointer.last = performance.now();
		},
		{ passive: true }
	);

	/* ---------- Sound (WebAudio blips, off by default) ---------- */
	const sound = (() => {
		let ctx = null;
		let on = store.get("snd") === "on";
		const btn = $(".sound-btn");

		function ensure() {
			const AC = window.AudioContext || window.webkitAudioContext;
			if (!AC) return null;
			if (!ctx) ctx = new AC();
			if (ctx.state === "suspended") ctx.resume();
			return ctx;
		}

		function tone(freq, { dur = 0.06, type = "square", vol = 0.035, slide = 0, delay = 0 } = {}) {
			if (!on) return;
			const c = ensure();
			if (!c) return;
			const t = c.currentTime + delay;
			const osc = c.createOscillator();
			const gain = c.createGain();
			osc.type = type;
			osc.frequency.setValueAtTime(freq, t);
			if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
			gain.gain.setValueAtTime(vol, t);
			gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
			osc.connect(gain).connect(c.destination);
			osc.start(t);
			osc.stop(t + dur + 0.02);
		}

		function render() {
			if (!btn) return;
			btn.setAttribute("aria-pressed", String(on));
			$("b", btn).textContent = on ? "on" : "off";
		}

		const api = {
			tick: () => tone(1900, { dur: 0.02, vol: 0.012 }),
			key: () => tone(rand(900, 1400), { dur: 0.02, vol: 0.018, type: "triangle" }),
			click: () => tone(520, { dur: 0.07, vol: 0.03, slide: -220 }),
			up: () => [440, 660, 880, 1320].forEach((f, i) => tone(f, { dur: 0.09, vol: 0.03, delay: i * 0.07 })),
			whoosh: () => tone(180, { dur: 0.35, vol: 0.04, slide: 1500, type: "sawtooth" }),
			error: () => tone(170, { dur: 0.22, vol: 0.045, type: "sawtooth", slide: -70 }),
			set(value) {
				on = value;
				store.set("snd", on ? "on" : "off");
				render();
				if (on) api.up();
			},
		};

		render();
		if (btn) btn.addEventListener("click", () => api.set(!on));
		return api;
	})();

	/* ---------- Toast, flash, shake ---------- */
	const toastEl = $(".toast");
	let toastTimer = 0;
	function toast(message) {
		if (!toastEl) return;
		toastEl.textContent = message;
		toastEl.classList.add("is-on");
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 2400);
	}

	const flashEl = $(".fx-flash");
	function flash() {
		if (reduce || !flashEl) return;
		flashEl.classList.remove("is-on");
		void flashEl.offsetWidth;
		flashEl.classList.add("is-on");
	}

	function shake() {
		if (reduce) return;
		root.classList.remove("is-shaking");
		void root.offsetWidth;
		root.classList.add("is-shaking");
		setTimeout(() => root.classList.remove("is-shaking"), 520);
	}

	let glitchTimer = 0;
	function glitchHero() {
		if (reduce || !heroTitle) return;
		heroTitle.classList.remove("is-glitch");
		void heroTitle.offsetWidth;
		heroTitle.classList.add("is-glitch");
		clearTimeout(glitchTimer);
		glitchTimer = setTimeout(() => heroTitle.classList.remove("is-glitch"), 320);
	}

	/* ---------- Text scramble ---------- */
	const scrambling = new WeakMap();
	const originals = new WeakMap();

	function scrambleNode(node, finalText, duration = 550) {
		cancelAnimationFrame(scrambling.get(node));
		const start = performance.now();
		const step = (now) => {
			const p = clamp((now - start) / duration, 0, 1);
			const settled = Math.floor(p * finalText.length);
			let out = "";
			for (let i = 0; i < finalText.length; i++) {
				const ch = finalText[i];
				out += ch === " " || i < settled ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
			}
			node.nodeValue = out;
			if (p < 1) scrambling.set(node, requestAnimationFrame(step));
			else node.nodeValue = finalText;
		};
		scrambling.set(node, requestAnimationFrame(step));
	}

	function textNodes(el) {
		const nodes = [];
		const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
		while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
		return nodes;
	}

	function scramble(el, duration) {
		if (reduce) return;
		textNodes(el).forEach((node) => {
			if (!originals.has(node)) originals.set(node, node.nodeValue);
			scrambleNode(node, originals.get(node), duration);
		});
	}

	$$("[data-scramble]").forEach((el) => {
		const host = el.closest("a, button") || el;
		const go = () => {
			scramble(el);
			sound.tick();
		};
		host.addEventListener("pointerenter", go);
		host.addEventListener("focus", go);
	});

	/* ---------- Click sparks ---------- */
	const sparks = (() => {
		const canvas = $(".fx-sparks");
		if (!canvas || reduce) return { burst() {} };
		const ctx = canvas.getContext("2d");
		let parts = [];
		let running = false;

		function size() {
			const dpr = Math.min(devicePixelRatio || 1, 2);
			canvas.width = innerWidth * dpr;
			canvas.height = innerHeight * dpr;
			canvas.style.width = innerWidth + "px";
			canvas.style.height = innerHeight + "px";
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		}

		function burst(x, y, count = 12) {
			const color = getComputedStyle(root).getPropertyValue("--accent").trim() || "#c6ff3d";
			const big = count > 20;
			for (let i = 0; i < count; i++) {
				const angle = rand(0, Math.PI * 2);
				const speed = rand(2, big ? 13 : 6);
				parts.push({
					x,
					y,
					vx: Math.cos(angle) * speed,
					vy: Math.sin(angle) * speed - (big ? 2.5 : 0),
					life: 0,
					max: rand(26, big ? 70 : 44),
					glyph: Math.random() < 0.45 ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : "",
					color,
				});
			}
			if (!running) {
				running = true;
				requestAnimationFrame(draw);
			}
		}

		function draw() {
			ctx.clearRect(0, 0, innerWidth, innerHeight);
			ctx.font = "700 15px Recursive, monospace";
			ctx.lineCap = "round";
			parts = parts.filter((p) => p.life < p.max);
			for (const p of parts) {
				p.life++;
				p.x += p.vx;
				p.y += p.vy;
				p.vx *= 0.94;
				p.vy = p.vy * 0.94 + 0.22;
				ctx.globalAlpha = 1 - p.life / p.max;
				ctx.fillStyle = ctx.strokeStyle = p.color;
				if (p.glyph) {
					ctx.fillText(p.glyph, p.x, p.y);
				} else {
					ctx.lineWidth = 2;
					ctx.beginPath();
					ctx.moveTo(p.x, p.y);
					ctx.lineTo(p.x - p.vx * 2.4, p.y - p.vy * 2.4);
					ctx.stroke();
				}
			}
			ctx.globalAlpha = 1;
			if (parts.length) requestAnimationFrame(draw);
			else {
				running = false;
				ctx.clearRect(0, 0, innerWidth, innerHeight);
			}
		}

		size();
		addEventListener("resize", size);
		addEventListener("pointerdown", (e) => {
			burst(e.clientX, e.clientY, 12);
			sound.click();
		});
		return { burst };
	})();
	const burst = (x, y, n) => sparks.burst(x, y, n);

	/* ---------- Copy email ---------- */
	function copyEmail(e, { quiet = false } = {}) {
		let x = innerWidth / 2;
		let y = innerHeight / 2;
		const target = e && e.currentTarget;
		if (e && e.clientX) {
			x = e.clientX;
			y = e.clientY;
		} else if (target && target.getBoundingClientRect) {
			const r = target.getBoundingClientRect();
			x = r.left + r.width / 2;
			y = r.top + r.height / 2;
		}
		const done = () => {
			if (quiet) return;
			toast("copied → " + EMAIL);
			sound.up();
			burst(x, y, 70);
		};
		if (navigator.clipboard && window.isSecureContext) {
			navigator.clipboard.writeText(EMAIL).then(done, () => (location.href = "mailto:" + EMAIL));
		} else {
			location.href = "mailto:" + EMAIL;
		}
	}
	$$("[data-copy-email]").forEach((btn) => btn.addEventListener("click", copyEmail));

	/* ---------- Color modes ---------- */
	const MODES = ["acid", "inferno", "ice", "paper"];
	const modeLabel = $("[data-mode-label]");
	const themeMeta = $('meta[name="theme-color"]');

	function setMode(mode, { silent = false } = {}) {
		mode = String(mode).toLowerCase();
		if (!MODES.includes(mode)) return false;
		root.dataset.mode = mode;
		store.set("mode", mode);
		if (modeLabel) modeLabel.textContent = mode;
		if (themeMeta) themeMeta.content = mode === "paper" ? "#f2ede1" : "#050607";
		if (gl) gl.recolor();
		if (!silent) {
			flash();
			glitchHero();
			sound.whoosh();
			toast("mode → " + mode);
		}
		return true;
	}

	if (!MODES.includes(root.dataset.mode)) root.dataset.mode = "acid";
	if (modeLabel) modeLabel.textContent = root.dataset.mode;
	const modeBtn = $(".mode-btn");
	if (modeBtn) modeBtn.addEventListener("click", () => setMode(MODES[(MODES.indexOf(root.dataset.mode) + 1) % MODES.length]));

	/* ---------- Custom cursor ---------- */
	const cursor = (() => {
		const el = $(".cursor");
		if (!el || !fine || reduce) return null;
		root.classList.add("has-cursor");
		const dot = $(".cursor-dot", el);
		const ring = $(".cursor-ring", el);
		const label = $(".cursor-label", el);
		const LABELS = { go: "go ↓", copy: "copy", open: "open ↗", mode: "swap", sound: "snd", drag: "drag", type: "type", top: "top ↑", mail: "mail" };
		let rx = pointer.x;
		let ry = pointer.y;

		document.addEventListener("pointerover", (e) => {
			const hit = e.target.closest("a, button, input, label, [data-cursor], .keys li, .commit");
			const host = hit && hit.closest("[data-cursor]");
			let key = host ? host.dataset.cursor : "";
			if (!key && hit && hit.matches('a[target="_blank"]')) key = "open";
			const text = key ? LABELS[key] || key : "";
			label.textContent = text;
			el.classList.toggle("is-label", Boolean(text));
			el.classList.toggle("is-hover", Boolean(hit) && !text);
		});
		addEventListener("pointerdown", () => el.classList.add("is-down"));
		addEventListener("pointerup", () => el.classList.remove("is-down"));
		document.addEventListener("mouseout", (e) => {
			if (!e.relatedTarget) el.classList.add("is-hidden");
		});
		addEventListener("pointermove", () => el.classList.remove("is-hidden"), { passive: true });

		return {
			update() {
				rx = lerp(rx, pointer.x, 0.2);
				ry = lerp(ry, pointer.y, 0.2);
				dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
				ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
			},
		};
	})();

	/* ---------- Magnetic buttons ---------- */
	if (fine && !reduce) {
		$$("[data-magnetic]").forEach((el) => {
			const strength = parseFloat(el.dataset.magnetic) || 0.3;
			el.addEventListener("pointermove", (e) => {
				const r = el.getBoundingClientRect();
				const dx = e.clientX - (r.left + r.width / 2);
				const dy = e.clientY - (r.top + r.height / 2);
				el.style.transition = "transform 0.15s ease-out";
				el.style.transform = `translate(${(dx * strength).toFixed(1)}px, ${(dy * strength).toFixed(1)}px)`;
			});
			el.addEventListener("pointerleave", () => {
				el.style.transition = "transform 0.7s var(--ease-spring)";
				el.style.transform = "";
			});
		});
	}

	/* ---------- Boot sequence ---------- */
	async function boot() {
		const el = $(".boot");
		if (!el || !root.classList.contains("js-boot")) return;
		const log = $(".boot-log", el);
		const bar = $(".boot-bar", el);
		const pct = $(".boot-pct", el);
		let skip = false;
		const onSkip = () => (skip = true);
		addEventListener("keydown", onSkip);
		addEventListener("pointerdown", onSkip);

		const lines = [
			["DipanshuOS 26.10 (ideas-compiler) — booting", ""],
			["cpu: 1x caffeinated brain @ 3.0GHz ......", "ok"],
			["mounting /ideas ..........................", "ok"],
			["loading python · rust · c++ ..............", "ok"],
			["loading kavach (local ai) ................", "ok"],
			["linking libopensource.so .................", "ok"],
			["starting ollama daemon ...................", "ok"],
			["checking sleep schedule ..................", "skipped"],
			["compiling dipanshu.exe", ""],
		];
		const t0 = performance.now();
		for (const [text, status] of lines) {
			if (skip) break;
			const stamp = ((performance.now() - t0) / 1000).toFixed(3).padStart(7, " ");
			const row = document.createElement("div");
			row.textContent = `[${stamp}] ${text} `;
			if (status) {
				const s = document.createElement("span");
				s.className = "ok";
				s.textContent = status;
				row.append(s);
			}
			log.append(row);
			sound.key();
			await sleep(rand(70, 140));
		}

		for (let p = 0; p < 100; p += skip ? 34 : Math.ceil(rand(3, 9))) {
			bar.style.setProperty("--p", (p / 100).toFixed(2));
			pct.textContent = String(p).padStart(3, "0") + "%";
			await sleep(skip ? 12 : 26);
		}
		bar.style.setProperty("--p", "1");
		pct.textContent = "100%";
		el.classList.add("is-granted");
		sound.up();
		await sleep(skip ? 120 : 620);

		el.classList.add("is-leaving");
		root.classList.remove("js-boot");
		try {
			sessionStorage.setItem("booted", "1");
		} catch (e) {}
		removeEventListener("keydown", onSkip);
		removeEventListener("pointerdown", onSkip);
		await sleep(950);
		el.classList.remove("is-leaving", "is-granted");
		measureAll();
	}

	/* ---------- Hero: typer, roles, glitch ---------- */
	async function typeTagline() {
		const el = $(".typer");
		if (!el) return;
		const text = el.textContent.trim();
		const sr = document.createElement("span");
		sr.className = "sr-only";
		sr.textContent = text;
		el.before(sr);
		el.setAttribute("aria-hidden", "true");
		if (reduce) return;
		el.textContent = "";
		await sleep(1000);
		for (const ch of text) {
			el.textContent += ch;
			if (ch !== " ") sound.key();
			await sleep(ch === "," ? 220 : rand(30, 75));
		}
	}

	function rotateRoles() {
		const el = $(".role");
		if (!el || reduce) return;
		const roles = ["builder", "b.tech student", "open-source tinkerer", "local-ai nerd", "idea compiler", "terminal dweller"];
		let i = 0;
		setInterval(() => {
			if (document.hidden) return;
			i = (i + 1) % roles.length;
			const node = el.firstChild || el.appendChild(document.createTextNode(""));
			scrambleNode(node, roles[i], 700);
		}, 2600);
	}

	if (!reduce) {
		(function glitchLoop() {
			setTimeout(() => {
				if (!document.hidden && scrollY < innerHeight) glitchHero();
				glitchLoop();
			}, rand(2600, 5600));
		})();
	}

	/* ---------- Variable-font letters that react to the cursor ---------- */
	const letters = $$(".hero-title .ch, .foot-giant .ch").map((el, i) => ({
		el,
		i,
		outline: Boolean(el.closest(".hero-line--outline")),
		cx: 0,
		cy: 0,
		w: 1000,
		s: 0,
		m: 0,
		drawn: -1,
	}));

	function measureLetters() {
		for (const l of letters) {
			const r = l.el.getBoundingClientRect();
			l.cx = r.left + r.width / 2 + scrollX;
			l.cy = r.top + r.height / 2 + scrollY;
		}
	}

	function updateLetters(t) {
		const vh = innerHeight;
		const idle = !fine || t - pointer.last > 3500;
		const radius = clamp(innerWidth * 0.2, 140, 380);
		for (const l of letters) {
			const sy = l.cy - scrollY;
			if (sy < -vh * 0.5 || sy > vh * 1.5) continue;
			let inf;
			if (idle) {
				inf = Math.pow(Math.sin(t * 0.0013 - l.i * 0.45) * 0.5 + 0.5, 4) * (fine ? 0.55 : 0.9);
			} else {
				const d = Math.hypot(pointer.x - (l.cx - scrollX), pointer.y - sy);
				inf = clamp(1 - d / radius, 0, 1);
				inf = inf * inf * (3 - 2 * inf);
			}
			l.w = lerp(l.w, 1000 - 720 * inf, 0.16);
			l.s = lerp(l.s, -15 * inf, 0.16);
			l.m = lerp(l.m, inf, 0.16);
			if (Math.abs(l.w - l.drawn) < 0.6) continue;
			l.drawn = l.w;
			const st = l.el.style;
			st.setProperty("--w", l.w.toFixed(0));
			st.setProperty("--s", l.s.toFixed(1));
			st.setProperty("--m", l.m.toFixed(2));
			st.setProperty("--c", (1 - l.m * 0.6).toFixed(2));
			if (l.outline) st.setProperty("--f", l.m.toFixed(2));
		}
	}

	/* ---------- Scroll velocity → RGB split everywhere ---------- */
	let lastRgb = -1;
	function updateFast() {
		const v = Math.round(clamp(Math.abs(scroll.smooth) * 0.4, 0, 14) * 2) / 2;
		if (v === lastRgb) return;
		lastRgb = v;
		root.style.setProperty("--rgb", v);
		root.classList.toggle("is-fast", v >= 1);
	}

	const gridEl = $(".fx-grid");
	function updateGrid() {
		if (!gridEl) return;
		const gx = (pointer.x / innerWidth - 0.5) * -24;
		const gy = -((scrollY * 0.15) % 96);
		gridEl.style.transform = `translate3d(${gx.toFixed(1)}px, ${gy.toFixed(1)}px, 0)`;
	}

	/* ---------- Visibility flags for the expensive bits ---------- */
	const visible = new Map();
	const visIO = new IntersectionObserver(
		(entries) => entries.forEach((en) => visible.set(en.target, en.isIntersecting)),
		{ rootMargin: "120px 0px" }
	);

	/* ---------- Marquees (speed + direction follow your scroll) ---------- */
	const marqueeWrap = $(".marquees");
	const marquees = $$(".marquee").map((m) => ({ track: $(".marquee-track", m), dir: parseFloat(m.dataset.dir) || 1, x: 0, half: 0 }));
	if (marqueeWrap) visIO.observe(marqueeWrap);

	function measureMarquees() {
		marquees.forEach((m) => (m.half = m.track.scrollWidth / 2));
	}

	function updateMarquees() {
		if (!visible.get(marqueeWrap)) return;
		const v = scroll.smooth;
		for (const m of marquees) {
			if (!m.half) continue;
			m.x -= (1.1 + Math.abs(v) * 0.6) * m.dir * scroll.dir;
			if (m.x <= -m.half) m.x += m.half;
			else if (m.x > 0) m.x -= m.half;
			m.track.style.transform = `translate3d(${m.x.toFixed(1)}px, 0, 0) skewX(${clamp(-v * 0.5, -14, 14).toFixed(1)}deg)`;
		}
	}

	/* ---------- 01 Statement: words light up as you scroll ---------- */
	const statement = $(".statement");
	let words = [];
	const stmt = { top: 0, h: 0, p: -1 };
	if (statement && !reduce) {
		textNodes(statement).forEach((node) => {
			const frag = document.createDocumentFragment();
			node.nodeValue.split(/(\s+)/).forEach((part) => {
				if (!part) return;
				if (/^\s+$/.test(part)) {
					frag.append(part);
					return;
				}
				const span = document.createElement("span");
				span.className = "w";
				span.textContent = part;
				span.style.opacity = "0.13";
				frag.append(span);
			});
			node.replaceWith(frag);
		});
		words = $$(".w", statement);
	}

	function measureStatement() {
		if (!statement) return;
		const r = statement.getBoundingClientRect();
		stmt.top = r.top + scrollY;
		stmt.h = r.height;
	}

	function updateStatement() {
		if (!words.length) return;
		const top = stmt.top - scrollY;
		if (top > innerHeight || top + stmt.h < 0) return;
		const p = clamp((innerHeight * 0.9 - top) / (stmt.h + innerHeight * 0.4), 0, 1);
		if (Math.abs(p - stmt.p) < 0.002) return;
		stmt.p = p;
		const n = words.length;
		words.forEach((w, i) => {
			w.style.opacity = (0.13 + clamp(p * n * 1.3 - i, 0, 1) * 0.87).toFixed(2);
		});
	}

	/* ---------- 02 Skills orb (3D tag sphere, draggable) ---------- */
	const sphere = (() => {
		const grid = $(".skills-grid");
		const el = $(".sphere");
		if (!grid || !el) return null;
		const tags = ["Python", "JavaScript", "C", "C++", "Rust", "Bash", "HTML", "CSS", "Ollama", "Hugging Face", "Git", "GitHub", "VS Code", "Vercel", "Firebase", "customtkinter", "local LLMs", "model training", "open source", "responsive UI", "vanilla JS", "LLM hosting"];
		const hot = new Set(["Python", "Rust", "Ollama", "local LLMs", "open source"]);
		const n = tags.length;
		const pts = tags.map((tag, i) => {
			const y = 1 - (i / (n - 1)) * 2;
			const r = Math.sqrt(1 - y * y);
			const theta = Math.PI * (3 - Math.sqrt(5)) * i;
			const span = document.createElement("span");
			span.className = "sphere-word" + (hot.has(tag) ? " is-hot" : "");
			span.textContent = tag;
			el.append(span);
			return { el: span, x: Math.cos(theta) * r, y, z: Math.sin(theta) * r, w: 0, h: 0 };
		});
		grid.classList.add("has-sphere");
		visIO.observe(el);

		let radius = 200;
		let vx = 0.0016; // rotation around the x axis, per frame
		let vy = 0.004; // rotation around the y axis, per frame
		let dragging = false;
		let hovering = false;
		let lastX = 0;
		let lastY = 0;

		function measure() {
			radius = el.clientWidth * 0.38;
			pts.forEach((p) => {
				p.w = p.el.offsetWidth;
				p.h = p.el.offsetHeight;
			});
		}

		function rotate(ay, ax) {
			const cy = Math.cos(ay);
			const sy = Math.sin(ay);
			const cx = Math.cos(ax);
			const sx = Math.sin(ax);
			for (const p of pts) {
				const x = p.x * cy + p.z * sy;
				let z = -p.x * sy + p.z * cy;
				const y = p.y * cx - z * sx;
				z = p.y * sx + z * cx;
				p.x = x;
				p.y = y;
				p.z = z;
			}
		}

		function render() {
			for (const p of pts) {
				const depth = (p.z + 1) / 2;
				const scale = 0.55 + depth * 0.6;
				p.el.style.transform = `translate3d(${(p.x * radius - p.w / 2).toFixed(1)}px, ${(p.y * radius - p.h / 2).toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
				p.el.style.opacity = (0.18 + depth * 0.82).toFixed(2);
				p.el.style.zIndex = String(Math.round(depth * 100));
			}
		}

		el.addEventListener("pointerdown", (e) => {
			dragging = true;
			lastX = e.clientX;
			lastY = e.clientY;
			el.setPointerCapture(e.pointerId);
		});
		el.addEventListener("pointermove", (e) => {
			if (!dragging) return;
			vy = (e.clientX - lastX) * 0.006;
			vx = -(e.clientY - lastY) * 0.006;
			lastX = e.clientX;
			lastY = e.clientY;
			if (reduce) {
				rotate(vy, vx);
				render();
			}
		});
		const stop = () => (dragging = false);
		el.addEventListener("pointerup", stop);
		el.addEventListener("pointercancel", stop);
		el.addEventListener("pointerenter", () => (hovering = true));
		el.addEventListener("pointerleave", () => (hovering = false));

		return {
			measure() {
				measure();
				render();
			},
			update() {
				if (!visible.get(el)) return;
				if (!dragging) {
					let ty = 0.004;
					let tx = 0.0016;
					if (hovering && fine) {
						const r = el.getBoundingClientRect();
						ty = ((pointer.x - r.left) / r.width - 0.5) * 0.04;
						tx = -((pointer.y - r.top) / r.height - 0.5) * 0.04;
					}
					vy = lerp(vy, ty, 0.04);
					vx = lerp(vx, tx, 0.04);
				}
				rotate(vy, vx);
				render();
			},
		};
	})();

	/* ---------- 03 Work: horizontal scroll, tilt, live screens ---------- */
	const work = $(".work");
	const workSticky = $(".work-sticky");
	const track = $(".work-track");
	const cards = $$(".work-track .card");
	const workBar = $(".work-progress");
	const workCount = $(".work-count b");
	const ws = { on: false, top: 0, dist: 0, x: 0 };

	function layoutWork() {
		if (!work || !track || !workSticky) return;
		const want = !reduce && innerWidth >= 1000 && innerHeight >= 560;
		work.classList.toggle("is-horizontal", want);
		ws.on = want;
		if (!want) {
			work.style.height = "";
			track.style.transform = "";
			return;
		}
		const cs = getComputedStyle(workSticky);
		const visibleWidth = workSticky.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
		ws.dist = Math.max(0, track.scrollWidth - visibleWidth);
		work.style.height = Math.round(ws.dist + innerHeight) + "px";
		ws.top = work.getBoundingClientRect().top + scrollY;
	}

	function updateWork() {
		if (!ws.on) return;
		const p = ws.dist ? clamp((scrollY - ws.top) / ws.dist, 0, 1) : 0;
		const target = -p * ws.dist;
		ws.x = Math.abs(target - ws.x) < 0.3 ? target : lerp(ws.x, target, 0.14);
		track.style.transform = `translate3d(${ws.x.toFixed(1)}px, 0, 0)`;
		if (workBar) workBar.style.setProperty("--p", p.toFixed(4));
		if (workCount) {
			const n = String(Math.min(cards.length, Math.floor(p * cards.length * 0.999) + 1)).padStart(2, "0");
			if (workCount.textContent !== n) workCount.textContent = n;
		}
	}

	// Keyboard users: tabbing into a card scrolls the page to it
	if (track) {
		track.addEventListener("focusin", (e) => {
			if (!ws.on) return;
			const card = e.target.closest(".card");
			if (!card) return;
			requestAnimationFrame(() => (workSticky.scrollLeft = 0));
			const padLeft = parseFloat(getComputedStyle(workSticky).paddingLeft);
			const p = clamp((card.offsetLeft - padLeft) / ws.dist, 0, 1);
			ws.x = -p * ws.dist;
			window.scrollTo({ top: ws.top + p * ws.dist, behavior: "instant" });
		});
	}

	if (fine && !reduce) {
		cards.forEach((card) => {
			const inner = $(".card-inner", card);
			card.addEventListener("pointermove", (e) => {
				const r = card.getBoundingClientRect();
				const px = (e.clientX - r.left) / r.width;
				const py = (e.clientY - r.top) / r.height;
				inner.style.transition = "transform 0.12s ease-out";
				inner.style.transform = `perspective(1400px) rotateX(${((0.5 - py) * 7).toFixed(2)}deg) rotateY(${((px - 0.5) * 9).toFixed(2)}deg)`;
				card.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
				card.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
			});
			card.addEventListener("pointerleave", () => {
				inner.style.transition = "";
				inner.style.transform = "";
			});
		});
	}

	function runKavach(screen) {
		screen.dataset.state = "idle";
		setTimeout(() => (screen.dataset.state = "scan"), 700);
		setTimeout(() => (screen.dataset.state = "done"), 2300);
	}

	function runClean(screen) {
		screen.dataset.state = "idle";
		void screen.offsetWidth;
		requestAnimationFrame(() => {
			screen.dataset.state = "run";
			setTimeout(() => (screen.dataset.state = "done"), 2100);
		});
	}

	function startCard(card) {
		if (card._loop || reduce) return;
		const kavach = $(".screen--kavach", card);
		const clean = $(".screen--clean", card);
		const palette = $(".scr-palette", card);
		const play = () => {
			if (kavach) runKavach(kavach);
			if (clean) runClean(clean);
		};
		play();
		card._loop = setInterval(play, 7000);
		if (palette) {
			const items = $$("li", palette);
			let i = 0;
			card._pal = setInterval(() => {
				i = (i + 1) % items.length;
				items.forEach((li, j) => li.classList.toggle("is-sel", j === i));
			}, 900);
		}
	}

	function stopCard(card) {
		clearInterval(card._loop);
		clearInterval(card._pal);
		card._loop = card._pal = 0;
	}

	const cardIO = new IntersectionObserver(
		(entries) => entries.forEach((en) => (en.isIntersecting ? startCard(en.target) : stopCard(en.target))),
		{ threshold: 0.45 }
	);
	cards.forEach((card) => cardIO.observe(card));

	/* ---------- 04 Log: hashes scramble on hover ---------- */
	$$(".commit").forEach((commit) => {
		const hash = $(".hash", commit);
		if (hash) commit.addEventListener("pointerenter", () => scramble(hash, 380));
	});

	/* ---------- Keycaps press when you type their first letter ---------- */
	const keycaps = $$(".keys li");
	keycaps.forEach((li) => li.addEventListener("pointerenter", () => sound.key()));
	addEventListener("keydown", (e) => {
		if (e.target.closest && e.target.closest("input, textarea")) return;
		if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;
		const k = e.key.toLowerCase();
		const hits = keycaps.filter((li) => li.textContent.trim().toLowerCase().startsWith(k));
		hits.forEach((li) => {
			li.classList.add("is-pressed");
			setTimeout(() => li.classList.remove("is-pressed"), 160);
		});
		if (hits.length) sound.key();
	});

	/* ---------- Matrix rain ---------- */
	const matrix = (() => {
		const canvas = $(".fx-matrix");
		if (!canvas) return { start() {} };
		const ctx = canvas.getContext("2d");
		const chars = "01アイウエオカキクケコサシスセソタチツテト<>{}[]/\\=+*#";
		let cols = [];
		let until = 0;
		let running = false;
		let size = 16;
		let color = "#c6ff3d";

		function draw(now) {
			ctx.fillStyle = "rgba(0, 0, 0, 0.09)";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = color;
			ctx.font = size + "px Recursive, monospace";
			for (let i = 0; i < cols.length; i++) {
				ctx.fillText(chars[(Math.random() * chars.length) | 0], i * size, cols[i] * size);
				cols[i] = cols[i] * size > canvas.height && Math.random() > 0.975 ? 0 : cols[i] + 1;
			}
			if (now < until) requestAnimationFrame(draw);
			else {
				running = false;
				canvas.classList.remove("is-on");
				setTimeout(() => ctx.clearRect(0, 0, canvas.width, canvas.height), 700);
			}
		}

		return {
			start(ms = 7000) {
				if (reduce) {
					toast("matrix skipped: reduced motion is on");
					return;
				}
				canvas.width = innerWidth;
				canvas.height = innerHeight;
				size = innerWidth < 600 ? 13 : 16;
				color = getComputedStyle(root).getPropertyValue("--accent").trim() || color;
				cols = Array.from({ length: Math.ceil(innerWidth / size) }, () => Math.floor(rand(-50, 0)));
				until = performance.now() + ms;
				canvas.classList.add("is-on");
				if (!running) {
					running = true;
					requestAnimationFrame(draw);
				}
			},
		};
	})();

	/* ---------- 05 Shell ---------- */
	(() => {
		const term = $(".term");
		const out = $(".term-out");
		const form = $(".term-form");
		const input = $(".term-in");
		if (!term || !out || !form || !input) return;

		const past = [];
		let cursorAt = 0;

		const print = (text, cls) => {
			const p = document.createElement("p");
			if (cls) p.className = cls;
			p.textContent = text;
			out.append(p);
			return p;
		};
		// Only ever called with the fixed markup below, never with user input
		const printHTML = (markup) => {
			const div = document.createElement("div");
			div.innerHTML = markup;
			out.append(div);
		};
		const down = () => (out.scrollTop = out.scrollHeight);
		const openUrl = (url) => window.open(url, "_blank", "noopener");

		const links = {
			kavach: "https://github.com/diipanshuuuu/Kavach",
			"nst-sdc": "https://nst-sdc-site-ten.vercel.app",
			syscleanx: "https://github.com/htmnsrc/SysCleanX",
			github: "https://github.com/diipanshuuuu",
			linkedin: LINKEDIN,
			resume: "resume.pdf",
		};

		async function hireMe() {
			input.disabled = true;
			const steps = [
				["[sudo] password for guest: ********", ""],
				["verifying credentials .............. ok", "dim"],
				["checking vibes ..................... immaculate", "dim"],
				["permission granted.", "acc"],
			];
			for (const [text, cls] of steps) {
				print(text, cls);
				down();
				sound.key();
				await sleep(420);
			}
			flash();
			shake();
			sound.up();
			const r = term.getBoundingClientRect();
			burst(r.left + r.width / 2, r.top + r.height / 2, 140);
			copyEmail(null, { quiet: true });
			print("→ " + EMAIL + " copied to your clipboard. let's build something crazy.", "acc");
			input.disabled = false;
			input.focus({ preventScroll: true });
			down();
		}

		const commands = {
			help() {
				printHTML(`<pre><b>about</b>         who is this
<b>skills</b>        the toolbox
<b>projects</b>      things i've built   (open &lt;name&gt; to visit)
<b>contact</b>       copy my email
<b>github</b> · <b>linkedin</b> · <b>resume</b>
<b>neofetch</b>      system info, obviously
<b>mode</b>          acid · inferno · ice · paper
<b>sound</b>         on · off
<b>matrix</b>        follow the white rabbit
<b>clear</b>         wipe the screen
<b>sudo hire-me</b>  you know you want to</pre>`);
			},
			about() {
				print("Dipanshu Singh: first-year B.Tech CSE (AI & ML) at Newton School of Technology, based in Ayodhya.");
				print("into open source, software dev, and self-hosting / training AI models with Ollama & Hugging Face.", "dim");
			},
			whoami() {
				print("guest. but you could be my next teammate → sudo hire-me", "dim");
			},
			skills() {
				print("languages  python · javascript · c · c++ · rust · bash");
				print("web        html · css · javascript · responsive ui");
				print("ai / ml    ollama · hugging face · local llms · model training");
				print("tools      git · github · vs code · vercel · firebase");
			},
			projects() {
				print("kavach      local privacy shield for ai chats");
				print("nst-sdc     vanilla redesign of my college dev club site");
				print("syscleanx   windows pc cleaner + app uninstaller");
				print("type: open <name>", "dim");
			},
			open(args) {
				const key = (args[0] || "").toLowerCase();
				if (!links[key]) {
					print("usage: open kavach | nst-sdc | syscleanx | github | linkedin | resume", "err");
					return;
				}
				print("opening " + key + " ↗", "acc");
				openUrl(links[key]);
			},
			contact() {
				copyEmail();
				print("copied " + EMAIL + " to your clipboard. say hi.", "acc");
			},
			github: () => commands.open(["github"]),
			linkedin: () => commands.open(["linkedin"]),
			resume: () => commands.open(["resume"]),
			neofetch() {
				printHTML(`<div class="neo"><pre class="neo-art">     _
  __| |
 / _\` |
| (_| | _
 \\__,_|(_)</pre><pre><b>guest</b>@<b>dipanshu</b>
---------------
<b>os</b>      DipanshuOS 26.10 (ideas-compiler)
<b>host</b>    ayodhya, in
<b>kernel</b>  b.tech-cse-ai-ml (year 1)
<b>uptime</b>  building since 2025
<b>shell</b>   zsh (vanilla, no frameworks)
<b>langs</b>   python js c c++ rust bash
<b>ai</b>      ollama · hugging face
<b>status</b>  open to work
<span class="neo-colors"><i style="background:#050607"></i><i style="background:var(--accent)"></i><i style="background:var(--accent-2)"></i><i style="background:var(--accent-3)"></i><i style="background:#f1f3ee"></i></span></pre></div>`);
			},
			mode(args) {
				if (!args[0]) {
					print("current: " + root.dataset.mode + " · available: " + MODES.join(" "), "dim");
					return;
				}
				if (!setMode(args[0])) print("unknown mode: " + args[0], "err");
				else print("mode → " + root.dataset.mode, "acc");
			},
			sound(args) {
				const v = (args[0] || "").toLowerCase();
				if (v !== "on" && v !== "off") {
					print("usage: sound on | off", "dim");
					return;
				}
				sound.set(v === "on");
				print("sound " + v, "acc");
			},
			matrix() {
				print("wake up, guest…", "acc");
				matrix.start();
			},
			sudo(args) {
				if (args[0] === "hire-me" || args.join(" ") === "hire me") {
					hireMe();
					return;
				}
				if (args[0] === "rm") {
					commands.rm(args.slice(1));
					return;
				}
				print("guest is not in the sudoers file. this incident will be reported.", "err");
				sound.error();
			},
			"hire-me"() {
				print("permission denied. try: sudo hire-me", "err");
				sound.error();
			},
			rm(args) {
				if (args.join(" ").includes("-rf")) {
					print("nice try.", "err");
					shake();
					glitchHero();
				} else {
					print("rm: refusing to delete ideas", "err");
				}
				sound.error();
			},
			ls() {
				print("projects/   skills.txt   resume.pdf   ideas/   .secrets");
			},
			cat(args) {
				const file = (args[0] || "").toLowerCase();
				if (file === "skills.txt") commands.skills();
				else if (file === "resume.pdf") print("binary file. try: resume", "dim");
				else if (file === ".secrets") print("↑ ↑ ↓ ↓ ← → ← → b a", "acc");
				else if (file.startsWith("ideas")) print("cat: ideas/: too many to list", "err");
				else if (file.startsWith("projects")) commands.projects();
				else print("cat: " + (args[0] || "") + ": no such file", "err");
			},
			cd: () => print("you're already home.", "dim"),
			pwd: () => print("/home/guest/dipanshu"),
			date: () => print(new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "medium" }) + " (ist)"),
			echo: (args) => print(args.join(" ")),
			ping: () => print("pong — 0.1ms (we're both local)", "acc"),
			coffee: () => print("brewing… done. +10 focus, -2 sleep.", "acc"),
			history: () => past.forEach((c, i) => print(String(i + 1).padStart(3, " ") + "  " + c)),
			clear: () => out.replaceChildren(),
			exit() {
				print("there is no escape.", "err");
				glitchHero();
				shake();
			},
		};
		const aliases = { "?": "help", man: "help", work: "projects", hire: "hire-me", info: "neofetch", cls: "clear", email: "contact", mail: "contact" };

		function run(raw) {
			const line = raw.trim();
			print(line, "echo");
			if (line) {
				past.push(line);
				const [first, ...args] = line.split(/\s+/);
				const name = first.toLowerCase();
				const fn = commands[aliases[name] || name];
				if (fn) fn(args);
				else {
					print("zsh: command not found: " + first + " (try help)", "err");
					sound.error();
				}
			}
			cursorAt = past.length;
			down();
		}

		form.addEventListener("submit", (e) => {
			e.preventDefault();
			run(input.value);
			input.value = "";
		});

		input.addEventListener("keydown", (e) => {
			if (e.key === "ArrowUp" && past.length) {
				e.preventDefault();
				cursorAt = Math.max(0, cursorAt - 1);
				input.value = past[cursorAt] || "";
			} else if (e.key === "ArrowDown" && past.length) {
				e.preventDefault();
				cursorAt = Math.min(past.length, cursorAt + 1);
				input.value = past[cursorAt] || "";
			} else if (e.key === "Tab" && input.value.trim()) {
				const v = input.value.trim().toLowerCase();
				const hit = Object.keys(commands).find((c) => c.startsWith(v) && c !== v);
				if (hit) {
					e.preventDefault();
					input.value = hit + " ";
				}
			} else if (e.key.length === 1) {
				sound.key();
			}
		});

		term.addEventListener("click", (e) => {
			if (e.target.closest("a, input")) return;
			const sel = getSelection();
			if (sel && !sel.isCollapsed) return;
			input.focus({ preventScroll: true });
		});
	})();

	/* ---------- Konami code → god mode ---------- */
	const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
	let konamiAt = 0;
	addEventListener("keydown", (e) => {
		const k = e.key.toLowerCase();
		konamiAt = k === KONAMI[konamiAt] ? konamiAt + 1 : k === KONAMI[0] ? 1 : 0;
		if (konamiAt < KONAMI.length) return;
		konamiAt = 0;
		toast("god mode unlocked");
		sound.up();
		flash();
		shake();
		matrix.start(5000);
		burst(innerWidth / 2, innerHeight / 2, 160);
		root.classList.add("is-god");
		setTimeout(() => root.classList.remove("is-god"), 8000);
	});

	/* ---------- HUD: clock, section, scroll ---------- */
	const clockEl = $(".hud-clock");
	if (clockEl) {
		const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
		const tickClock = () => (clockEl.textContent = "ayd " + fmt.format(new Date()) + " ist");
		tickClock();
		setInterval(tickClock, 1000);
	}

	const sectionEl = $(".hud-section");
	const navLinks = $$(".hud-nav a");
	const sectionIO = new IntersectionObserver(
		(entries) => {
			entries.forEach((en) => {
				if (!en.isIntersecting) return;
				const s = en.target;
				if (sectionEl) {
					const b = document.createElement("b");
					b.textContent = s.dataset.section;
					sectionEl.replaceChildren(b, "/06 " + s.dataset.name);
				}
				navLinks.forEach((a) => {
					if (a.hash === "#" + s.id) a.setAttribute("aria-current", "true");
					else a.removeAttribute("aria-current");
				});
			});
		},
		{ rootMargin: "-45% 0px -50% 0px" }
	);
	$$("[data-section]").forEach((s) => sectionIO.observe(s));

	const progress = $(".progress");
	const scrollLabel = $(".hud-scroll");
	function onScroll() {
		const max = root.scrollHeight - innerHeight;
		const p = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
		if (progress) progress.style.setProperty("--p", p.toFixed(4));
		if (scrollLabel) scrollLabel.textContent = "scroll " + String(Math.round(p * 100)).padStart(3, "0") + "%";
	}
	addEventListener("scroll", onScroll, { passive: true });

	/* ---------- Menu (small screens) ---------- */
	const menuBtn = $(".menu-btn");
	const menu = $("#menu");
	function setMenu(open) {
		if (!menu || !menuBtn) return;
		menuBtn.setAttribute("aria-expanded", String(open));
		menuBtn.textContent = open ? "close" : "menu";
		if (open) {
			menu.hidden = false;
			void menu.offsetWidth;
			menu.classList.add("is-open");
			root.style.overflow = "hidden";
			$("a", menu).focus({ preventScroll: true });
		} else {
			menu.classList.remove("is-open");
			root.style.overflow = "";
			setTimeout(() => {
				if (!menu.classList.contains("is-open")) menu.hidden = true;
			}, reduce ? 0 : 750);
		}
	}
	if (menuBtn) menuBtn.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"));
	if (menu) menu.addEventListener("click", (e) => e.target.closest("a") && setMenu(false));
	addEventListener("keydown", (e) => {
		if (e.key === "Escape" && menuBtn && menuBtn.getAttribute("aria-expanded") === "true") {
			setMenu(false);
			menuBtn.focus();
		}
	});

	/* ---------- Reveal fallback (browsers without scroll-driven animations) ---------- */
	if (!reduce && !CSS.supports("animation-timeline: view()")) {
		const els = $$(".sec-head, .fact, .stack-group, .commit, .term, .contact-title .ct-line, .mega-email, .row-link, .gitlog");
		const revealIO = new IntersectionObserver(
			(entries) =>
				entries.forEach((en) => {
					if (!en.isIntersecting) return;
					en.target.classList.add("is-in");
					revealIO.unobserve(en.target);
				}),
			{ rootMargin: "0px 0px -8% 0px" }
		);
		els.forEach((el) => {
			el.classList.add("rv");
			revealIO.observe(el);
		});
	}

	/* ---------- Tab title + console hello ---------- */
	const baseTitle = document.title;
	document.addEventListener("visibilitychange", () => {
		document.title = document.hidden ? "come back — ideas still compiling…" : baseTitle;
	});
	console.log("%c d. %c ideas, compiled ", "background:#c6ff3d;color:#050607;font:900 20px monospace;padding:4px 8px", "font:14px monospace");
	console.log("you opened devtools, so you're my kind of person. say hi → " + EMAIL);

	/* ---------- WebGL: dithered, cursor-swirled plasma ---------- */
	gl = (() => {
		const canvas = $(".fx-gl");
		if (!canvas) return null;
		const ctx = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: "low-power" });
		if (!ctx) return null;

		const vertex = "attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }";
		const fragment = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uScroll;
uniform float uVel;
uniform float uDim;
uniform vec3 uBg;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;

float hash(vec2 p) {
	vec3 p3 = fract(vec3(p.xyx) * 0.1031);
	p3 += dot(p3, p3.yzx + 33.33);
	return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
	float v = 0.0;
	float a = 0.5;
	mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
	for (int i = 0; i < 5; i++) {
		v += a * noise(p);
		p = m * p;
		a *= 0.5;
	}
	return v;
}

float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

void main() {
	vec2 frag = gl_FragCoord.xy;
	vec2 uv = frag / uRes;
	vec2 p = (frag - 0.5 * uRes) / uRes.y;
	vec2 m = (uMouse - 0.5 * uRes) / uRes.y;
	float t = uTime * 0.06;
	float speed = clamp(abs(uVel) * 0.02, 0.0, 1.0);

	// swirl the field around the cursor; scrolling fast stretches it
	vec2 d = p - m;
	float r = length(d);
	float sw = (1.8 + speed * 2.0) * exp(-r * r * 4.0);
	float cs = cos(sw);
	float sn = sin(sw);
	p = m + mat2(cs, -sn, sn, cs) * d;
	p.y = p.y * (1.0 + speed * 0.8) - uScroll * 0.0004;

	vec2 q = vec2(fbm(p * 1.4 + vec2(0.0, t)), fbm(p * 1.4 + vec2(5.2, -t)));
	vec2 w = vec2(fbm(p * 1.4 + 3.6 * q + vec2(1.7, 9.2) + 1.3 * t), fbm(p * 1.4 + 3.6 * q + vec2(8.3, 2.8) - t));
	float f = fbm(p * 1.4 + 3.2 * w);

	// ordered dithering on the blend weights keeps the background colour exact
	float th = bayer8(frag);
	float k1 = floor(smoothstep(0.40, 0.80, f) * 3.0 + th) / 3.0;
	float k2 = floor(smoothstep(0.58, 0.92, f * 0.55 + w.x * 0.65) * 3.0 + th) / 3.0;
	float k3 = floor(smoothstep(0.72, 1.0, q.y + 0.3 * f) * 2.0 + th) / 2.0;

	vec3 col = uBg;
	col = mix(col, mix(uBg, uC, 0.5), k1 * 0.75);
	col = mix(col, uA, k2 * 0.9);
	col = mix(col, uB, k3 * 0.6);

	float ridge = 1.0 - smoothstep(0.0, 0.022, abs(f - 0.6));
	col = mix(col, uA, step(1.0 - ridge, th) * 0.85);

	float glow = exp(-r * r * 14.0);
	col = mix(col, uA, step(1.0 - glow * 0.85, th) * 0.7);

	vec2 vv = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
	float vig = smoothstep(1.2, 0.2, length(vv));
	float keep = clamp(uDim * mix(0.35, 1.0, vig), 0.0, 1.0);
	keep = floor(keep * 4.0 + th) / 4.0;
	col = mix(uBg, col, keep);

	gl_FragColor = vec4(col, 1.0);
}`;

		function compile(type, src) {
			const shader = ctx.createShader(type);
			ctx.shaderSource(shader, src);
			ctx.compileShader(shader);
			if (!ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)) {
				console.warn(ctx.getShaderInfoLog(shader));
				return null;
			}
			return shader;
		}

		const vs = compile(ctx.VERTEX_SHADER, vertex);
		const fs = compile(ctx.FRAGMENT_SHADER, fragment);
		if (!vs || !fs) return null;
		const program = ctx.createProgram();
		ctx.attachShader(program, vs);
		ctx.attachShader(program, fs);
		ctx.linkProgram(program);
		if (!ctx.getProgramParameter(program, ctx.LINK_STATUS)) return null;
		ctx.useProgram(program);

		const buffer = ctx.createBuffer();
		ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer);
		ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), ctx.STATIC_DRAW);
		const loc = ctx.getAttribLocation(program, "p");
		ctx.enableVertexAttribArray(loc);
		ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);

		const U = {};
		["uRes", "uTime", "uMouse", "uScroll", "uVel", "uDim", "uBg", "uA", "uB", "uC"].forEach((name) => (U[name] = ctx.getUniformLocation(program, name)));

		function color(name) {
			const raw = getComputedStyle(root).getPropertyValue(name).trim();
			let hex = raw.replace("#", "");
			if (hex.length === 3) hex = hex.replace(/./g, "$&$&");
			const n = parseInt(hex, 16);
			if (Number.isNaN(n) || hex.length !== 6) return [0, 0, 0];
			return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
		}

		let mx = 0.5;
		let my = 0.4;
		let lost = false;

		function resize() {
			const scale = 3; // chunky pixels, upscaled with image-rendering: pixelated
			canvas.width = Math.ceil(innerWidth / scale);
			canvas.height = Math.ceil(innerHeight / scale);
			ctx.viewport(0, 0, canvas.width, canvas.height);
			ctx.uniform2f(U.uRes, canvas.width, canvas.height);
			if (reduce) render(4000);
		}

		function recolor() {
			ctx.uniform3fv(U.uBg, color("--bg"));
			ctx.uniform3fv(U.uA, color("--accent"));
			ctx.uniform3fv(U.uB, color("--accent-2"));
			ctx.uniform3fv(U.uC, color("--accent-3"));
			if (reduce) render(4000);
		}

		function render(t) {
			if (lost) return;
			mx = lerp(mx, pointer.x / innerWidth, 0.06);
			my = lerp(my, pointer.y / innerHeight, 0.06);
			ctx.uniform1f(U.uTime, t / 1000);
			ctx.uniform2f(U.uMouse, mx * canvas.width, (1 - my) * canvas.height);
			ctx.uniform1f(U.uScroll, scrollY);
			ctx.uniform1f(U.uVel, scroll.smooth);
			ctx.uniform1f(U.uDim, clamp(1 - scrollY / (innerHeight * 1.2), 0.32, 1));
			ctx.drawArrays(ctx.TRIANGLES, 0, 3);
		}

		canvas.addEventListener("webglcontextlost", (e) => {
			e.preventDefault();
			lost = true;
			canvas.classList.remove("is-on");
		});

		resize();
		recolor();
		render(4000);
		requestAnimationFrame(() => canvas.classList.add("is-on"));
		return { render, recolor, resize };
	})();

	/* ---------- Measure + the one animation loop ---------- */
	function measureAll() {
		layoutWork();
		measureLetters();
		measureMarquees();
		measureStatement();
		if (sphere) sphere.measure();
		onScroll();
	}

	let resizeTimer = 0;
	addEventListener("resize", () => {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => {
			measureAll();
			if (gl) gl.resize();
		}, 150);
	});

	let raf = 0;
	let lastScrollY = scrollY;
	let frameCount = 0;

	function frame(t) {
		const y = scrollY;
		scroll.vel = y - lastScrollY;
		lastScrollY = y;
		if (scroll.vel) scroll.dir = Math.sign(scroll.vel);
		scroll.smooth = lerp(scroll.smooth, scroll.vel, 0.12);

		if (cursor) cursor.update();
		updateFast();
		updateGrid();
		updateLetters(t);
		updateMarquees();
		updateStatement();
		if (sphere) sphere.update();
		updateWork();
		if (gl) gl.render(t);

		if (++frameCount % 45 === 0) {
			measureLetters();
			measureStatement();
		}
		raf = document.hidden ? 0 : requestAnimationFrame(frame);
	}

	document.addEventListener("visibilitychange", () => {
		if (!document.hidden && !raf && !reduce) raf = requestAnimationFrame(frame);
	});

	measureAll();
	if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureAll);
	addEventListener("load", measureAll);
	if (!reduce) raf = requestAnimationFrame(frame);

	rotateRoles();
	boot().then(typeTagline);
})();

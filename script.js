/* Progressive enhancement only: the page works fully without this file. */
(function () {
	var root = document.documentElement;
	root.classList.add("js");

	var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
	var EMAIL = "diipupc@gmail.com";

	// Replaced by the sparks section below when motion is allowed
	var celebrate = function () {};

	/* ---------- Theme toggle: the new theme grows out of the button ---------- */
	var toggle = document.querySelector(".theme-toggle");
	var themeColor = document.querySelector('meta[name="theme-color"]');

	function applyTheme(theme) {
		root.dataset.theme = theme;
		if (themeColor) themeColor.content = theme === "light" ? "#fdf6e3" : "#08090a";
	}

	applyTheme(root.dataset.theme || "dark");

	toggle.addEventListener("click", function () {
		var next = root.dataset.theme === "light" ? "dark" : "light";
		try {
			localStorage.setItem("theme", next);
		} catch (e) {}

		if (!document.startViewTransition || reduceMotion) {
			applyTheme(next);
			return;
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
	});

	/* ---------- Copy email ---------- */
	var copyBtn = document.querySelector(".copy-email");
	var copyStatus = document.querySelector("[data-copy-status]");
	var copyTimer;

	copyBtn.addEventListener("click", function () {
		if (!navigator.clipboard) {
			window.location.href = "mailto:" + EMAIL;
			return;
		}
		navigator.clipboard.writeText(EMAIL).then(function () {
			copyBtn.classList.add("is-copied");
			copyStatus.textContent = "Email copied to clipboard";
			clearTimeout(copyTimer);
			copyTimer = setTimeout(function () {
				copyBtn.classList.remove("is-copied");
				copyStatus.textContent = "";
			}, 2000);
		});
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
	var ACCENTS = ["green", "orange", "blue", "pink"];

	function currentAccent() {
		return ACCENTS.indexOf(root.dataset.accent) > 0 ? root.dataset.accent : "green";
	}

	function setAccent(name) {
		if (ACCENTS.indexOf(name) === -1) return false;
		if (name === "green") delete root.dataset.accent;
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
		toast("secret unlocked · accent → " + next);
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
			kavach: "https://github.com/diipanshuuuu/Kavach",
			"nst-sdc": "https://nst-sdc-site-ten.vercel.app",
			syscleanx: "https://github.com/htmnsrc/SysCleanX",
			github: "https://github.com/diipanshuuuu",
			linkedin: "https://www.linkedin.com/in/dipanshu-singh-86b2ba444/",
			resume: "resume.pdf"
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

		var openShell = function () {
			if (!shell.hidden) return;
			opener = document.activeElement;
			shell.hidden = false;
			document.body.style.overflow = "hidden";
			shellIn.focus();
			scrollShell();
		};

		var closeShell = function () {
			if (shell.hidden) return;
			shell.hidden = true;
			document.body.style.overflow = "";
			if (opener && opener.focus) opener.focus({ preventScroll: true });
		};

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
							print("→ " + EMAIL + " copied to your clipboard. let's build something.", "acc");
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

		var commands = {
			help: function () {
				printHTML(
					"<pre><b>about</b>         who is this\n" +
						"<b>projects</b>      things i've built (open &lt;name&gt; to visit)\n" +
						"<b>skills</b>        the toolbox\n" +
						"<b>contact</b>       copy my email\n" +
						"<b>neofetch</b>      system info, obviously\n" +
						"<b>theme</b>         flip light / dark\n" +
						"<b>accent</b>        green · orange · blue · pink\n" +
						"<b>clear</b>         wipe the screen\n" +
						"<b>exit</b>          back to the page\n" +
						"<b>sudo hire-me</b>  you know you want to</pre>"
				);
			},
			about: function () {
				print("Dipanshu Singh: first-year B.Tech CSE (AI & ML) at Newton School of Technology, based in Ayodhya.");
				print("into open source, software dev, and self-hosting / training AI models with Ollama & Hugging Face.", "dim");
			},
			whoami: function () {
				print("guest. but you could be my next teammate → sudo hire-me", "dim");
			},
			projects: function () {
				print("kavach      local privacy shield for ai chats");
				print("nst-sdc     vanilla redesign of my college's dev club site");
				print("syscleanx   windows pc cleaner + app uninstaller");
				print("type: open <name>", "dim");
			},
			skills: function () {
				print("languages  python · javascript · c · c++ · rust · bash");
				print("web        html · css · javascript · responsive ui");
				print("ai / ml    ollama · hugging face · local llms · model training");
				print("tools      git · github · vs code · vercel");
			},
			open: function (args) {
				var key = (args[0] || "").toLowerCase();
				if (!LINKS[key]) {
					print("usage: open kavach | nst-sdc | syscleanx | github | linkedin | resume", "err");
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
						"<b>os</b>      ideas-compiler 26.10\n" +
						"<b>host</b>    ayodhya, in\n" +
						"<b>kernel</b>  b.tech-cse-ai-ml (year 1)\n" +
						"<b>uptime</b>  building since 2025\n" +
						"<b>shell</b>   vanilla html, css & js\n" +
						"<b>status</b>  open to work\n" +
						'<span class="neo-colors"><i style="background:#22c55e"></i><i style="background:#fb923c"></i><i style="background:#38bdf8"></i><i style="background:#f472b6"></i><i style="background:#e0e2e8"></i></span></pre></div>'
				);
			},
			theme: function () {
				toggle.click();
				print("theme → " + (root.dataset.theme === "light" ? "dark" : "light"), "acc");
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
					print("rm: refusing to delete ideas", "err");
					return;
				}
				print("nice try.", "err");
				shellWindow.classList.remove("is-shaking");
				void shellWindow.offsetWidth;
				shellWindow.classList.add("is-shaking");
			},
			ls: function () {
				print("projects/   skills.txt   resume.pdf   ideas/   .secrets");
			},
			cat: function (args) {
				var file = (args[0] || "").toLowerCase();
				if (file === "skills.txt") commands.skills();
				else if (file === ".secrets") print("↑ ↑ ↓ ↓ ← → ← → b a (try it on the page)", "acc");
				else if (file === "resume.pdf") print("binary file. try: resume", "dim");
				else if (file.indexOf("ideas") === 0) print("cat: ideas/: too many to list", "err");
				else print("cat: " + (args[0] || "") + ": no such file", "err");
			},
			cd: function () {
				print("you're already home.", "dim");
			},
			pwd: function () {
				print("/home/guest/dipanshu");
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
		var ALIASES = { "?": "help", man: "help", work: "projects", hire: "hire-me", email: "contact", cls: "clear", quit: "exit" };

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
				var typed = shellIn.value.trim().toLowerCase();
				var match = Object.keys(commands).filter(function (c) {
					return c.indexOf(typed) === 0 && c !== typed;
				})[0];
				if (match) {
					e.preventDefault();
					shellIn.value = match + " ";
				}
			}
		});

		// Keep focus inside the dialog
		shell.addEventListener("keydown", function (e) {
			if (e.key !== "Tab" || e.defaultPrevented) return;
			if (e.shiftKey && document.activeElement === shellClose) {
				e.preventDefault();
				shellIn.focus();
			} else if (!e.shiftKey && document.activeElement === shellIn) {
				e.preventDefault();
				shellClose.focus();
			}
		});

		window.addEventListener("keydown", function (e) {
			if (!shell.hidden && e.key === "Escape") {
				e.preventDefault();
				closeShell();
				return;
			}
			if (!shell.hidden || e.metaKey || e.ctrlKey || e.altKey) return;
			if (e.key !== "/" && e.key !== "`") return;
			if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
			e.preventDefault();
			openShell();
		});

		if (shellHint) shellHint.addEventListener("click", openShell);
		shellClose.addEventListener("click", closeShell);
		shell.addEventListener("click", function (e) {
			if (e.target === shell) closeShell();
		});
		shellOut.addEventListener("click", function () {
			var selection = window.getSelection();
			if (!selection || selection.isCollapsed) shellIn.focus({ preventScroll: true });
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

	/* ---------- Tab title + a hello for whoever opens devtools ---------- */
	var baseTitle = document.title;
	document.addEventListener("visibilitychange", function () {
		document.title = document.hidden ? "come back, ideas still compiling…" : baseTitle;
	});
	console.log("%c d. %c ideas, compiled ", "background:#22c55e;color:#08090a;font:700 16px monospace;padding:2px 6px", "font:13px monospace");
	console.log("you opened devtools, so you're my kind of person. press / on the page, or say hi → " + EMAIL);

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

	/* ---------- Cursor spotlight + dot grid: eases toward the pointer, idles when settled ---------- */
	if (finePointer) {
		var spotlight = document.querySelector(".spotlight");
		var targetX = innerWidth / 2;
		var targetY = innerHeight / 3;
		var currentX = targetX;
		var currentY = targetY;
		var frame = 0;

		function follow() {
			currentX += (targetX - currentX) * 0.18;
			currentY += (targetY - currentY) * 0.18;
			spotlight.style.transform = "translate3d(" + currentX.toFixed(1) + "px, " + currentY.toFixed(1) + "px, 0)";
			// Keep the dots pinned to the screen while the mask travels (the dot layer starts 240px up-left of the cursor)
			spotlight.style.setProperty("--bx", ((240 - currentX) % 22).toFixed(1) + "px");
			spotlight.style.setProperty("--by", ((240 - currentY) % 22).toFixed(1) + "px");
			frame = Math.abs(targetX - currentX) + Math.abs(targetY - currentY) > 0.5 ? requestAnimationFrame(follow) : 0;
		}

		window.addEventListener(
			"pointermove",
			function (e) {
				targetX = e.clientX;
				targetY = e.clientY;
				spotlight.classList.add("is-active");
				if (!frame) frame = requestAnimationFrame(follow);
			},
			{ passive: true }
		);

		document.addEventListener("mouseout", function (e) {
			if (!e.relatedTarget) spotlight.classList.remove("is-active");
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

	function draw() {
		ctx.clearRect(0, 0, innerWidth, innerHeight);
		var rgb = getComputedStyle(root).getPropertyValue("--fg-rgb").trim().split(/\s+/).join(", ");

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

		// Only animate while there are sparks on screen
		if (clicks.length) {
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

	resize();
	window.addEventListener("resize", resize);
	window.addEventListener("pointerdown", function (e) {
		spark(e.clientX, e.clientY);
	});
})();

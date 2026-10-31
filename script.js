/* Progressive enhancement only: the page works fully without this file. */
(function () {
	var root = document.documentElement;
	root.classList.add("js");

	var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
	var EMAIL = "diipanshuuuu@gmail.com";

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
				items.push(status === "offline" ? ["offline · ", "probably exploring irl", "", false] : [STATUS_TEXT[status] + " on ", "discord", "", false]);
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
			kavach: "https://github.com/diipanshuuuu/Kavach",
			"nst-sdc": "https://nst-sdc-site-ten.vercel.app",
			syscleanx: "https://github.com/htmnsrc/SysCleanX",
			github: "https://github.com/diipanshuuuu",
			linkedin: "https://www.linkedin.com/in/dipanshu-singh-86b2ba444/",
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
							print("→ " + EMAIL + " copied to your clipboard. let's go explore something together.", "acc");
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
			["kit", "skills-title", "what i carry"],
			["trail", "journey-title", "the trail so far"],
			["built", "projects-title", "built along the way"],
			["horizon", "exploring-title", "on the horizon"],
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
					"<pre><b>about</b>         who's exploring\n" +
						"<b>projects</b>      built along the way (open &lt;name&gt; to visit)\n" +
						"<b>skills</b>        what i carry\n" +
						"<b>where</b>         current position\n" +
						"<b>map</b>           waypoints on this page (goto &lt;place&gt;)\n" +
						"<b>compass</b>       pick a heading\n" +
						"<b>contact</b>       send a signal (copies my email)\n" +
						"<b>discord</b>       live signal from discord\n" +
						"<b>neofetch</b>      system info, obviously\n" +
						"<b>theme</b>         day / night\n" +
						"<b>accent</b>        green · orange · blue · pink\n" +
						"<b>clear</b>         wipe the screen\n" +
						"<b>exit</b>          back to the trail\n" +
						"<b>sudo hire-me</b>  you know you want to</pre>"
				);
			},
			about: function () {
				print("Dipanshu Singh: first-year B.Tech CSE (AI & ML) at Newton School of Technology, based in Ayodhya.");
				print("exploring open source, software dev, and self-hosting / training AI models with Ollama & Hugging Face.", "dim");
			},
			whoami: function () {
				print("a fellow explorer. could be my next teammate → sudo hire-me", "dim");
			},
			projects: function () {
				print("kavach      local privacy shield for ai chats");
				print("nst-sdc     vanilla redesign of my college's dev club site");
				print("syscleanx   windows pc cleaner + app uninstaller");
				print("type: open <name>", "dim");
			},
			skills: function () {
				print("languages  python · javascript · c · c++ · rust · bash");
				print("web        html · css · javascript");
				print("ai / ml    ollama · hugging face · local llms · model training");
				print("tools      git · github · linux · vim · vs code · firebase · vercel");
			},
			open: function (args) {
				var key = (args[0] || "").toLowerCase();
				if (!LINKS[key]) {
					print("usage: open kavach | nst-sdc | syscleanx | github | linkedin | discord | resume", "err");
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
				if (!activity && !presence.listening_to_spotify) print("nothing running. probably exploring.", "dim");
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
						"<b>os</b>      compass 26.10 (still exploring)\n" +
						"<b>loc</b>     26.79°n 82.20°e, ayodhya\n" +
						"<b>kernel</b>  b.tech-cse-ai-ml (year 1)\n" +
						"<b>uptime</b>  exploring since 2025\n" +
						"<b>shell</b>   vanilla html, css & js\n" +
						"<b>status</b>  open to work\n" +
						'<span class="neo-colors"><i style="background:#22c55e"></i><i style="background:#fb923c"></i><i style="background:#38bdf8"></i><i style="background:#f472b6"></i><i style="background:#e0e2e8"></i></span></pre></div>'
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
				else if (file === ".secrets") print("↑ ↑ ↓ ↓ ← → ← → b a (try it on the page)", "acc");
				else if (file === "resume.pdf") print("binary file. try: resume", "dim");
				else if (file.indexOf("uncharted") === 0) print("cat: uncharted/: nobody's been there yet", "err");
				else if (file.indexOf("projects") === 0) commands.projects();
				else print("cat: " + (args[0] || "") + ": no such file", "err");
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
		var ALIASES = { "?": "help", man: "help", work: "projects", kit: "skills", whereami: "where", waypoints: "map", go: "goto", hire: "hire-me", email: "contact", cls: "clear", quit: "exit" };

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

	/* ---------- Project previews: the live site, screenshots straight from the repo, or the demo ---------- */
	function probe(url) {
		return new Promise(function (resolve) {
			var img = new Image();
			img.decoding = "async";
			img.onload = function () {
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
	function startSlides(preview, strip, imgs) {
		var at = 0;
		var dots = document.createElement("div");
		dots.className = "preview-dots";

		var buttons = imgs.map(function (img, i) {
			var button = document.createElement("button");
			button.type = "button";
			button.setAttribute("aria-label", "Show screenshot " + (i + 1) + " of " + imgs.length);
			button.addEventListener("click", function () {
				show(i);
			});
			dots.appendChild(button);
			return button;
		});

		function show(i) {
			imgs[at].classList.remove("is-active");
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
		show(0);
	}

	function loadPreview(preview) {
		if (preview.dataset.loaded) return;
		preview.dataset.loaded = "1";

		// Websites: embed the real thing, rendered at desktop size and scaled to fit
		if (preview.dataset.live) {
			var wrap = document.createElement("div");
			var frame = document.createElement("iframe");
			wrap.className = "preview-live";
			wrap.inert = true;
			frame.title = preview.dataset.alt || "Live preview";
			frame.tabIndex = -1;
			frame.referrerPolicy = "no-referrer";
			frame.setAttribute("sandbox", "allow-scripts allow-same-origin");
			frame.addEventListener("load", function () {
				wrap.classList.add("is-loaded");
				setPreviewTag(preview, "live", "live");
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

		// Apps: a preview.png in the repo wins, then the listed screenshots; if none load, the demo stays
		var shots = (preview.dataset.shots || "").split(/\s+/).filter(Boolean);
		var first = preview.dataset.override ? probe(preview.dataset.override) : Promise.resolve(null);

		first
			.then(function (img) {
				if (img) return [img];
				return Promise.all(shots.map(probe)).then(function (imgs) {
					return imgs.filter(Boolean);
				});
			})
			.then(function (imgs) {
				if (!imgs.length) return;
				var strip = document.createElement("div");
				strip.className = "preview-shots" + (imgs.length === 1 ? " is-single" : "");
				imgs.forEach(function (img, i) {
					img.alt = (preview.dataset.alt || "Screenshot") + (imgs.length > 1 ? " " + (i + 1) + " of " + imgs.length : "");
					strip.appendChild(img);
				});
				preview.appendChild(strip);
				requestAnimationFrame(function () {
					strip.classList.add("is-loaded");
				});
				if (imgs.length > 1) startSlides(preview, strip, imgs);
				setPreviewTag(preview, "synced from github", "synced");
			});
	}

	// Only fetch a preview once its project is opened
	document.querySelectorAll(".preview").forEach(function (preview) {
		var project = preview.closest("details");
		if (!project || project.open) {
			loadPreview(preview);
			return;
		}
		project.addEventListener("toggle", function () {
			if (project.open) loadPreview(preview);
		});
	});

	/* ---------- Projects open on hover (desktop); click and keyboard still toggle ---------- */
	// Rule: never collapse anything above the cursor, so rows can't jump out from under it.
	// Hovering a row opens it and closes only the rows below; leaving the list closes them all.
	if (finePointer) {
		var projectList = document.querySelector(".projects");
		var projects = Array.prototype.slice.call(document.querySelectorAll(".project"));
		var hoverTimer = 0;
		var closeTimer = 0;

		// Manage exclusivity by hand: details[name] would also collapse the rows above
		projects.forEach(function (project) {
			project.removeAttribute("name");
		});

		projects.forEach(function (project, i) {
			project.addEventListener("pointerenter", function () {
				clearTimeout(closeTimer);
				clearTimeout(hoverTimer);
				// A short pause so just sweeping across the list doesn't flap rows open
				hoverTimer = setTimeout(function () {
					project.open = true;
					projects.slice(i + 1).forEach(function (below) {
						below.open = false;
					});
				}, 140);
			});
		});

		if (projectList) {
			projectList.addEventListener("pointerleave", function () {
				clearTimeout(hoverTimer);
				closeTimer = setTimeout(function () {
					projects.forEach(function (project) {
						project.open = false;
					});
				}, 350);
			});
		}
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
		document.title = document.hidden ? "come back, there's more to explore…" : baseTitle;
	});
	console.log("%c d. %c still exploring ", "background:#22c55e;color:#08090a;font:700 16px monospace;padding:2px 6px", "font:13px monospace");
	console.log("you opened devtools, so you like exploring too. press / on the page to go off the map, or say hi → " + EMAIL);

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

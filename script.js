/* Progressive enhancement only: the page works fully without this file. */
(function () {
	var root = document.documentElement;
	root.classList.add("js");

	var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

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
		var email = copyBtn.dataset.email;
		if (!navigator.clipboard) {
			window.location.href = "mailto:" + email;
			return;
		}
		navigator.clipboard.writeText(email).then(function () {
			copyBtn.classList.add("is-copied");
			copyStatus.textContent = "Email copied to clipboard";
			clearTimeout(copyTimer);
			copyTimer = setTimeout(function () {
				copyBtn.classList.remove("is-copied");
				copyStatus.textContent = "";
			}, 2000);
		});
	});

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

	if (reduceMotion) return;

	/* ---------- Cursor spotlight: eases toward the pointer, idles when settled ---------- */
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

	resize();
	window.addEventListener("resize", resize);
	window.addEventListener("pointerdown", function (e) {
		clicks.push({ x: e.clientX, y: e.clientY, age: 0 });
		if (!running) {
			running = true;
			requestAnimationFrame(draw);
		}
	});
})();

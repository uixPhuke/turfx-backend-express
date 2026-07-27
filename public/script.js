// ==========================================
// TurfX Landing Page
// script.js - Full Version
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

  // ========================================
  // Navbar Blur
  // ========================================

  const header = document.querySelector("header");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 40) {
      header.style.background = "rgba(7,11,22,.85)";
      header.style.boxShadow = "0 10px 40px rgba(0,0,0,.35)";
    } else {
      header.style.background = "rgba(7,11,22,.55)";
      header.style.boxShadow = "none";
    }
  });

  // ========================================
  // Smooth Scroll
  // ========================================

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // ========================================
  // Active Navigation
  // ========================================

  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll(".nav-links a");

  window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach(section => {
      const top = section.offsetTop - 120;
      const height = section.offsetHeight;
      if (window.scrollY >= top && window.scrollY < top + height) {
        current = section.id;
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("href") === "#" + current) {
        link.classList.add("active");
      }
    });
  });

  // ========================================
  // Animated Counters
  // ========================================

  const counters = document.querySelectorAll(".counter");
  const counterObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const counter = entry.target;
        const target = Number(counter.dataset.target);
        let value = 0;
        const step = Math.ceil(target / 80);

        const update = () => {
          value += step;
          if (value > target) value = target;
          counter.innerText = value + (target >= 100 ? "" : "+");
          if (value < target) {
            requestAnimationFrame(update);
          }
        };
        update();
        counterObserver.unobserve(counter);
      });
    }, {
      threshold: 0.5
    }
  );

  counters.forEach(counter => {
    counterObserver.observe(counter);
  });

  // ========================================
  // Scroll Progress Bar
  // ========================================

  const progress = document.getElementById("progress-bar");

  window.addEventListener("scroll", () => {
    if (!progress) return;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const percent = (window.scrollY / total) * 100;
    progress.style.width = percent + "%";
  });

  // ========================================
  // Live API Health Check - FIXED
  // ========================================

  async function checkAPIHealth() {
    const badge = document.getElementById("api-status");
    if (!badge) return;

    try {
      console.log("Checking API health...");
      
      const response = await fetch("/api/v1/health", {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);

      // Check if the API is healthy
      if (data.success === true && data.status === "healthy") {
        // Format the uptime
        const uptimeSeconds = Math.floor(data.uptime);
        const uptimeHours = Math.floor(uptimeSeconds / 3600);
        const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);
        const uptimeSecs = uptimeSeconds % 60;
        
        let uptimeText = "";
        if (uptimeHours > 0) {
          uptimeText += `${uptimeHours}h `;
        }
        if (uptimeMinutes > 0) {
          uptimeText += `${uptimeMinutes}m `;
        }
        uptimeText += `${uptimeSecs}s`;
        
        // Display nice status
        badge.innerHTML = `
          <i class="fa-solid fa-circle-check" style="color: #22c55e;"></i>
          <span style="font-weight: 600;">API Online</span>
          <span style="font-weight: 300; opacity: 0.7; font-size: 0.8rem; margin-left: 4px;">
            • ${uptimeText}
          </span>
        `;
        badge.style.background = "rgba(34, 197, 94, 0.15)";
        badge.style.color = "#22c55e";
        badge.style.border = "1px solid rgba(34, 197, 94, 0.3)";
      } else {
        badge.innerHTML = `
          <i class="fa-solid fa-circle-exclamation" style="color: #eab308;"></i>
          <span>API Unhealthy</span>
        `;
        badge.style.background = "rgba(234, 179, 8, 0.15)";
        badge.style.color = "#eab308";
        badge.style.border = "1px solid rgba(234, 179, 8, 0.3)";
      }
    } catch (error) {
      console.error("API Health Check Error:", error);
      
      badge.innerHTML = `
        <i class="fa-solid fa-circle-xmark" style="color: #ef4444;"></i>
        <span>API Offline</span>
      `;
      badge.style.background = "rgba(239, 68, 68, 0.15)";
      badge.style.color = "#ef4444";
      badge.style.border = "1px solid rgba(239, 68, 68, 0.3)";
    }
  }

  // Check immediately and then every 30 seconds
  checkAPIHealth();
  setInterval(checkAPIHealth, 30000);

  // ========================================
  // Copy API URL
  // ========================================

  const copyBtn = document.getElementById("copy-api");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const url = document.getElementById("api-url")?.textContent || "https://api.turfx.dev/v1";
      try {
        await navigator.clipboard.writeText(url);
        const original = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = original;
        }, 2000);
      } catch (err) {
        // Fallback
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        const original = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = original;
        }, 2000);
      }
    });
  }

  // ========================================
  // Back To Top
  // ========================================

  const topButton = document.getElementById("backTop");

  window.addEventListener("scroll", () => {
    if (!topButton) return;
    if (window.scrollY > 400) {
      topButton.classList.add("show");
    } else {
      topButton.classList.remove("show");
    }
  });

  if (topButton) {
    topButton.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  // ========================================
  // Current Year
  // ========================================

  const year = document.getElementById("year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // ========================================
  // Floating Background Animation
  // ========================================

  document.querySelectorAll(".gradient").forEach((blob, index) => {
    let x = 0;
    let y = 0;
    setInterval(() => {
      x += Math.random() * 12 - 6;
      y += Math.random() * 12 - 6;
      blob.style.transform = `translate(${x}px, ${y}px)`;
    }, 1200 + index * 300);
  });

  // ========================================
  // Mouse Glow Effect
  // ========================================

  const glow = document.createElement("div");
  glow.style.position = "fixed";
  glow.style.width = "350px";
  glow.style.height = "350px";
  glow.style.borderRadius = "50%";
  glow.style.pointerEvents = "none";
  glow.style.filter = "blur(100px)";
  glow.style.opacity = ".12";
  glow.style.background = "#3b82f6";
  glow.style.zIndex = "-1";
  document.body.appendChild(glow);

  window.addEventListener("mousemove", e => {
    glow.style.left = e.clientX - 175 + "px";
    glow.style.top = e.clientY - 175 + "px";
  });

  // ========================================
  // Console Banner
  // ========================================

  console.log(
    `
  ████████╗██╗   ██╗██████╗ ███████╗██╗  ██╗
  ╚══██╔══╝██║   ██║██╔══██╗██╔════╝╚██╗██╔╝
     ██║   ██║   ██║██████╔╝█████╗   ╚███╔╝
     ██║   ██║   ██║██╔══██╗██╔══╝   ██╔██╗
     ██║   ╚██████╔╝██║  ██║██║     ██╔╝ ██╗
     ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝

  TurfX Backend API
  `
  );

  console.log("Made with ❤️ using Node.js, Express, MongoDB & Redis.");

});
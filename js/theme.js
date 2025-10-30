// Gerenciamento de tema dark/light
class ThemeManager {
  constructor() {
    this.theme = localStorage.getItem("theme") || "dark";
    this.init();
  }

  init() {
    this.applyTheme();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        this.toggleTheme();
      });
    }
  }

  toggleTheme() {
    this.theme = this.theme === "dark" ? "light" : "dark";
    this.applyTheme();
    this.saveTheme();
  }

  applyTheme() {
    const body = document.body;
    const themeIcon = document.querySelector(".theme-icon");

    if (this.theme === "dark") {
      body.classList.add("dark-mode");
      body.classList.remove("light-mode");
      if (themeIcon) themeIcon.textContent = "🌙";
    } else {
      body.classList.add("light-mode");
      body.classList.remove("dark-mode");
      if (themeIcon) themeIcon.textContent = "☀️";
    }
  }

  saveTheme() {
    localStorage.setItem("theme", this.theme);
  }

  getCurrentTheme() {
    return this.theme;
  }
}

let themeManager;

document.addEventListener("DOMContentLoaded", () => {
  themeManager = new ThemeManager();
});

// Sistema de autocomplete moderno para cidades
class AutocompleteManager {
  constructor() {
    this.cities = [];
    this.currentInput = "";
    this.selectedCity = null;
    this.history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    this.debounceTimeout = null;
    this.init();
  }

  async init() {
    await this.loadCities();
    this.setupEventListeners();
    this.setupClearButton();
  }

  async loadCities() {
    try {
      const sheetsAPI = new GoogleSheetsAPI();
      const data = await sheetsAPI.loadData();
      this.cities = sheetsAPI.getUniqueCities();
      console.log("Cidades carregadas:", this.cities);
    } catch (error) {
      console.error("Erro ao carregar cidades:", error);
      // Cidades de exemplo em caso de erro
      this.cities = [
        { cidade: "ARAUCARIA", uf: "PR", display: "ARAUCARIA, PR" },
        {
          cidade: "CAMPINA GRANDE DO SUL",
          uf: "PR",
          display: "CAMPINA GRANDE DO SUL, PR",
        },
        { cidade: "CURITIBA", uf: "PR", display: "CURITIBA, PR" },
        { cidade: "FLORIANÓPOLIS", uf: "SC", display: "FLORIANÓPOLIS, SC" },
        { cidade: "PORTO ALEGRE", uf: "RS", display: "PORTO ALEGRE, RS" },
        { cidade: "SÃO PAULO", uf: "SP", display: "SÃO PAULO, SP" },
        { cidade: "RIO DE JANEIRO", uf: "RJ", display: "RIO DE JANEIRO, RJ" },
        { cidade: "BELO HORIZONTE", uf: "MG", display: "BELO HORIZONTE, MG" },
      ];
    }
  }

  setupEventListeners() {
    const citySearch = document.getElementById("citySearch");
    const autocompleteResults = document.getElementById("autocompleteResults");

    if (citySearch) {
      // ✅ USANDO DEBOUNCE DO PERFORMANCE MANAGER SE DISPONÍVEL
      let debouncedShowSuggestions;

      if (window.PerformanceManager) {
        debouncedShowSuggestions = PerformanceManager.debounce(
          (input) => this.showSuggestions(input),
          300
        );
      } else {
        // Fallback para debounce manual
        debouncedShowSuggestions = (input) => {
          if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
          }
          this.debounceTimeout = setTimeout(() => {
            this.showSuggestions(input);
          }, 300);
        };
      }

      // Input event para mostrar sugestões
      citySearch.addEventListener("input", (e) => {
        this.currentInput = e.target.value.trim();
        this.toggleClearButton();
        debouncedShowSuggestions(this.currentInput);
      });

      // Focus event para mostrar sugestões
      citySearch.addEventListener("focus", () => {
        if (this.currentInput) {
          this.showSuggestions(this.currentInput);
        } else if (this.history.length > 0) {
          this.showHistory();
        }
      });

      // Click outside para esconder sugestões
      document.addEventListener("click", (e) => {
        if (
          !citySearch.contains(e.target) &&
          !autocompleteResults.contains(e.target)
        ) {
          this.hideSuggestions();
        }
      });

      // Keyboard navigation melhorada
      citySearch.addEventListener("keydown", (e) => {
        const items =
          autocompleteResults.querySelectorAll(".autocomplete-item");
        const activeItem = autocompleteResults.querySelector(
          ".autocomplete-item.active"
        );

        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            this.navigateSuggestions(1, items, activeItem);
            break;
          case "ArrowUp":
            e.preventDefault();
            this.navigateSuggestions(-1, items, activeItem);
            break;
          case "Enter":
            e.preventDefault();
            if (activeItem) {
              this.selectSuggestion(activeItem);
            } else if (items.length > 0) {
              this.selectSuggestion(items[0]);
            } else if (this.currentInput) {
              document.getElementById("searchBtn")?.click();
            }
            break;
          case "Escape":
            this.hideSuggestions();
            citySearch.blur();
            break;
          case "Tab":
            if (activeItem) {
              e.preventDefault();
              this.selectSuggestion(activeItem);
            }
            break;
        }
      });

      // Salvar busca quando o input perder o foco com valor válido
      citySearch.addEventListener("blur", () => {
        if (this.currentInput && this.isValidCity(this.currentInput)) {
          this.saveToHistory(this.currentInput);
        }
      });
    }
  }

  setupClearButton() {
    const clearBtn = document.querySelector(".clear-search");
    const citySearch = document.getElementById("citySearch");

    if (clearBtn && citySearch) {
      clearBtn.addEventListener("click", () => {
        citySearch.value = "";
        this.currentInput = "";
        this.selectedCity = null;
        this.toggleClearButton();
        this.hideSuggestions();
        citySearch.focus();
      });
    }
  }

  toggleClearButton() {
    const clearBtn = document.querySelector(".clear-search");
    if (clearBtn) {
      clearBtn.style.display = this.currentInput ? "block" : "none";
    }
  }

  showSuggestions(query) {
    const autocompleteResults = document.getElementById("autocompleteResults");
    if (!autocompleteResults) return;

    if (!query) {
      this.showHistory();
      return;
    }

    const suggestions = this.getSuggestions(query);

    if (suggestions.length === 0) {
      this.showNoResults(query);
      return;
    }

    this.renderSuggestions(suggestions, query);
  }

  showHistory() {
    const autocompleteResults = document.getElementById("autocompleteResults");
    if (!autocompleteResults || this.history.length === 0) {
      this.hideSuggestions();
      return;
    }

    autocompleteResults.innerHTML = `
            <div class="autocomplete-section">
                <div class="section-title">Histórico de Buscas</div>
                ${this.history
                  .slice(0, 5)
                  .map(
                    (item) => `
                    <div class="autocomplete-item history-item" data-value="${item}">
                        <div class="city-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/>
                            </svg>
                        </div>
                        <div class="city-info">
                            <div class="city-name">${item}</div>
                            <div class="city-state">Busca anterior</div>
                        </div>
                    </div>
                `
                  )
                  .join("")}
            </div>
        `;

    this.setupSuggestionEvents();
    autocompleteResults.style.display = "block";
  }

  showNoResults(query) {
    const autocompleteResults = document.getElementById("autocompleteResults");
    if (!autocompleteResults) return;

    autocompleteResults.innerHTML = `
            <div class="autocomplete-section">
                <div class="autocomplete-item no-results-item">
                    <div class="city-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                    </div>
                    <div class="city-info">
                        <div class="city-name">Nenhum resultado para "${query}"</div>
                        <div class="city-state">Tente digitar o nome completo da cidade</div>
                    </div>
                </div>
            </div>
        `;

    autocompleteResults.style.display = "block";
  }

  renderSuggestions(suggestions, query) {
    const autocompleteResults = document.getElementById("autocompleteResults");

    autocompleteResults.innerHTML = `
            <div class="autocomplete-section">
                <div class="section-title">Sugestões de Cidades</div>
                ${suggestions
                  .map(
                    (city) => `
                    <div class="autocomplete-item" data-city="${
                      city.cidade
                    }" data-uf="${city.uf}" data-value="${city.display}">
                        <div class="city-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                        </div>
                        <div class="city-info">
                            <div class="city-name">${this.highlightMatch(
                              city.cidade,
                              query
                            )}</div>
                            <div class="city-state">${city.uf}</div>
                        </div>
                        <div class="state-badge">${city.uf}</div>
                    </div>
                `
                  )
                  .join("")}
            </div>
        `;

    this.setupSuggestionEvents();
    autocompleteResults.style.display = "block";
  }

  setupSuggestionEvents() {
    const autocompleteResults = document.getElementById("autocompleteResults");

    autocompleteResults
      .querySelectorAll(".autocomplete-item")
      .forEach((item) => {
        item.addEventListener("click", () => {
          this.selectSuggestion(item);
        });

        item.addEventListener("mouseenter", () => {
          this.setActiveItem(item);
        });
      });
  }

  hideSuggestions() {
    const autocompleteResults = document.getElementById("autocompleteResults");
    if (autocompleteResults) {
      autocompleteResults.style.display = "none";
    }
  }

  // ✅ MÉTODO ATUALIZADO: Aceita buscas com acentos
  getSuggestions(query) {
    if (!query) return [];

    // Normaliza a query para busca (remove acentos e converte para maiúsculo)
    const normalizedQuery = this.normalizeForSearch(query);
    const lowerQuery = normalizedQuery.toLowerCase();

    // Filtra cidades que começam com a query (busca mais exata)
    const exactMatches = this.cities.filter(
      (city) =>
        this.normalizeForSearch(city.cidade).startsWith(normalizedQuery) ||
        this.normalizeForSearch(city.display).startsWith(normalizedQuery)
    );

    // Se não encontrou matches exatos, busca por contains
    const containsMatches =
      exactMatches.length === 0
        ? this.cities.filter(
            (city) =>
              this.normalizeForSearch(city.cidade).includes(normalizedQuery) ||
              this.normalizeForSearch(city.display).includes(normalizedQuery)
          )
        : [];

    const allMatches = exactMatches.length > 0 ? exactMatches : containsMatches;

    // Remove duplicatas e limita a 6 sugestões
    const uniqueMatches = allMatches.filter(
      (city, index, self) =>
        index === self.findIndex((c) => c.display === city.display)
    );

    return uniqueMatches.slice(0, 6);
  }

  // ✅ NOVO MÉTODO: Normaliza texto para busca (remove acentos)
  normalizeForSearch(text) {
    if (!text) return "";
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .toUpperCase();
  }

  // MÉTODO highlightMatch ATUALIZADO para trabalhar com texto original
  highlightMatch(text, query) {
    if (!query) return text;

    const normalizedText = text;
    const normalizedQuery = this.normalizeForSearch(query);

    const index = normalizedText.toUpperCase().indexOf(normalizedQuery);

    if (index === -1) return text;

    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);

    return `${before}<strong style="color: var(--primary-color);">${match}</strong>${after}`;
  }

  navigateSuggestions(direction, items, activeItem) {
    if (items.length === 0) return;

    let nextIndex = 0;

    if (activeItem) {
      const currentIndex = Array.from(items).indexOf(activeItem);
      nextIndex = currentIndex + direction;

      if (nextIndex < 0) nextIndex = items.length - 1;
      if (nextIndex >= items.length) nextIndex = 0;
    }

    this.setActiveItem(items[nextIndex]);

    // Scroll para o item ativo
    items[nextIndex].scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }

  setActiveItem(item) {
    const items = document.querySelectorAll(".autocomplete-item");
    items.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");
  }

  selectSuggestion(item) {
    const value = item.getAttribute("data-value");
    const city = item.getAttribute("data-city");
    const uf = item.getAttribute("data-uf");

    document.getElementById("citySearch").value = value;
    this.currentInput = value;
    this.selectedCity = { cidade: city, uf: uf };
    this.toggleClearButton();
    this.hideSuggestions();

    // Salva no histórico
    this.saveToHistory(value);

    // Força busca exata imediatamente
    this.performExactSearch(city, uf);
  }

  // Novo método para busca exata
  performExactSearch(city, uf) {
    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) {
      // Dispara a busca
      setTimeout(() => {
        searchBtn.click();
      }, 100);
    }
  }

  saveToHistory(searchTerm) {
    // Remove se já existir
    this.history = this.history.filter((item) => item !== searchTerm);

    // Adiciona no início
    this.history.unshift(searchTerm);

    // Mantém apenas os últimos 10
    this.history = this.history.slice(0, 10);

    // Salva no localStorage
    localStorage.setItem("searchHistory", JSON.stringify(this.history));
  }

  isValidCity(input) {
    const normalizedInput = this.normalizeForSearch(input);
    return this.cities.some(
      (city) => this.normalizeForSearch(city.display) === normalizedInput
    );
  }

  getSelectedCity() {
    return this.selectedCity;
  }

  clearHistory() {
    this.history = [];
    localStorage.removeItem("searchHistory");
    this.hideSuggestions();
  }

  // ✅ MÉTODO PARA LIMPAR DEBOUNCE (importante para cleanup)
  destroy() {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
  }
}

// Inicializa o autocomplete quando o DOM estiver carregado
let autocompleteManager;

document.addEventListener("DOMContentLoaded", () => {
  autocompleteManager = new AutocompleteManager();
});

// Cleanup quando a página for descarregada
window.addEventListener("beforeunload", () => {
  if (autocompleteManager) {
    autocompleteManager.destroy();
  }
});

// Aplicação principal - TRANSPORTADORA EM DESTAQUE COM EVENT DELEGATION
class TransportadoraApp {
  constructor() {
    this.sheetsAPI = new GoogleSheetsAPI();
    this.allData = [];
    this.filteredData = [];

    this.initializeDistanceCalculator();
    this.setupPerformance();
    this.setupScrollEffect();
    this.init();
  }

  async initializeDistanceCalculator() {
    return new Promise((resolve) => {
      const checkDC = () => {
        if (
          window.distanceCalculator &&
          window.distanceCalculator.getDistanceToCity
        ) {
          console.log("✅ DistanceCalculator pronto");
          resolve();
        } else {
          console.log("⏳ Aguardando DistanceCalculator...");
          setTimeout(checkDC, 100);
        }
      };
      checkDC();
    });
  }

  setupPerformance() {
    if (window.PerformanceManager) {
      PerformanceManager.measurePerformance(
        "Inicialização da aplicação",
        () => {
          console.log("📊 Performance monitor ativado");
        }
      );
    }
  }

  setupScrollEffect() {
    let ticking = false;

    const updateHeader = () => {
      const header = document.querySelector(".header");
      const scrolled = window.pageYOffset > 50;

      if (scrolled) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
  }

  async init() {
    try {
      await this.initializeDistanceCalculator();
      await this.loadData();
      this.setupEventListeners();

      // Verificar serviços integrados
      if (window.weatherService) {
        console.log("🌤️ Serviço de clima integrado");
      }
      if (window.cepService) {
        console.log("📮 Serviço de CEP integrado");
      }
    } catch (error) {
      console.error("Erro ao inicializar app:", error);
      this.showError("Erro ao inicializar a aplicação.");
    }
  }

  async loadData() {
    this.showLoading(true);

    try {
      console.log("🚀 Iniciando carregamento no app...");
      this.allData = await this.sheetsAPI.loadData();
      console.log("✅ Dados recebidos no app:", this.allData);

      if (!this.allData || this.allData.length === 0) {
        console.warn("⚠️ Nenhum dado encontrado na planilha");
        this.showError("Nenhum dado encontrado na planilha.");
      } else {
        console.log(
          `🎉 ${this.allData.length} registros carregados com sucesso!`
        );
      }

      this.showLoading(false);
    } catch (error) {
      console.error("❌ Erro crítico ao carregar dados:", error);
      this.showLoading(false);
      this.showError(
        "Erro ao carregar dados da planilha. Recarregue a página."
      );
    }
  }

  setupEventListeners() {
    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) {
      searchBtn.addEventListener("click", () => {
        this.performSearch();
      });
    }

    // Busca por Enter na cidade
    const citySearch = document.getElementById("citySearch");
    if (citySearch) {
      citySearch.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.performSearch();
        }
      });
    }

    // Analytics para buscas
    this.setupAnalytics();
  }

  setupAnalytics() {
    const searchBtn = document.getElementById("searchBtn");
    const citySearch = document.getElementById("citySearch");

    if (searchBtn && citySearch) {
      searchBtn.addEventListener("click", () => {
        this.trackSearch(citySearch.value.trim(), "city");
      });

      citySearch.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.trackSearch(citySearch.value.trim(), "city");
        }
      });
    }
  }

  trackSearch(query, type) {
    if (query && window.gtag) {
      gtag("event", "search", {
        search_term: query,
        search_type: type,
        event_category: "search",
      });
    }
  }

  performSearch() {
    const cidadeInput =
      document.getElementById("citySearch")?.value.trim() || "";

    if (!cidadeInput) {
      this.showMessage("Digite o nome de uma cidade para buscar.");
      return;
    }

    if (!this.allData || this.allData.length === 0) {
      this.showError("Dados não carregados. Tente recarregar a página.");
      return;
    }

    this.showLoading(true, "Buscando transportadoras...");

    // Atualizar status para screen readers
    this.updateResultsStatus(`Buscando transportadoras para ${cidadeInput}`);

    setTimeout(() => {
      try {
        this.filteredData = this.filterData(this.allData, cidadeInput);
        this.displayResults(this.filteredData, cidadeInput);

        // Analytics
        if (window.gtag) {
          gtag("event", "search_results", {
            search_term: cidadeInput,
            results_count: this.filteredData.length,
            event_category: "search",
          });
        }
      } catch (error) {
        console.error("Erro ao filtrar dados:", error);
        this.showError("Erro ao buscar transportadoras.");
      } finally {
        this.showLoading(false);
      }
    }, 300);
  }

  filterData(data, cidadeInput) {
    if (!data || !Array.isArray(data)) {
      console.warn("Dados inválidos para filtragem");
      return [];
    }

    let cidade = "";
    let uf = "";

    if (cidadeInput.includes(",")) {
      const parts = cidadeInput.split(",").map((part) => part.trim());
      cidade = parts[0] || "";
      uf = parts[1] || "";
    } else {
      cidade = cidadeInput;
    }

    const cidadeUpper = cidade.toUpperCase();

    return data.filter((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const itemCidade = item.cidade || "";
      const itemUf = item.uf || "";

      const matchesCidade =
        !cidadeUpper || itemCidade.toUpperCase() === cidadeUpper;
      const matchesUf = !uf || itemUf === uf.toUpperCase();

      return matchesCidade && matchesUf;
    });
  }

  // ✅ MÉTODO displayResults COM EVENT DELEGATION
  async displayResults(data, cidadeInput) {
    const container = document.getElementById("resultsContainer");
    const countElement = document.getElementById("resultsCount");
    const titleElement = document.getElementById("resultsTitle");
    const subtitleElement = document.getElementById("resultsSubtitle");
    const distancesPanel = document.getElementById("distancesPanel");
    const distancesGrid = document.getElementById("distancesGrid");
    const citiesCount = document.getElementById("citiesCount");

    if (
      !container ||
      !countElement ||
      !titleElement ||
      !subtitleElement ||
      !distancesPanel ||
      !distancesGrid ||
      !citiesCount
    )
      return;

    const count = Array.isArray(data) ? data.length : 0;
    countElement.textContent = `${count} resultado${count !== 1 ? "s" : ""}`;

    if (cidadeInput) {
      titleElement.textContent = `Transportadoras para ${cidadeInput.toUpperCase()}`;
      subtitleElement.textContent = `Encontramos ${count} opções para seu frete`;
    } else {
      titleElement.textContent = "Transportadoras Disponíveis";
      subtitleElement.textContent =
        "Encontre as melhores opções para seu frete";
    }

    this.updateResultsStatus(
      `${count} resultados encontrados para ${cidadeInput}`
    );

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          </div>
          <h3>Nenhuma transportadora encontrada</h3>
          <p>Tente verificar a ortografia da cidade ou buscar por outra localidade</p>
        </div>
      `;
      distancesPanel.style.display = "none";
      return;
    }

    const uniqueCities = this.extractUniqueCities(data);
    console.log(
      `🏙️ ${uniqueCities.length} cidades únicas encontradas:`,
      uniqueCities
    );

    citiesCount.textContent = uniqueCities.length;
    distancesPanel.style.display = "block";

    distancesGrid.innerHTML = uniqueCities
      .map(
        (city) => `
      <div class="distance-badge" id="distance-badge-${city.key}">
        <div class="distance-info">
          <span class="distance-city">${city.cidade}</span>
          <span class="distance-uf">${city.uf}</span>
        </div>
        <div class="distance-value calculating">
          <div class="mini-spinner"></div>
          <span>Calculando...</span>
        </div>
      </div>
    `
      )
      .join("");

    let cards;
    if (window.PerformanceManager) {
      cards = await PerformanceManager.measurePerformance(
        `Criação de ${data.length} cards`,
        () => Promise.all(data.map((item) => this.createCard(item)))
      );
    } else {
      cards = await Promise.all(data.map((item) => this.createCard(item)));
    }

    // ✅ CORREÇÃO: Simplesmente substituir o conteúdo
    container.innerHTML = cards.join("");

    // ✅ EVENT DELEGATION JÁ ESTÁ CONFIGURADO - não precisa reconfigurar

    setTimeout(() => {
      this.calculateRealDistances(uniqueCities);
    }, 100);

    if (window.lazyLoader) {
      setTimeout(() => {
        window.lazyLoader.observeAllLazyImages();
      }, 100);
    }
  }

  // ✅ MÉTODO createCard - TRANSPORTADORA EM DESTAQUE
  async createCard(item) {
    if (!item || typeof item !== "object") {
      return '<div class="transport-card">Dados inválidos</div>';
    }

    const cidade = item.cidade || "N/A";
    const uf = item.uf || "N/A";
    const transportadora = item.transportadora || "N/A";
    const modal = item.modal || "N/A";
    const diasUteis = item.dias_uteis || "N/A";

    const logo = logoManager.getLogo(transportadora);
    const logoClass = transportadora.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const logoHTML = this.generateLogoHTML(logo, transportadora, logoClass);

    const cardId = `card-${cidade.replace(
      /\s+/g,
      "-"
    )}-${uf}-${transportadora.replace(/\s+/g, "-")}`;

    return `
    <div class="transport-card compact" id="${cardId}" data-item='${JSON.stringify(
      item
    )}' tabindex="0">
      <div class="card-header-compact">
        <div class="company-logo-compact ${logoClass}">
          ${logoHTML}
        </div>
        <div class="card-info-compact">
          <!-- TRANSPORTADORA EM DESTAQUE (nome grande) -->
          <div class="transportadora-name-compact">${transportadora}</div>
          <div class="card-meta-compact">
            <span class="meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              ${cidade}, ${uf}
            </span>
            <span class="meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z"/>
              </svg>
              ${modal}
            </span>
            <span class="meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
              ${diasUteis} dias
            </span>
          </div>
        </div>
        <div class="expand-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
          </svg>
        </div>
      </div>
      
      <div class="card-expanded-content">
        <div class="expanded-section">
          <div class="section-title">Informações da Entrega</div>
          <div class="details-grid">
            <div class="detail-row">
              <span class="detail-label">Transportadora:</span>
              <span class="detail-value">${transportadora}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Cidade/UF:</span>
              <span class="detail-value">${cidade}, ${uf}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Modal:</span>
              <span class="modal-badge">${modal}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Prazo de entrega:</span>
              <span class="prazo-badge">${diasUteis} dias úteis</span>
            </div>
          </div>
        </div>
        
        <div class="expanded-section">
          <div class="section-title">Distância e Localização</div>
          <div class="details-grid">
            <div class="detail-row">
              <span class="detail-label">Distância de Balneário Camboriú, SC:</span>
              <span class="detail-value">
                <div class="distance-loading" id="distance-${cardId}">
                  <div class="mini-spinner"></div>
                  Calculando distância...
                </div>
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Origem:</span>
              <span class="detail-value">Balneário Camboriú, SC</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Destino:</span>
              <span class="detail-value">${cidade}, ${uf}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  }

  // ✅ EVENT DELEGATION - CONFIGURADO UMA VEZ NO INÍCIO
  setupCardInteractions() {
    const container = document.getElementById("resultsContainer");
    if (!container) {
      console.log(
        "⏳ Container de resultados não encontrado, tentando novamente..."
      );
      setTimeout(() => this.setupCardInteractions(), 100);
      return;
    }

    console.log("🎯 Configurando event delegation para cards...");

    // Remove event listeners antigos se existirem
    if (this._cardClickHandler) {
      container.removeEventListener("click", this._cardClickHandler);
    }
    if (this._cardKeyHandler) {
      container.removeEventListener("keydown", this._cardKeyHandler);
    }

    // ✅ EVENT DELEGATION PARA CLICKS
    this._cardClickHandler = (e) => {
      const card = e.target.closest(".transport-card");
      if (card) {
        console.log("🎯 Card clicado via delegation:", card.id);
        this.toggleCard(card);
      }
    };

    // ✅ EVENT DELEGATION PARA TECLADO
    this._cardKeyHandler = (e) => {
      if (
        (e.key === "Enter" || e.key === " ") &&
        e.target.closest(".transport-card")
      ) {
        e.preventDefault();
        const card = e.target.closest(".transport-card");
        if (card) {
          console.log("🎯 Card ativado via teclado:", card.id);
          this.toggleCard(card);
        }
      }
    };

    // Adiciona os event listeners
    container.addEventListener("click", this._cardClickHandler);
    container.addEventListener("keydown", this._cardKeyHandler);

    console.log("✅ Event delegation configurado com sucesso");
  }

  // ✅ MÉTODO toggleCard OTIMIZADO
  toggleCard(card) {
    if (!card) {
      console.error("❌ Card não encontrado");
      return;
    }

    const allCards = document.querySelectorAll(".transport-card");

    // Fechar outros cards abertos
    allCards.forEach((otherCard) => {
      if (otherCard !== card && otherCard.classList.contains("expanded")) {
        otherCard.classList.remove("expanded");
        otherCard.classList.add("compact");
      }
    });

    // Alternar estado do card clicado
    const wasExpanded = card.classList.contains("expanded");

    if (wasExpanded) {
      card.classList.remove("expanded");
      card.classList.add("compact");
      this.currentExpandedCard = null;
    } else {
      card.classList.remove("compact");
      card.classList.add("expanded");
      this.currentExpandedCard = card;

      // Calcular distância se ainda não foi calculada
      this.calculateDistanceForCard(card);

      // Scroll suave para o card expandido
      setTimeout(() => {
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  }

  // ✅ CALCULAR DISTÂNCIA PARA CARD ESPECÍFICO
  async calculateDistanceForCard(card) {
    const itemData = card.getAttribute("data-item");
    if (!itemData) return;

    try {
      const item = JSON.parse(itemData);
      const distanceElement = card.querySelector(".distance-loading");

      if (
        !distanceElement ||
        distanceElement.classList.contains("calculated")
      ) {
        return;
      }

      const cidade = item.cidade;
      const uf = item.uf;
      const cardId = card.id;

      if (window.distanceCalculator) {
        const distance = await window.distanceCalculator.getDistanceToCity(
          cidade,
          uf
        );
        const formattedDistance =
          window.distanceCalculator.formatDistance(distance);

        distanceElement.innerHTML = `
          <div class="distance-display">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            ${formattedDistance}
          </div>
        `;
        distanceElement.classList.remove("distance-loading");
        distanceElement.classList.add("calculated");
      }
    } catch (error) {
      console.error("Erro ao calcular distância para card:", error);
      const distanceElement = card.querySelector(".distance-loading");
      if (distanceElement) {
        distanceElement.innerHTML =
          '<span style="color: var(--error-color);">Erro no cálculo</span>';
        distanceElement.classList.remove("distance-loading");
      }
    }
  }

  updateResultsStatus(message) {
    const statusElement = document.getElementById("resultsStatus");
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  extractUniqueCities(data) {
    const citiesMap = new Map();

    data.forEach((item) => {
      if (item && item.cidade && item.uf) {
        const key = `${item.cidade.toUpperCase().trim()}_${item.uf
          .toUpperCase()
          .trim()}`;
        if (!citiesMap.has(key)) {
          citiesMap.set(key, {
            cidade: item.cidade,
            uf: item.uf,
            transportadoras: new Set(),
          });
        }
        if (item.transportadora) {
          citiesMap.get(key).transportadoras.add(item.transportadora);
        }
      }
    });

    return Array.from(citiesMap.values()).map((city) => ({
      cidade: city.cidade,
      uf: city.uf,
      transportadorasCount: city.transportadoras.size,
      key: `${city.cidade.replace(/\s+/g, "-")}-${city.uf}`,
    }));
  }

  async calculateRealDistances(cities) {
    if (!cities || !Array.isArray(cities) || !window.distanceCalculator) {
      console.warn("❌ Dados ou DistanceCalculator não disponíveis");
      return;
    }

    console.log(
      `🔄 Calculando distâncias EXATAS para ${cities.length} cidades...`
    );

    const distancePromises = cities.map(async (city) => {
      try {
        console.log(
          `📍 Calculando distância EXATA para: ${city.cidade}, ${city.uf}`
        );
        const realDistance = await this.getRealDistance(city.cidade, city.uf);

        if (realDistance && realDistance > 0) {
          const distanciaFormatada =
            window.distanceCalculator.formatDistance(realDistance);
          this.updateCityDistance(city.key, distanciaFormatada);
          console.log(
            `✅ DISTÂNCIA EXATA: ${city.cidade}, ${city.uf}: ${distanciaFormatada}`
          );
          return { success: true, city: city.key, distance: realDistance };
        } else {
          throw new Error("Distância real não calculada");
        }
      } catch (error) {
        console.error(
          `❌ Erro ao calcular distância para ${city.cidade}:`,
          error
        );
        this.updateCityDistance(city.key, "Erro no cálculo");
        return { success: false, city: city.key, error: error.message };
      }
    });

    const results = await Promise.allSettled(distancePromises);
    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failed = results.filter(
      (r) => r.status === "rejected" || !r.value?.success
    ).length;

    console.log(
      `🎯 Cálculos concluídos: ${successful} sucessos, ${failed} falhas`
    );
  }

  async getRealDistance(cityName, state) {
    try {
      const preciseDistance =
        await window.distanceCalculator.getDistanceWithFallback(
          cityName,
          state
        );

      if (preciseDistance && preciseDistance > 0) {
        console.log(
          `📏 Distância EXATA calculada: ${cityName} - ${preciseDistance}km`
        );
        return preciseDistance;
      } else {
        throw new Error("Distância precisa não disponível");
      }
    } catch (error) {
      console.error(`❌ Falha no cálculo para ${cityName}:`, error);
      const fallbackDistance =
        window.distanceCalculator.estimateDistanceByState(state);
      console.log(`🔄 Usando fallback para ${cityName}: ${fallbackDistance}km`);
      return fallbackDistance;
    }
  }

  updateCityDistance(cityKey, distanciaFormatada) {
    const distanceBadge = document.getElementById(`distance-badge-${cityKey}`);

    if (distanceBadge) {
      const distanceValue = distanceBadge.querySelector(".distance-value");
      if (distanceValue) {
        distanceValue.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          ${distanciaFormatada}
        `;
        distanceValue.classList.remove("calculating");
        distanceBadge.classList.add("updated");

        setTimeout(() => {
          distanceBadge.classList.remove("updated");
        }, 600);
      }
    }
  }

  generateLogoHTML(logo, transportadora, logoClass) {
    if (logo.type === "image") {
      return `
        <img 
          src="${logo.content}"
          alt="${logo.alt}"
          class="logo-img"
          onerror="this.onerror=null; this.src='${logo.fallback}'"
          loading="lazy"
        >
      `;
    } else {
      return logo.content;
    }
  }

  showLoading(show, message = "Carregando dados...") {
    const loadingIndicator = document.getElementById("loadingIndicator");
    const searchBtn = document.getElementById("searchBtn");

    if (loadingIndicator) {
      loadingIndicator.style.display = show ? "block" : "none";
      const messageEl = loadingIndicator.querySelector("p");
      if (messageEl) messageEl.textContent = message;
    }

    if (searchBtn) {
      const spinner = searchBtn.querySelector(".loading-spinner");
      const btnText = searchBtn.querySelector("span");
      if (spinner) spinner.style.display = show ? "block" : "none";
      if (btnText) btnText.style.display = show ? "none" : "block";
      searchBtn.disabled = show;
    }
  }

  showMessage(message) {
    const container = document.getElementById("resultsContainer");
    if (!container) return;

    container.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h3>Atenção</h3>
        <p>${message}</p>
      </div>
    `;

    const countElement = document.getElementById("resultsCount");
    const titleElement = document.getElementById("resultsTitle");
    const subtitleElement = document.getElementById("resultsSubtitle");
    const distancesPanel = document.getElementById("distancesPanel");

    if (countElement) countElement.textContent = "0 resultados";
    if (titleElement) titleElement.textContent = "Transportadoras Disponíveis";
    if (subtitleElement)
      subtitleElement.textContent =
        "Encontre as melhores opções para seu frete";
    if (distancesPanel) distancesPanel.style.display = "none";

    this.updateResultsStatus(message);
  }

  showError(message) {
    this.showMessage(`❌ ${message}`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.transportadoraApp = new TransportadoraApp();
});

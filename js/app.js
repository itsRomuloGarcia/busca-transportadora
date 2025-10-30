// Aplicação principal - COM DEBUG MELHORADO
class TransportadoraApp {
  constructor() {
    this.sheetsAPI = new GoogleSheetsAPI();
    this.filtersManager = new FiltersManager();
    this.allData = [];
    this.filteredData = [];

    this.initializeDistanceCalculator();
    this.setupPerformance();
    this.init();
  }

  async initializeDistanceCalculator() {
    return new Promise((resolve) => {
      const checkDC = () => {
        if (window.distanceCalculator && window.distanceCalculator.getDistanceToCity) {
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
      PerformanceManager.measurePerformance("Inicialização da aplicação", () => {
        console.log("📊 Performance monitor ativado");
      });
    }
  }

  async init() {
    try {
      await this.initializeDistanceCalculator();
      
      // DEBUG: Testar carregamento
      await this.debugLoadData();
      
      await this.loadData();

      if (this.allData && this.allData.length > 0) {
        this.filtersManager.init(this.allData);
        console.log("✅ Filtros inicializados com sucesso");
        
        // DEBUG: Mostrar todas as cidades disponíveis
        this.debugShowAvailableCities();
      } else {
        console.error("❌ Não foi possível carregar dados para os filtros");
      }

      this.setupEventListeners();
    } catch (error) {
      console.error("Erro ao inicializar app:", error);
      this.showError("Erro ao inicializar a aplicação.");
    }
  }

  // ✅ NOVO MÉTODO: Mostra cidades disponíveis para debug
  debugShowAvailableCities() {
    if (!this.allData || this.allData.length === 0) return;
    
    const cities = this.extractUniqueCities(this.allData);
    console.log("🏙️ TODAS as cidades disponíveis para busca:", 
      cities.map(c => `${c.cidade}, ${c.uf}`).sort()
    );
    
    // Também mostra no HTML para facilitar
    const debugInfo = document.createElement('div');
    debugInfo.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-size: 12px;
      z-index: 10000;
      max-width: 300px;
      max-height: 200px;
      overflow-y: auto;
    `;
    debugInfo.innerHTML = `
      <strong>🏙️ Cidades Disponíveis:</strong><br>
      ${cities.slice(0, 10).map(c => `${c.cidade}, ${c.uf}`).join('<br>')}
      ${cities.length > 10 ? `<br>... e mais ${cities.length - 10} cidades` : ''}
    `;
    document.body.appendChild(debugInfo);
  }

  async debugLoadData() {
    console.log("🐛 DEBUG: Iniciando debug do carregamento...");
    console.log("📍 Ambiente:", window.location.hostname.includes('vercel') ? 'Vercel' : 'Local');
    
    try {
      const testUrl = "https://docs.google.com/spreadsheets/d/14Fv2BP09fwtErevfOlnuSdRPA4HwSaYxNcpvE6FoZUY/gviz/tq?tqx=out:csv";
      
      console.log("🔍 Testando fetch direto...");
      const response = await fetch(testUrl);
      console.log("📊 Status da resposta:", response.status, response.statusText);
      
      if (response.ok) {
        const text = await response.text();
        console.log("✅ Fetch bem-sucedido. Primeiros 500 chars:", text.substring(0, 500));
      } else {
        console.log("❌ Fetch falhou.");
      }
    } catch (error) {
      console.error("❌ Erro no debug:", error);
    }
  }

  async loadData() {
    this.showLoading(true);

    try {
      console.log("🚀 Iniciando carregamento no app...");
      this.allData = await this.sheetsAPI.loadData();
      console.log("✅ Dados recebidos no app. Total:", this.allData.length);

      if (!this.allData || this.allData.length === 0) {
        console.warn("⚠️ Nenhum dado encontrado na planilha");
        this.showError("Nenhum dado encontrado na planilha.");
      } else {
        console.log(`🎉 ${this.allData.length} registros carregados com sucesso!`);
      }

      this.showLoading(false);
    } catch (error) {
      console.error("❌ Erro crítico ao carregar dados:", error);
      this.showLoading(false);
      this.showError("Erro ao carregar dados da planilha. Recarregue a página.");
    }
  }

  setupEventListeners() {
    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) {
      searchBtn.addEventListener("click", () => {
        this.performSearch();
      });
    }

    // Enter na busca
    const citySearch = document.getElementById("citySearch");
    if (citySearch) {
      citySearch.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.performSearch();
        }
      });
    }

    window.addEventListener("filtersChanged", (event) => {
      const cidade = document.getElementById("citySearch")?.value.trim() || "";
      if (cidade || event.detail.filters.uf || event.detail.filters.modal || event.detail.filters.transportadora) {
        this.applyFilters();
      }
    });
  }

  performSearch() {
    const cidadeInput = document.getElementById("citySearch")?.value.trim() || "";

    if (!cidadeInput) {
      this.showMessage("Digite o nome de uma cidade para buscar.");
      return;
    }

    if (!this.allData || this.allData.length === 0) {
      this.showError("Dados não carregados. Tente recarregar a página.");
      return;
    }

    console.log(`🔍 Iniciando busca por: "${cidadeInput}"`);
    console.log(`📊 Base de dados: ${this.allData.length} registros disponíveis`);
    
    this.showLoading(true, "Buscando transportadoras...");

    setTimeout(() => {
      try {
        this.filteredData = this.filtersManager.filterData(this.allData, cidadeInput);
        console.log(`📊 Resultados da busca: ${this.filteredData.length} encontrados`);
        this.displayResults(this.filteredData, cidadeInput);
      } catch (error) {
        console.error("Erro ao filtrar dados:", error);
        this.showError("Erro ao buscar transportadoras.");
      } finally {
        this.showLoading(false);
      }
    }, 300);
  }

  applyFilters() {
    const cidadeInput = document.getElementById("citySearch")?.value.trim() || "";

    if ((cidadeInput || this.filtersManager.getCurrentFilters().modal || this.filtersManager.getCurrentFilters().transportadora) && this.allData && this.allData.length > 0) {
      this.showLoading(true, "Aplicando filtros...");

      setTimeout(() => {
        try {
          this.filteredData = this.filtersManager.filterData(this.allData, cidadeInput);
          console.log(`📊 Resultados com filtros: ${this.filteredData.length} encontrados`);
          this.displayResults(this.filteredData, cidadeInput);
        } catch (error) {
          console.error("Erro ao aplicar filtros:", error);
          this.showError("Erro ao aplicar filtros.");
        } finally {
          this.showLoading(false);
        }
      }, 200);
    }
  }

  // Extrair cidades únicas
  extractUniqueCities(data) {
    const citiesMap = new Map();

    data.forEach((item) => {
      if (item && item.cidade && item.uf) {
        const key = `${item.cidade.toUpperCase().trim()}_${item.uf.toUpperCase().trim()}`;
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

  // ✅ MÉTODO ATUALIZADO PARA NOVO LAYOUT
  async displayResults(data, cidadeInput) {
    const container = document.getElementById("resultsContainer");
    const countElement = document.getElementById("resultsCount");
    const titleElement = document.getElementById("resultsTitle");
    const subtitleElement = document.getElementById("resultsSubtitle");
    const distancesPanel = document.getElementById("distancesPanel");
    const distancesGrid = document.getElementById("distancesGrid");
    const citiesCount = document.getElementById("citiesCount");

    if (!container || !countElement || !titleElement || !subtitleElement || !distancesPanel || !distancesGrid || !citiesCount) {
      console.error("❌ Elementos do DOM não encontrados");
      return;
    }

    const count = Array.isArray(data) ? data.length : 0;
    countElement.textContent = `${count} resultado${count !== 1 ? "s" : ""}`;

    if (cidadeInput) {
      titleElement.textContent = `Transportadoras para ${cidadeInput.toUpperCase()}`;
      subtitleElement.textContent = `Encontramos ${count} opções para seu frete`;
    } else {
      titleElement.textContent = "Transportadoras Disponíveis";
      subtitleElement.textContent = "Encontre as melhores opções para seu frete";
    }

    if (!data || data.length === 0) {
      console.log("📭 Nenhum resultado encontrado para a busca");
      
      // ✅ MENSAGEM MAIS INFORMATIVA
      const availableCities = this.extractUniqueCities(this.allData);
      const suggestedCities = availableCities
        .filter(city => 
          city.cidade.toLowerCase().includes(cidadeInput.toLowerCase()) ||
          this.filtersManager.checkSimilarity(city.cidade, cidadeInput)
        )
        .slice(0, 5);
      
      let suggestionHTML = '';
      if (suggestedCities.length > 0) {
        suggestionHTML = `
          <div style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
            <p><strong>Sugestões:</strong> ${suggestedCities.map(c => `${c.cidade}, ${c.uf}`).join(' • ')}</p>
          </div>
        `;
      }
      
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          </div>
          <h3>Nenhuma transportadora encontrada</h3>
          <p>Tente ajustar os filtros ou verificar a ortografia da cidade</p>
          ${suggestionHTML}
          <div style="margin-top: 1rem; font-size: 0.8rem; color: var(--text-tertiary);">
            <p><strong>Dica:</strong> Tente buscar por "São Paulo", "Rio de Janeiro" ou "Curitiba"</p>
          </div>
        </div>
      `;
      distancesPanel.style.display = "none";
      return;
    }

    // ✅ EXTRAIR CIDADES ÚNICAS E MOSTRAR PAINEL
    const uniqueCities = this.extractUniqueCities(data);
    console.log(`🏙️ ${uniqueCities.length} cidades únicas encontradas:`, uniqueCities);

    // Atualizar contador de cidades
    citiesCount.textContent = uniqueCities.length;

    // Mostrar painel de distâncias
    distancesPanel.style.display = "block";

    // Criar badges de distâncias
    distancesGrid.innerHTML = uniqueCities.map(city => `
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
    `).join("");

    // Criar cards
    let cards;
    if (window.PerformanceManager) {
      cards = await PerformanceManager.measurePerformance(`Criação de ${data.length} cards`, () => 
        Promise.all(data.map((item) => this.createCard(item)))
      );
    } else {
      cards = await Promise.all(data.map((item) => this.createCard(item)));
    }

    container.innerHTML = cards.join("");

    // Iniciar cálculo de distâncias
    setTimeout(() => {
      this.calculateRealDistances(uniqueCities);
    }, 100);

    // Ativar lazy loading
    if (window.lazyLoader) {
      setTimeout(() => {
        window.lazyLoader.observeAllLazyImages();
      }, 100);
    }
  }

  async createCard(item) {
    if (!item || typeof item !== "object") {
      console.warn("❌ Item inválido para criar card:", item);
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

    return `
    <div class="transport-card" data-city="${cidade}" data-uf="${uf}">
      <div class="card-header">
        <div class="company-logo ${logo.type === "image" ? "image-logo" : "icon-logo"} ${logoClass}">
          ${logoHTML}
        </div>
        <div class="card-title">
          <div class="city-name">${cidade}</div>
          <div class="state">${uf}</div>
        </div>
      </div>
      <div class="card-details">
        <div class="detail-item">
          <span class="detail-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5S5.67 15.5 6 15.5s1.5.67 1.5 1.5S6.83 18.5 6 18.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
            Transportadora
          </span>
          <span class="detail-value">${transportadora}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            Modal
          </span>
          <span class="modal-badge">${modal}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
            Prazo de entrega
          </span>
          <span class="prazo">${diasUteis} dias úteis</span>
        </div>
      </div>
    </div>
    `;
  }

  // Calcular distâncias reais
  async calculateRealDistances(cities) {
    if (!cities || !Array.isArray(cities) || !window.distanceCalculator) {
      console.warn("❌ Dados ou DistanceCalculator não disponíveis");
      this.showFallbackDistances(cities);
      return;
    }

    console.log(`🔄 Calculando distâncias EXATAS para ${cities.length} cidades...`);

    const distancePromises = cities.map(async (city) => {
      try {
        console.log(`📍 Calculando distância EXATA para: ${city.cidade}, ${city.uf}`);
        const realDistance = await this.getRealDistance(city.cidade, city.uf);

        if (realDistance && realDistance > 0) {
          const distanciaFormatada = window.distanceCalculator.formatDistance(realDistance);
          this.updateCityDistance(city.key, distanciaFormatada);
          console.log(`✅ DISTÂNCIA EXATA: ${city.cidade}, ${city.uf}: ${distanciaFormatada}`);
          return { success: true, city: city.key, distance: realDistance };
        } else {
          throw new Error("Distância real não calculada");
        }
      } catch (error) {
        console.error(`❌ Erro ao calcular distância para ${city.cidade}:`, error);
        this.updateCityDistance(city.key, "Erro no cálculo");
        return { success: false, city: city.key, error: error.message };
      }
    });

    const results = await Promise.allSettled(distancePromises);
    const successful = results.filter(r => r.status === "fulfilled" && r.value.success).length;
    const failed = results.filter(r => r.status === "rejected" || !r.value?.success).length;

    console.log(`🎯 Cálculos concluídos: ${successful} sucessos, ${failed} falhas`);
  }

  // Obter distância real
  async getRealDistance(cityName, state) {
    try {
      const preciseDistance = await window.distanceCalculator.getDistanceWithFallback(cityName, state);

      if (preciseDistance && preciseDistance > 0) {
        console.log(`📏 Distância EXATA calculada: ${cityName} - ${preciseDistance}km`);
        return preciseDistance;
      } else {
        throw new Error("Distância precisa não disponível");
      }
    } catch (error) {
      console.error(`❌ Falha no cálculo para ${cityName}:`, error);
      const fallbackDistance = window.distanceCalculator.estimateDistanceByState(state);
      console.log(`🔄 Usando fallback para ${cityName}: ${fallbackDistance}km`);
      return fallbackDistance;
    }
  }

  // Fallback para distâncias
  showFallbackDistances(cities) {
    if (!cities) return;
    
    cities.forEach(city => {
      const fallbackDistance = window.distanceCalculator ? 
        window.distanceCalculator.estimateDistanceByState(city.uf) : 0;
      const formattedDistance = window.distanceCalculator ? 
        window.distanceCalculator.formatDistance(fallbackDistance) : "Indisponível";
      
      this.updateCityDistance(city.key, formattedDistance);
    });
  }

  // Atualizar distância
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
          onerror="this.onerror=null; this.src='${logo.fallback || "https://via.placeholder.com/60x60/6B7280/FFFFFF?text=" + transportadora.substring(0, 3)}'"
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
    if (subtitleElement) subtitleElement.textContent = "Encontre as melhores opções para seu frete";
    if (distancesPanel) distancesPanel.style.display = "none";
  }

  showError(message) {
    this.showMessage(`❌ ${message}`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.transportadoraApp = new TransportadoraApp();
});

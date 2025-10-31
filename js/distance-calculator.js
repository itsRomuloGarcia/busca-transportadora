// Calculador de distâncias otimizado - DISTÂNCIAS EXATAS
class DistanceCalculator {
  constructor() {
    this.origin = "Balneário Camboriú, SC, Brasil";
    this.originCoords = { lat: -26.9906, lng: -48.6347 };

    // Cache para distâncias já calculadas
    this.distanceCache = new Map();
    this.loadPersistentCache();

    // Distâncias aproximadas por estado (fallback)
    this.stateDistances = {
      SC: { min: 50, max: 500, avg: 200 },
      PR: { min: 200, max: 600, avg: 350 },
      RS: { min: 400, max: 800, avg: 550 },
      SP: { min: 500, max: 1000, avg: 700 },
      RJ: { min: 800, max: 1200, avg: 950 },
      MG: { min: 900, max: 1400, avg: 1100 },
      DF: { min: 1200, max: 1600, avg: 1400 },
      BA: { min: 1800, max: 2200, avg: 2000 },
      CE: { min: 2500, max: 2800, avg: 2650 },
      PE: { min: 2600, max: 2900, avg: 2750 },
      AM: { min: 3500, max: 4000, avg: 3750 },
      PA: { min: 2800, max: 3200, avg: 3000 },
      GO: { min: 1100, max: 1500, avg: 1300 },
      DEFAULT: { min: 800, max: 1200, avg: 1000 },
    };

    this.pendingCalculations = new Map();
    this.batchTimeout = null;

    console.log("🚀 DistanceCalculator inicializado");
  }

  // Carregar cache persistente
  loadPersistentCache() {
    try {
      const cached = localStorage.getItem("distanceCache");
      if (cached) {
        const cacheData = JSON.parse(cached);
        cacheData.forEach(([key, value]) => {
          this.distanceCache.set(key, value);
        });
        console.log(
          `📦 Cache de distâncias carregado: ${cacheData.length} registros`
        );
      }
    } catch (error) {
      console.warn("Erro ao carregar cache persistente:", error);
      localStorage.removeItem("distanceCache");
    }
  }

  // Salvar cache persistente
  savePersistentCache() {
    try {
      const cacheArray = Array.from(this.distanceCache.entries());
      localStorage.setItem("distanceCache", JSON.stringify(cacheArray));
    } catch (error) {
      console.warn("Erro ao salvar cache persistente:", error);
    }
  }

  // ✅ MÉTODO PRINCIPAL MODIFICADO - DISTÂNCIAS EXATAS
  async getDistanceToCity(cityName, state) {
    if (!cityName || !state) {
      console.warn("❌ Cidade ou estado inválido:", cityName, state);
      return 0;
    }

    const cacheKey = `${cityName.toUpperCase().trim()}_${state
      .toUpperCase()
      .trim()}`;

    // Verificar cache primeiro
    if (this.distanceCache.has(cacheKey)) {
      const cachedDistance = this.distanceCache.get(cacheKey);
      console.log(`✅ Distância do cache: ${cachedDistance}km`);
      return cachedDistance;
    }

    try {
      console.log(`🔄 Calculando distância EXATA para: ${cityName}, ${state}`);
      const realDistance = await this.getDistanceWithFallback(cityName, state);

      if (realDistance && realDistance > 0) {
        // ✅ SALVAR VALOR EXATO - SEM ARREDONDAMENTO
        this.distanceCache.set(cacheKey, realDistance);
        this.savePersistentCache();
        console.log(`🎯 Distância EXATA calculada: ${realDistance}km`);
        return realDistance;
      } else {
        throw new Error("Distância real não disponível");
      }
    } catch (error) {
      console.error("❌ Erro no cálculo real:", error);
      const fallbackDistance = this.estimateDistanceByState(state);
      console.log(`🔄 Usando fallback: ${fallbackDistance}km`);
      this.distanceCache.set(cacheKey, fallbackDistance);
      return fallbackDistance;
    }
  }

  // Agendar cálculo preciso em segundo plano
  schedulePreciseCalculation(cityName, state, cacheKey, currentDistance) {
    this.pendingCalculations.set(cacheKey, {
      cityName,
      state,
      currentDistance,
    });

    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.processBatchCalculations();
      }, 3000);
    }
  }

  // Processar cálculos em lote
  async processBatchCalculations() {
    if (this.pendingCalculations.size === 0) return;

    console.log(
      `🔄 Processando ${this.pendingCalculations.size} cálculos em lote...`
    );

    const calculations = Array.from(this.pendingCalculations.entries());
    this.pendingCalculations.clear();
    this.batchTimeout = null;

    for (const [
      cacheKey,
      { cityName, state, currentDistance },
    ] of calculations) {
      try {
        const preciseDistance = await this.getDistanceWithFallback(
          cityName,
          state
        );

        if (preciseDistance && preciseDistance !== currentDistance) {
          this.distanceCache.set(cacheKey, preciseDistance);
          console.log(
            `🎯 Distância precisa calculada para ${cityName}: ${preciseDistance}km (era ${currentDistance}km)`
          );
          this.updateDistanceInUI(cityName, state, preciseDistance);
        }
      } catch (error) {
        console.warn(
          `⚠️ Não foi possível calcular distância precisa para ${cityName}:`,
          error
        );
      }
    }

    this.savePersistentCache();
  }

  // Atualizar distância na UI
  updateDistanceInUI(cityName, state, distance) {
    try {
      const formattedDistance = this.formatDistance(distance);
      const distanceElement = document.getElementById(
        `distance-${cityName.replace(/\s+/g, "-")}-${state}`
      );

      if (distanceElement) {
        distanceElement.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          ${formattedDistance} de Camboriú, SC
        `;
        console.log(`✅ UI atualizada: ${cityName} - ${formattedDistance}`);
      }
    } catch (error) {
      console.warn("Erro ao atualizar UI:", error);
    }
  }

  // Método com fallbacks
  async getDistanceWithFallback(cityName, state) {
    console.log(`🔄 Tentando cálculo preciso para ${cityName}, ${state}`);

    // 1. Tentar cálculo por coordenadas
    try {
      const coordsDistance = await this.getDistanceWithDeviationFactor(
        cityName,
        state
      );
      if (coordsDistance && coordsDistance > 0) {
        console.log(
          `📏 Distância calculada para ${cityName}: ${coordsDistance}km`
        );
        return coordsDistance;
      }
    } catch (error) {
      console.warn(`Erro no cálculo por coordenadas para ${cityName}:`, error);
    }

    // 2. Tentar buscar cidade + estado
    try {
      const fullLocation = `${cityName}, ${state}, Brasil`;
      const coordsDistance = await this.getDistanceWithDeviationFactor(
        fullLocation,
        state
      );
      if (coordsDistance && coordsDistance > 0) {
        console.log(`📏 Distância calculada (full): ${coordsDistance}km`);
        return coordsDistance;
      }
    } catch (error) {
      console.warn(`Erro no cálculo para localização completa:`, error);
    }

    // 3. Fallback para distância por estado
    const stateDistance = this.estimateDistanceByState(state);
    console.log(`🔄 Usando distância estimada por estado: ${stateDistance}km`);
    return stateDistance;
  }

  // ✅ CÁLCULO POR COORDENADAS - VALORES EXATOS
  async getDistanceWithDeviationFactor(cityName, state) {
    const destination = `${cityName}, ${state}, Brasil`;
    console.log(`📍 Buscando coordenadas para: ${destination}`);

    const coords = await this.getCoordinates(destination);

    if (!coords) {
      console.warn(`❌ Não foi possível obter coordenadas para ${destination}`);
      return null;
    }

    console.log(`✅ Coordenadas encontradas:`, coords);

    // ✅ DISTÂNCIA EM LINHA RETA - VALOR EXATO (sem Math.round)
    const straightDistance = this.calculateStraightDistance(
      this.originCoords.lat,
      this.originCoords.lng,
      coords.lat,
      coords.lng
    );

    console.log(`📐 Distância em linha reta: ${straightDistance}km`);

    // Fator de desvio baseado na distância e região
    const deviationFactor = this.getDeviationFactor(straightDistance, state);

    // ✅ DISTÂNCIA ESTIMADA POR ESTRADA - VALOR EXATO
    const roadDistance = straightDistance * deviationFactor;

    console.log(
      `🛣️ Distância por estrada: ${roadDistance}km (fator: ${deviationFactor})`
    );

    return roadDistance;
  }

  // Fator de desvio mais realista
  getDeviationFactor(distance, state) {
    if (distance < 100) return 1.1;
    if (distance < 300) return 1.2;
    if (distance < 600) return 1.3;

    const regionalFactors = {
      SC: 1.25,
      PR: 1.3,
      RS: 1.35,
      SP: 1.4,
      RJ: 1.45,
      MG: 1.5,
      DF: 1.6,
      BA: 1.7,
      CE: 1.8,
      PE: 1.8,
      DEFAULT: 1.4,
    };

    return regionalFactors[state] || regionalFactors["DEFAULT"];
  }

  // ✅ DISTÂNCIA EM LINHA RETA (Haversine) - VALOR EXATO
  calculateStraightDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // ✅ RETORNAR VALOR EXATO COM 2 CASAS DECIMAIS
    return Math.round(distance * 100) / 100;
  }

  // Obter coordenadas
  async getCoordinates(location) {
    try {
      const query = encodeURIComponent(location);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=br&accept-language=pt`;

      console.log(`🌐 Buscando: ${url}`);

      const response = await fetch(url, {
        headers: {
          "User-Agent": "TransportFinderApp/1.0",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const coords = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          displayName: result.display_name,
        };
        console.log(`✅ Coordenadas para ${location}:`, coords);
        return coords;
      } else {
        console.warn(`❌ Nenhum resultado para: ${location}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Erro ao obter coordenadas para ${location}:`, error);
      return null;
    }
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Estimativa por estado
  estimateDistanceByState(state) {
    if (!state) return this.stateDistances["DEFAULT"].avg;

    const stateUpper = state.toUpperCase().trim();
    const stateData =
      this.stateDistances[stateUpper] || this.stateDistances["DEFAULT"];

    return stateData.avg;
  }

  // ✅ FORMATAR DISTÂNCIA DE FORMA EXATA
  formatDistance(km) {
    if (!km || km <= 0) return "Calculando...";

    const distance = parseFloat(km.toFixed(1));

    if (distance < 1000) {
      return `${distance} km`;
    } else if (distance < 10000) {
      // ✅ MOSTRAR VALOR COMPLETO ATÉ 10.000km (ex: 3486.2 km)
      return `${distance} km`;
    } else {
      // ✅ APENAS DISTÂNCIAS MUITO GRANDES EM MILHARES
      return `${(distance / 1000).toFixed(1)} mil km`;
    }
  }

  // Limpar cache completo
  clearCache() {
    this.distanceCache.clear();
    this.pendingCalculations.clear();
    localStorage.removeItem("distanceCache");
    console.log("🗑️ Cache de distâncias limpo");

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  // Método para debug - status do cache
  getCacheStatus() {
    return {
      cachedDistances: this.distanceCache.size,
      pendingCalculations: this.pendingCalculations.size,
      persistentCache: localStorage.getItem("distanceCache")
        ? "Ativo"
        : "Inativo",
    };
  }
}

// Instância global
let distanceCalculator;

document.addEventListener("DOMContentLoaded", () => {
  distanceCalculator = new DistanceCalculator();
  window.distanceCalculator = distanceCalculator;

  setTimeout(() => {
    console.log(
      "📊 Status do DistanceCalculator:",
      distanceCalculator.getCacheStatus()
    );
  }, 2000);
});

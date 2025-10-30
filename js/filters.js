// Gerenciamento de filtros simplificado - ATUALIZADO PARA DEPLOY
class FiltersManager {
  constructor() {
    this.filters = {
      cidade: "",
      uf: "",
      modal: "",
      transportadora: "",
    };

    this.availableFilters = {
      modais: new Set(),
      transportadoras: new Set(),
    };
  }

  // Inicializa os filtros
  init(data) {
    console.log("🔧 Inicializando filtros com dados:", data?.length || 0);
    this.extractAvailableFilters(data);
    this.populateFilterOptions();
    this.setupEventListeners();
  }

  // Extrai valores únicos para os filtros
  extractAvailableFilters(data) {
    if (!data || !Array.isArray(data)) {
      console.warn("Dados inválidos para extrair filtros");
      // Usa valores padrão se não houver dados
      this.availableFilters.modais = new Set(["RODOVIÁRIO", "AÉREO"]);
      this.availableFilters.transportadoras = new Set(["JAMEF", "MOVVI", "AZUL CARGO"]);
      return;
    }

    console.log("📊 Extraindo filtros disponíveis...");
    data.forEach((item) => {
      if (item && typeof item === "object") {
        if (item.modal && typeof item.modal === "string")
          this.availableFilters.modais.add(item.modal);
        if (item.transportadora && typeof item.transportadora === "string")
          this.availableFilters.transportadoras.add(item.transportadora);
      }
    });

    console.log("✅ Filtros extraídos:", {
      modais: Array.from(this.availableFilters.modais),
      transportadoras: Array.from(this.availableFilters.transportadoras)
    });
  }

  // Preenche as opções dos selects
  populateFilterOptions() {
    this.populateSelect("modalFilter", this.availableFilters.modais);
    this.populateSelect("carrierFilter", this.availableFilters.transportadoras);
    console.log("✅ Opções de filtro preenchidas");
  }

  populateSelect(selectId, valuesSet) {
    const select = document.getElementById(selectId);
    if (!select) {
      console.warn(`❌ Select não encontrado: ${selectId}`);
      return;
    }

    // Limpa opções existentes (exceto a primeira)
    while (select.children.length > 1) {
      select.removeChild(select.lastChild);
    }

    const options = Array.from(valuesSet).sort();

    options.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });

    console.log(`✅ ${selectId} preenchido com ${options.length} opções`);
  }

  // Configura os event listeners
  setupEventListeners() {
    // Aplicar filtros
    const applyBtn = document.getElementById("applyFilters");
    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        console.log("🔄 Aplicando filtros manualmente");
        this.applyFilters();
      });
    } else {
      console.warn("❌ Botão applyFilters não encontrado");
    }

    // Limpar filtros
    const clearBtn = document.getElementById("clearFilters");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        console.log("🗑️ Limpando filtros");
        this.clearFilters();
      });
    } else {
      console.warn("❌ Botão clearFilters não encontrado");
    }

    // Busca por Enter
    const citySearch = document.getElementById("citySearch");
    if (citySearch) {
      citySearch.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          console.log("↵ Enter pressionado na busca");
          const searchBtn = document.getElementById("searchBtn");
          if (searchBtn) searchBtn.click();
        }
      });
    } else {
      console.warn("❌ Input citySearch não encontrado");
    }

    // Aplicar filtros automaticamente quando selects mudarem
    const modalFilter = document.getElementById("modalFilter");
    const carrierFilter = document.getElementById("carrierFilter");

    if (modalFilter) {
      modalFilter.addEventListener("change", () => {
        console.log("📦 Modal alterado:", modalFilter.value);
        this.applyFilters();
      });
    }

    if (carrierFilter) {
      carrierFilter.addEventListener("change", () => {
        console.log("🚚 Transportadora alterada:", carrierFilter.value);
        this.applyFilters();
      });
    }

    console.log("✅ Event listeners dos filtros configurados");
  }

  // Aplica os filtros
  applyFilters() {
    const cidadeInput = document.getElementById("citySearch")?.value.trim() || "";

    // Extrai cidade e UF do input (formato: "CIDADE, UF")
    let cidade = "";
    let uf = "";

    if (cidadeInput.includes(",")) {
      const parts = cidadeInput.split(",").map((part) => part.trim());
      cidade = parts[0] || "";
      uf = parts[1] || "";
    } else {
      cidade = cidadeInput;
    }

    this.filters.cidade = cidade;
    this.filters.uf = uf;
    this.filters.modal = document.getElementById("modalFilter")?.value || "";
    this.filters.transportadora = document.getElementById("carrierFilter")?.value || "";

    console.log("🎯 Filtros aplicados:", this.filters);

    // Dispara evento customizado para notificar a aplicação
    window.dispatchEvent(
      new CustomEvent("filtersChanged", {
        detail: { filters: this.filters },
      })
    );
  }

  // Limpa todos os filtros
  clearFilters() {
    const citySearch = document.getElementById("citySearch");
    const modalFilter = document.getElementById("modalFilter");
    const carrierFilter = document.getElementById("carrierFilter");

    if (citySearch) citySearch.value = "";
    if (modalFilter) modalFilter.value = "";
    if (carrierFilter) carrierFilter.value = "";

    this.filters.cidade = "";
    this.filters.uf = "";
    this.filters.modal = "";
    this.filters.transportadora = "";

    console.log("🗑️ Filtros limpos");

    window.dispatchEvent(
      new CustomEvent("filtersChanged", {
        detail: { filters: this.filters },
      })
    );
  }

  // Filtra os dados com busca flexível
  filterData(data, cidadeInput = "") {
    if (!data || !Array.isArray(data)) {
      console.warn("Dados inválidos para filtragem");
      return [];
    }

    console.log(`🔍 Filtrando ${data.length} registros...`);

    // Processa o input da cidade para busca flexível
    let cidade = "";
    let uf = "";

    if (cidadeInput.includes(",")) {
      const parts = cidadeInput.split(",").map((part) => part.trim());
      cidade = parts[0] || "";
      uf = parts[1] || "";
    } else {
      cidade = cidadeInput;
    }

    this.filters.cidade = cidade.toUpperCase();
    this.filters.uf = uf.toUpperCase();

    console.log(`🎯 Critérios de busca: cidade="${this.filters.cidade}", uf="${this.filters.uf}", modal="${this.filters.modal}", transportadora="${this.filters.transportadora}"`);

    const filteredData = data.filter((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const itemCidade = item.cidade || "";
      const itemUf = item.uf || "";
      const itemModal = item.modal || "";
      const itemTransportadora = item.transportadora || "";

      // ✅ BUSCA FLEXÍVEL - normaliza strings para comparação
      const normalizeString = (str) => {
        return str
          .toUpperCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Remove acentos
          .replace(/-/g, " ") // Substitui hífens por espaços
          .trim();
      };

      const normalizedItemCidade = normalizeString(itemCidade);
      const normalizedFilterCidade = normalizeString(this.filters.cidade);

      // Busca por cidade (flexível - includes)
      const matchesCidade =
        !this.filters.cidade ||
        normalizedItemCidade.includes(normalizedFilterCidade) ||
        normalizedFilterCidade.includes(normalizedItemCidade);

      // Busca por UF (exata)
      const matchesUf = !this.filters.uf || 
        itemUf.toUpperCase() === this.filters.uf;

      // Busca por modal (exata)
      const matchesModal = !this.filters.modal || 
        itemModal === this.filters.modal;

      // Busca por transportadora (exata)
      const matchesTransportadora = !this.filters.transportadora || 
        itemTransportadora === this.filters.transportadora;

      const matches = matchesCidade && matchesUf && matchesModal && matchesTransportadora;
      
      if (matches && this.filters.cidade) {
        console.log(`✅ Item encontrado: ${itemCidade}, ${itemUf} - ${itemTransportadora} (${itemModal})`);
      }

      return matches;
    });

    console.log(`📊 Filtragem concluída: ${filteredData.length} de ${data.length} registros`);
    return filteredData;
  }

  // Retorna os filtros atuais
  getCurrentFilters() {
    return { ...this.filters };
  }
}

// Gerenciamento de filtros simplificado
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
    this.extractAvailableFilters(data);
    this.populateFilterOptions();
    this.setupEventListeners();
  }

  // Extrai valores únicos para os filtros
  extractAvailableFilters(data) {
    if (!data || !Array.isArray(data)) {
      console.warn("Dados inválidos para extrair filtros");
      return;
    }

    data.forEach((item) => {
      if (item && typeof item === "object") {
        if (item.modal && typeof item.modal === "string")
          this.availableFilters.modais.add(item.modal);
        if (item.transportadora && typeof item.transportadora === "string")
          this.availableFilters.transportadoras.add(item.transportadora);
      }
    });
  }

  // Preenche as opções dos selects
  populateFilterOptions() {
    this.populateSelect("modalFilter", this.availableFilters.modais);
    this.populateSelect("carrierFilter", this.availableFilters.transportadoras);
  }

  populateSelect(selectId, valuesSet) {
    const select = document.getElementById(selectId);
    if (!select) return;

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
  }

  // Configura os event listeners
  setupEventListeners() {
    // Aplicar filtros
    const applyBtn = document.getElementById("applyFilters");
    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        this.applyFilters();
      });
    }

    // Limpar filtros
    const clearBtn = document.getElementById("clearFilters");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        this.clearFilters();
      });
    }

    // Busca por Enter
    const citySearch = document.getElementById("citySearch");
    if (citySearch) {
      citySearch.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          const searchBtn = document.getElementById("searchBtn");
          if (searchBtn) searchBtn.click();
        }
      });
    }

    // Aplicar filtros automaticamente quando selects mudarem
    const modalFilter = document.getElementById("modalFilter");
    const carrierFilter = document.getElementById("carrierFilter");

    if (modalFilter) {
      modalFilter.addEventListener("change", () => {
        this.applyFilters();
      });
    }

    if (carrierFilter) {
      carrierFilter.addEventListener("change", () => {
        this.applyFilters();
      });
    }
  }

  // Aplica os filtros
  applyFilters() {
    const cidadeInput =
      document.getElementById("citySearch")?.value.trim() || "";

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
    this.filters.transportadora =
      document.getElementById("carrierFilter")?.value || "";

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

    window.dispatchEvent(
      new CustomEvent("filtersChanged", {
        detail: { filters: this.filters },
      })
    );
  }

  // No método filterData, substitua a parte de matching da cidade:
  filterData(data, cidadeInput = "") {
    if (!data || !Array.isArray(data)) {
      console.warn("Dados inválidos para filtragem");
      return [];
    }

    // Processa o input da cidade para busca exata
    let cidade = "";
    let uf = "";

    if (cidadeInput.includes(",")) {
      const parts = cidadeInput.split(",").map((part) => part.trim());
      cidade = parts[0] || "";
      uf = parts[1] || "";
    } else {
      cidade = cidadeInput;
    }

    this.filters.cidade = cidade.toUpperCase(); // Busca exata em maiúsculas
    this.filters.uf = uf;

    return data.filter((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const itemCidade = item.cidade || "";
      const itemUf = item.uf || "";
      const itemModal = item.modal || "";
      const itemTransportadora = item.transportadora || "";

      // BUSCA EXATA - compara nomes normalizados
      const matchesCidade =
        !this.filters.cidade ||
        itemCidade.toUpperCase() === this.filters.cidade;

      const matchesUf = !this.filters.uf || itemUf === this.filters.uf;
      const matchesModal =
        !this.filters.modal || itemModal === this.filters.modal;
      const matchesTransportadora =
        !this.filters.transportadora ||
        itemTransportadora === this.filters.transportadora;

      return (
        matchesCidade && matchesUf && matchesModal && matchesTransportadora
      );
    });
  }

  // Retorna os filtros atuais
  getCurrentFilters() {
    return { ...this.filters };
  }
}

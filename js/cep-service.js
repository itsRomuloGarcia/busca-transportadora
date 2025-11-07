// Serviço de busca por CEP usando ViaCEP
class CepService {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Alternância entre abas
    const cityTab = document.getElementById("cityTab");
    const cepTab = document.getElementById("cepTab");
    const deliveryTab = document.getElementById("deliveryTab");

    if (cityTab && cepTab && deliveryTab) {
      cityTab.addEventListener("click", () => this.switchTab("city"));
      cepTab.addEventListener("click", () => this.switchTab("cep"));
      deliveryTab.addEventListener("click", () => this.switchTab("delivery"));
    }

    // Busca por CEP
    const cepSearch = document.getElementById("cepSearch");
    const searchCepBtn = document.getElementById("searchCepBtn");

    if (cepSearch && searchCepBtn) {
      // Buscar ao clicar no botão
      searchCepBtn.addEventListener("click", () => this.searchCep());

      // Buscar ao pressionar Enter
      cepSearch.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.searchCep();
        }
      });

      // Formatação automática do CEP
      cepSearch.addEventListener("input", (e) => {
        this.formatCep(e.target);
      });
    }

    // Usar endereço do CEP
    const useCepAddress = document.getElementById("useCepAddress");
    if (useCepAddress) {
      useCepAddress.addEventListener("click", () => this.useCepAddress());
    }
  }

  switchTab(tab) {
    const cityTab = document.getElementById("cityTab");
    const cepTab = document.getElementById("cepTab");
    const deliveryTab = document.getElementById("deliveryTab");
    const citySearchTab = document.getElementById("citySearchTab");
    const cepSearchTab = document.getElementById("cepSearchTab");
    const deliverySearchTab = document.getElementById("deliverySearchTab");

    // Remover active de todas as abas
    [cityTab, cepTab, deliveryTab].forEach((tab) =>
      tab?.classList.remove("active")
    );
    [citySearchTab, cepSearchTab, deliverySearchTab].forEach((tab) =>
      tab?.classList.remove("active")
    );

    // Ativar aba selecionada
    if (tab === "city") {
      cityTab?.classList.add("active");
      citySearchTab?.classList.add("active");
    } else if (tab === "cep") {
      cepTab?.classList.add("active");
      cepSearchTab?.classList.add("active");

      // Focar no input do CEP quando mudar para a aba
      setTimeout(() => {
        document.getElementById("cepSearch")?.focus();
      }, 100);
    } else if (tab === "delivery") {
      deliveryTab?.classList.add("active");
      deliverySearchTab?.classList.add("active");

      // Focar no primeiro input da calculadora
      setTimeout(() => {
        document.getElementById("deliveryDate")?.focus();
      }, 100);
    }

    // Limpar resultados anteriores
    this.clearCepResults();
  }

  formatCep(input) {
    // Remove tudo que não é número
    let value = input.value.replace(/\D/g, "");

    // Limita a 8 caracteres
    value = value.substring(0, 8);

    // Adiciona hífen após 5 dígitos
    if (value.length > 5) {
      value = value.substring(0, 5) + "-" + value.substring(5);
    }

    input.value = value;
  }

  async searchCep() {
    const cepInput = document.getElementById("cepSearch");
    const searchCepBtn = document.getElementById("searchCepBtn");
    const cepResult = document.getElementById("cepResult");
    const cepError = document.getElementById("cepError");

    if (!cepInput || !searchCepBtn) return;

    const cep = cepInput.value.replace(/\D/g, "");

    // Validação básica do CEP
    if (cep.length !== 8) {
      this.showCepError("Digite um CEP válido com 8 dígitos");
      return;
    }

    // Mostrar loading
    this.showCepLoading(true);
    this.clearCepResults();

    try {
      console.log(`📮 Buscando CEP: ${cep}`);

      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

      if (!response.ok) {
        throw new Error("Erro na consulta do CEP");
      }

      const data = await response.json();

      if (data.erro) {
        throw new Error("CEP não encontrado");
      }

      console.log("✅ CEP encontrado:", data);
      this.showCepResult(data);
    } catch (error) {
      console.error("❌ Erro ao buscar CEP:", error);
      this.showCepError(error.message || "Erro ao buscar CEP");
    } finally {
      this.showCepLoading(false);
    }
  }

  showCepLoading(show) {
    const searchCepBtn = document.getElementById("searchCepBtn");
    if (!searchCepBtn) return;

    const spinner = searchCepBtn.querySelector(".loading-spinner");
    const btnText = searchCepBtn.querySelector("span");

    if (spinner) spinner.style.display = show ? "block" : "none";
    if (btnText) btnText.style.display = show ? "none" : "block";
    searchCepBtn.disabled = show;
  }

  showCepResult(data) {
    const cepResult = document.getElementById("cepResult");
    const cepAddress = document.getElementById("cepAddress");
    const cepCity = document.getElementById("cepCity");
    const cepError = document.getElementById("cepError");

    if (!cepResult || !cepAddress || !cepCity) return;

    // Esconder erro se estiver visível
    if (cepError) cepError.style.display = "none";

    // Formatando o endereço
    let address = "";
    if (data.logradouro) address += data.logradouro;
    if (data.complemento) address += `, ${data.complemento}`;
    if (data.bairro) address += ` - ${data.bairro}`;

    // Formatando cidade/UF - MANTÉM ORIGINAL para exibição
    const city = `${data.localidade}, ${data.uf}`;

    cepAddress.textContent = address || "Endereço não especificado";
    cepCity.textContent = city;

    cepResult.style.display = "block";
  }

  showCepError(message) {
    const cepError = document.getElementById("cepError");
    const cepErrorMessage = document.getElementById("cepErrorMessage");
    const cepResult = document.getElementById("cepResult");

    if (!cepError || !cepErrorMessage) return;

    // Esconder resultado se estiver visível
    if (cepResult) cepResult.style.display = "none";

    cepErrorMessage.textContent = message;
    cepError.style.display = "block";
  }

  clearCepResults() {
    const cepResult = document.getElementById("cepResult");
    const cepError = document.getElementById("cepError");

    if (cepResult) cepResult.style.display = "none";
    if (cepError) cepError.style.display = "none";
  }

  // ✅ MÉTODO ATUALIZADO: Formata cidade para maiúsculo e sem acentos
  useCepAddress() {
    const cepAddress = document.getElementById("cepAddress");
    const cepCity = document.getElementById("cepCity");

    if (!cepAddress || !cepCity) return;

    const cityState = cepCity.textContent.trim(); // Ex: "São Paulo, SP"

    // ✅ FORMATAÇÃO: Converte para maiúsculo e remove acentos
    const formattedCityState = this.formatCityForDatabase(cityState);

    // Preencher o campo de busca por cidade
    const citySearch = document.getElementById("citySearch");
    if (citySearch) {
      citySearch.value = formattedCityState;

      // NOVO: Também preenche os campos da calculadora de entrega
      this.fillDeliveryCalculator(cityState);

      // Mudar para a aba de cidade
      this.switchTab("city");

      // Disparar a busca automaticamente
      setTimeout(() => {
        const searchBtn = document.getElementById("searchBtn");
        if (searchBtn) {
          searchBtn.click();
        }
      }, 300);
    }
  }

  // ✅ NOVO MÉTODO: Preenche a calculadora de entrega com dados do CEP
  fillDeliveryCalculator(cityState) {
    if (!cityState) return;

    const parts = cityState.split(",").map((part) => part.trim());
    const city = parts[0] || "";
    const state = parts[1] || "";

    const deliveryCity = document.getElementById("deliveryCity");
    const deliveryState = document.getElementById("deliveryState");

    if (deliveryCity && city) {
      deliveryCity.value = city.toUpperCase();
    }

    if (deliveryState && state) {
      deliveryState.value = state.toUpperCase();
    }

    console.log(
      `📍 Dados do CEP preenchidos na calculadora: ${city}, ${state}`
    );
  }

  // ✅ NOVO MÉTODO: Formata cidade para o padrão do banco de dados
  formatCityForDatabase(cityState) {
    if (!cityState) return "";

    // Separa cidade e estado (ex: "São Paulo, SP" → ["São Paulo", "SP"])
    const parts = cityState.split(",").map((part) => part.trim());
    let city = parts[0] || "";
    const state = parts[1] || "";

    // Remove acentos e converte para maiúsculo
    city = city
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .toUpperCase();

    // Retorna no formato "CIDADE, UF"
    if (state) {
      return `${city}, ${state.toUpperCase()}`;
    }

    return city;
  }

  // Método para buscar CEP programaticamente
  async searchCepByNumber(cep) {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

      if (!response.ok) {
        throw new Error("Erro na consulta do CEP");
      }

      const data = await response.json();

      if (data.erro) {
        throw new Error("CEP não encontrado");
      }

      return data;
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      throw error;
    }
  }
}

// Inicializar o serviço de CEP
let cepService;

document.addEventListener("DOMContentLoaded", () => {
  cepService = new CepService();
  console.log("📮 Serviço de CEP inicializado com formatação automática");
});

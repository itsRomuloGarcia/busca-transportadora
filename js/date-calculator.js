// Calculadora de Data de Entrega
class DateCalculator {
  constructor() {
    this.allData = [];
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.populateCarrierOptions();
  }

  async loadData() {
    try {
      if (window.transportadoraApp && window.transportadoraApp.allData) {
        this.allData = window.transportadoraApp.allData;
        console.log(
          "✅ Dados carregados para calculadora:",
          this.allData.length,
          "registros"
        );
      } else {
        // Fallback: carrega dados diretamente se necessário
        const sheetsAPI = new GoogleSheetsAPI();
        this.allData = await sheetsAPI.loadData();
        console.log(
          "✅ Dados carregados diretamente:",
          this.allData.length,
          "registros"
        );
      }
    } catch (error) {
      console.error("❌ Erro ao carregar dados para calculadora:", error);
      this.allData = [];
    }
  }

  setupEventListeners() {
    const calculateBtn = document.getElementById("calculateDelivery");
    const deliveryTab = document.getElementById("deliveryTab");

    if (calculateBtn) {
      calculateBtn.addEventListener("click", () => {
        this.calculateDelivery();
      });
    }

    if (deliveryTab) {
      deliveryTab.addEventListener("click", () => {
        this.switchToDeliveryTab();
      });
    }

    // Auto-preenche data atual
    this.setDefaultDate();
  }

  setDefaultDate() {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    const deliveryDateInput = document.getElementById("deliveryDate");

    if (deliveryDateInput) {
      deliveryDateInput.value = formattedDate;
      deliveryDateInput.min = formattedDate; // Não permite datas passadas
    }
  }

  populateCarrierOptions() {
    const carrierSelect = document.getElementById("deliveryCarrier");
    if (!carrierSelect) return;

    // Limpa opções existentes (exceto a primeira)
    while (carrierSelect.children.length > 1) {
      carrierSelect.removeChild(carrierSelect.lastChild);
    }

    // Extrai transportadoras únicas dos dados
    const carriers = new Set();
    this.allData.forEach((item) => {
      if (item.transportadora) {
        carriers.add(item.transportadora);
      }
    });

    // Ordena e adiciona ao select
    const sortedCarriers = Array.from(carriers).sort();
    sortedCarriers.forEach((carrier) => {
      const option = document.createElement("option");
      option.value = carrier;
      option.textContent = carrier;
      carrierSelect.appendChild(option);
    });

    console.log(
      `🚚 ${sortedCarriers.length} transportadoras carregadas para cálculo`
    );
  }

  switchToDeliveryTab() {
    // Garante que os dados estão atualizados
    if (this.allData.length === 0) {
      this.loadData();
    }
  }

  calculateDelivery() {
    const dateInput = document.getElementById("deliveryDate");
    const cityInput = document.getElementById("deliveryCity");
    const stateSelect = document.getElementById("deliveryState");
    const carrierSelect = document.getElementById("deliveryCarrier");

    // Validações
    if (!dateInput.value) {
      this.showError("Selecione a data de saída");
      return;
    }

    if (!cityInput.value.trim()) {
      this.showError("Digite a cidade de destino");
      return;
    }

    if (!stateSelect.value) {
      this.showError("Selecione o estado de destino");
      return;
    }

    if (!carrierSelect.value) {
      this.showError("Selecione a transportadora");
      return;
    }

    this.showLoading(true);

    // Simula um pequeno delay para melhor UX
    setTimeout(() => {
      try {
        const result = this.performCalculation(
          dateInput.value,
          cityInput.value.trim().toUpperCase(),
          stateSelect.value,
          carrierSelect.value
        );

        if (result.success) {
          this.displayResult(result);
        } else {
          this.showError(
            result.message || "Não foi possível calcular a entrega"
          );
        }
      } catch (error) {
        console.error("Erro no cálculo:", error);
        this.showError("Erro ao calcular a entrega");
      } finally {
        this.showLoading(false);
      }
    }, 500);
  }

  performCalculation(departureDate, city, state, carrier) {
    console.log(
      `📅 Calculando entrega: ${departureDate}, ${city}, ${state}, ${carrier}`
    );

    // Busca o prazo na base de dados
    const transportData = this.findTransportData(city, state, carrier);

    if (!transportData) {
      return {
        success: false,
        message: `Não encontramos prazo para ${carrier} em ${city}, ${state}`,
      };
    }

    // Verifica diferentes nomes possíveis para a coluna
    const workingDays = parseInt(
      transportData.dias_uteis || transportData.diasuteis || transportData.prazo
    );

    if (isNaN(workingDays) || workingDays <= 0) {
      return {
        success: false,
        message: `Prazo de entrega inválido para ${carrier} em ${city}, ${state}`,
      };
    }

    // Calcula a data de entrega
    const deliveryDate = this.calculateDeliveryDate(departureDate, workingDays);

    return {
      success: true,
      departureDate: departureDate,
      workingDays: workingDays,
      deliveryDate: deliveryDate,
      carrier: carrier,
      destination: `${city}, ${state}`,
      modal: transportData.modal || "Não especificado",
    };
  }

  findTransportData(city, state, carrier) {
    return this.allData.find(
      (item) =>
        item.cidade &&
        item.cidade.toUpperCase() === city &&
        item.uf &&
        item.uf.toUpperCase() === state &&
        item.transportadora &&
        item.transportadora.toUpperCase() === carrier.toUpperCase()
    );
  }

  calculateDeliveryDate(startDate, workingDays) {
    // CORREÇÃO: Usar data local sem problemas de fuso horário
    const [year, month, day] = startDate.split("-");
    const start = new Date(year, month - 1, day); // mês é 0-based no JavaScript

    let count = 0;
    let currentDate = new Date(start);

    console.log(`📅 Data de saída: ${start.toLocaleDateString("pt-BR")}`);

    // Avança dias úteis (segunda a sexta)
    while (count < workingDays) {
      currentDate.setDate(currentDate.getDate() + 1);

      // Verifica se é dia útil (segunda a sexta)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // 0 = domingo, 6 = sábado
        count++;
        console.log(
          `📅 +1 dia útil: ${currentDate.toLocaleDateString(
            "pt-BR"
          )} (${count}/${workingDays})`
        );
      }
    }

    console.log(
      `✅ Data de entrega calculada: ${currentDate.toLocaleDateString("pt-BR")}`
    );
    return currentDate;
  }

  displayResult(result) {
    this.hideResults();

    const resultElement = document.getElementById("deliveryResult");
    const departureElement = document.getElementById("resultDepartureDate");
    const transportDaysElement = document.getElementById("resultTransportDays");
    const deliveryDateElement = document.getElementById("resultDeliveryDate");
    const carrierElement = document.getElementById("resultCarrier");
    const destinationElement = document.getElementById("resultDestination");

    if (
      !resultElement ||
      !departureElement ||
      !transportDaysElement ||
      !deliveryDateElement ||
      !carrierElement ||
      !destinationElement
    ) {
      return;
    }

    // CORREÇÃO: Formatar datas corretamente sem problemas de fuso horário
    const formattedDeparture = this.formatDate(result.departureDate);
    const formattedDelivery = this.formatDate(result.deliveryDate);

    // Texto correto em português
    const daysText = result.workingDays === 1 ? "dia útil" : "dias úteis";

    // Atualiza os elementos
    departureElement.textContent = formattedDeparture;
    transportDaysElement.textContent = `${result.workingDays} ${daysText}`;
    deliveryDateElement.textContent = formattedDelivery;
    carrierElement.textContent = result.carrier;
    destinationElement.textContent = result.destination;

    // Mostra o resultado
    resultElement.style.display = "block";

    // Scroll suave para o resultado
    resultElement.scrollIntoView({ behavior: "smooth", block: "nearest" });

    console.log("✅ Resultado calculado:", {
      partida: formattedDeparture,
      entrega: formattedDelivery,
      dias: `${result.workingDays} ${daysText}`,
    });
  }

  formatDate(date) {
    // CORREÇÃO: Lidar com ambos os tipos (Date object e string)
    let dateObj;

    if (date instanceof Date) {
      dateObj = date;
    } else {
      // Se for string, criar data local sem problemas de UTC
      const [year, month, day] = date.split("-");
      dateObj = new Date(year, month - 1, day);
    }

    return dateObj.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      weekday: "long",
    });
  }

  showLoading(show) {
    const calculateBtn = document.getElementById("calculateDelivery");
    if (!calculateBtn) return;

    const spinner = calculateBtn.querySelector(".loading-spinner");
    const btnText = calculateBtn.querySelector("span");

    if (spinner) spinner.style.display = show ? "block" : "none";
    if (btnText) btnText.style.display = show ? "none" : "block";
    calculateBtn.disabled = show;
  }

  showError(message) {
    this.hideResults();

    const errorElement = document.getElementById("deliveryError");
    const errorMessageElement = document.getElementById("deliveryErrorMessage");

    if (errorElement && errorMessageElement) {
      errorMessageElement.textContent = message;
      errorElement.style.display = "block";

      // Scroll para o erro
      errorElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  hideResults() {
    const resultElement = document.getElementById("deliveryResult");
    const errorElement = document.getElementById("deliveryError");

    if (resultElement) resultElement.style.display = "none";
    if (errorElement) errorElement.style.display = "none";
  }
}

// Inicializar a calculadora
let dateCalculator;

document.addEventListener("DOMContentLoaded", () => {
  dateCalculator = new DateCalculator();
  console.log("📅 Calculadora de entregas inicializada");
});

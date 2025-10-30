// Configuração para acessar Google Sheets
class GoogleSheetsAPI {
  constructor() {
    // URL pública da planilha fornecida
    this.sheetUrl =
      "https://docs.google.com/spreadsheets/d/14Fv2BP09fwtErevfOlnuSdRPA4HwSaYxNcpvE6FoZUY/gviz/tq?tqx=out:csv";
    this.data = null;
    this.cacheKey = "transportadoras_cache";
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // Carrega dados da planilha
  async loadData() {
    console.log("📥 Iniciando carregamento de dados...");

    // Verifica se há dados em cache
    const cached = this.getCachedData();
    if (cached) {
      console.log("✅ Dados carregados do cache");
      this.data = cached;
      return this.data;
    }

    try {
      console.log("🌐 Buscando dados da planilha...");
      const response = await fetch(this.sheetUrl);

      if (!response.ok) {
        throw new Error(
          `Erro HTTP: ${response.status} - ${response.statusText}`
        );
      }

      const csvText = await response.text();
      console.log("📄 CSV recebido:", csvText.substring(0, 200) + "...");

      if (!csvText || csvText.trim().length === 0) {
        throw new Error("Planilha vazia ou sem dados");
      }

      this.data = this.parseCSV(csvText);
      console.log("✅ Dados parseados:", this.data);

      // Validação se há dados válidos
      if (!this.data || this.data.length === 0) {
        console.warn(
          "⚠️ Nenhum dado válido encontrado, usando dados de exemplo"
        );
        this.data = this.getSampleData();
      } else {
        console.log(`✅ ${this.data.length} registros carregados com sucesso`);
        // Salva em cache apenas se os dados forem válidos
        this.cacheData(this.data);
      }

      return this.data;
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error);

      // Retorna dados de exemplo em caso de erro
      console.log("🔄 Usando dados de exemplo devido ao erro");
      this.data = this.getSampleData();
      return this.data;
    }
  }

  // Parse do CSV com a nova estrutura - CORRIGIDO
  parseCSV(csvText) {
    try {
      const lines = csvText.split("\n").filter((line) => line.trim());

      if (lines.length === 0) {
        console.warn("CSV vazio");
        return [];
      }

      console.log(`📊 ${lines.length} linhas encontradas no CSV`);

      // Remove aspas e caracteres especiais do CSV do Google Sheets
      const cleanLine = (line) => {
        // Remove aspas externas e divide por vírgula
        return line
          .replace(/^"|"$/g, "")
          .split('","')
          .map((item) => item.replace(/^"|"$/g, "").trim());
      };

      const data = [];
      let skippedLines = 0;

      for (let i = 1; i < lines.length; i++) {
        // Começa da linha 1 para pular o cabeçalho
        try {
          const values = cleanLine(lines[i]);

          // Debug: log da linha processada
          if (i <= 3) {
            // Mostra apenas as primeiras 3 linhas para debug
            console.log(`Linha ${i}:`, values);
          }

          // Mapeia conforme a nova estrutura
          const item = {
            cidade: values[0] || "",
            uf: values[1] || "",
            dias_uteis: values[2] || "",
            transportadora: values[3] || "",
            modal: values[4] || "",
          };

          // Validação mais flexível - aceita itens com pelo menos cidade e transportadora
          if (item.cidade && item.transportadora) {
            data.push(item);
          } else {
            skippedLines++;
            console.warn(`Linha ${i} ignorada - dados insuficientes:`, item);
          }
        } catch (lineError) {
          skippedLines++;
          console.warn(`Erro ao processar linha ${i}:`, lineError);
        }
      }

      console.log(
        `✅ ${data.length} registros válidos, ${skippedLines} linhas ignoradas`
      );
      return data;
    } catch (error) {
      console.error("❌ Erro ao fazer parse do CSV:", error);
      return [];
    }
  }

  // Sistema de cache simples
  getCachedData() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);

      // Verifica se o cache expirou
      if (Date.now() - timestamp > this.cacheTimeout) {
        localStorage.removeItem(this.cacheKey);
        return null;
      }

      console.log("💾 Dados carregados do cache");
      return data;
    } catch (error) {
      console.warn("Erro ao recuperar cache:", error);
      return null;
    }
  }

  cacheData(data) {
    try {
      const cache = {
        data: data,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.cacheKey, JSON.stringify(cache));
      console.log("💾 Dados salvos no cache");
    } catch (error) {
      console.warn("Não foi possível salvar em cache:", error);
    }
  }

  // Dados de exemplo baseados na nova estrutura - ATUALIZADO
  getSampleData() {
    console.log("🔄 Carregando dados de exemplo...");
    const sampleData = [
      {
        cidade: "ARAUCARIA",
        uf: "PR",
        dias_uteis: "3",
        transportadora: "JAMEF",
        modal: "RODOVIÁRIO",
      },
      {
        cidade: "CAMPINA GRANDE DO SUL",
        uf: "PR",
        dias_uteis: "5",
        transportadora: "JAMEF",
        modal: "RODOVIÁRIO",
      },
      {
        cidade: "CURITIBA",
        uf: "PR",
        dias_uteis: "2",
        transportadora: "MOVVI",
        modal: "RODOVIÁRIO",
      },
      {
        cidade: "FLORIANÓPOLIS",
        uf: "SC",
        dias_uteis: "4",
        transportadora: "JAMEF",
        modal: "RODOVIÁRIO",
      },
      {
        cidade: "PORTO ALEGRE",
        uf: "RS",
        dias_uteis: "6",
        transportadora: "MOVVI",
        modal: "RODOVIÁRIO",
      },
      {
        cidade: "SÃO PAULO",
        uf: "SP",
        dias_uteis: "3",
        transportadora: "AZUL CARGO",
        modal: "AÉREO",
      },
      {
        cidade: "RIO DE JANEIRO",
        uf: "RJ",
        dias_uteis: "4",
        transportadora: "JAMEF",
        modal: "RODOVIÁRIO",
      },
      {
        cidade: "BELO HORIZONTE",
        uf: "MG",
        dias_uteis: "5",
        transportadora: "MOVVI",
        modal: "RODOVIÁRIO",
      },
      {
        cidade: "BLUMENAU",
        uf: "SC",
        dias_uteis: "3",
        transportadora: "JAMEF",
        modal: "RODOVIÁRIO",
      },
      {
        cidade: "JOINVILLE",
        uf: "SC",
        dias_uteis: "3",
        transportadora: "MOVVI",
        modal: "RODOVIÁRIO",
      },
    ];

    console.log(`✅ ${sampleData.length} registros de exemplo carregados`);
    return sampleData;
  }

  // Obtém cidades únicas para autocomplete
  getUniqueCities() {
    if (!this.data) return [];

    const citiesMap = new Map();
    this.data.forEach((item) => {
      const key = `${item.cidade}, ${item.uf}`;
      if (!citiesMap.has(key)) {
        citiesMap.set(key, {
          cidade: item.cidade,
          uf: item.uf,
          display: `${item.cidade}, ${item.uf}`,
        });
      }
    });

    const cities = Array.from(citiesMap.values()).sort((a, b) =>
      a.cidade.localeCompare(b.cidade)
    );

    console.log(`🏙️ ${cities.length} cidades únicas carregadas`);
    return cities;
  }
}

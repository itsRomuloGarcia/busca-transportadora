// Gerenciador de logos das transportadoras - ATUALIZADO COM FUNDOS BRANCOS
class LogoManager {
  constructor() {
    this.logoMap = {
      // Logos reais fornecidas - TODAS COM FUNDO BRANCO
      JAMEF:
        "https://marketing-jamef-prd.s3.us-east-2.amazonaws.com/site/assets/logotipos/nova-logo-jamef.svg",
      AZUL: "https://www.azulcargoexpress.com.br/Images/logoAzul.png",
      "AZUL CARGO": "https://www.azulcargoexpress.com.br/Images/logoAzul.png",
      BERTOLINI: "https://www.tbl.com.br/site/img/LOGO-TBL-BRANCO.png",
      JKM: "https://jkmlog.com.br/wp-content/uploads/2016/12/Logo_JKM_Log-1.jpg",
      MEIRELES:
        "https://static.wixstatic.com/media/43e27f_2273285cb3b94daaaa083bc18f84d5c9~mv2.png/v1/fill/w_365,h_80,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/logo%20Meirelles%20new.png",
      MILLES:
        "https://www.expressomilles.com.br/site/images/logo-expresso-milles.png",
      "MULTI SERVICE":
        "https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=480,fit=crop,q=95/m2WrxQ56oaHVnXnL/logos-AVLNkMJKDJipxZW8.jpg",
      "PACIFICO LOG":
        "https://pacificolog.com.br/assets/images/logo-pacifico-log2.svg",
      MOVVI:
        "https://media.licdn.com/dms/image/v2/D4D12AQGfgkL3vxiPbA/article-inline_image-shrink_400_744/article-inline_image-shrink_400_744/0/1684767958813?e=2147483647&v=beta&t=lw-q3cAiq6m9jH496lo63Y5aJDY-kanfOND0pElprTc",
      ATUAL: "https://cliente.atualcargas.com.br/og-image.png",
      DEFAULT: "icon",
    };

    // Fallback para transportadoras não mapeadas
    this.fallbackLogos = {
      JAMEF: "https://via.placeholder.com/80x80/FFFFFF/FFA000?text=JAMEF",
      MOVVI: "https://via.placeholder.com/80x80/FFFFFF/6366F1?text=MOVVI",
      "AZUL CARGO": "https://via.placeholder.com/80x80/FFFFFF/00B2FF?text=AZUL",
      BERTOLINI: "https://via.placeholder.com/80x80/FFFFFF/10B981?text=BER",
      JKM: "https://via.placeholder.com/80x80/FFFFFF/8B5CF6?text=JKM",
      MEIRELES: "https://via.placeholder.com/80x80/FFFFFF/EF4444?text=MEI",
      MILLES: "https://via.placeholder.com/80x80/FFFFFF/F59E0B?text=MIL",
      "MULTI SERVICE":
        "https://via.placeholder.com/80x80/FFFFFF/06B6D4?text=MULTI",
      "PACIFICO LOG":
        "https://via.placeholder.com/80x80/FFFFFF/8B5CF6?text=PAC",
      ATUAL: "https://via.placeholder.com/80x80/FFFFFF/FFA000?text=ATUAL",
      DEFAULT: "https://via.placeholder.com/80x80/FFFFFF/6B7280?text=TRP",
    };

    // Ícones de fallback (SVG com fundo gradiente)
    this.iconMap = {
      JAMEF: `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L4 7v13h16V7l-8-5zm-2 15H8v-6h2v6zm4 0h-2v-6h2v6zm4 0h-2v-6h2v6z"/>
        </svg>
      `,
      MOVVI: `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      `,
      "AZUL CARGO": `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </svg>
      `,
      BERTOLINI: `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5S5.67 15.5 6 15.5s1.5.67 1.5 1.5S6.83 18.5 6 18.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      `,
      DEFAULT: `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5S5.67 15.5 6 15.5s1.5.67 1.5 1.5S6.83 18.5 6 18.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      `,
    };

    console.log("🖼️ Logo Manager inicializado com fundos brancos");
  }

  // ✅ MÉTODO ATUALIZADO - SEMPRE RETORNA IMAGEM COM FUNDO BRANCO
  getLogo(transportadoraName) {
    if (!transportadoraName) {
      return this.getDefaultLogo();
    }

    const normalizedName = transportadoraName.toUpperCase().trim();
    console.log(`🖼️ Buscando logo para: ${normalizedName}`);

    // Tenta encontrar match exato primeiro
    if (
      this.logoMap[normalizedName] &&
      this.logoMap[normalizedName] !== "icon"
    ) {
      console.log(`✅ Logo encontrada para ${normalizedName}`);
      return {
        type: "image",
        content: this.logoMap[normalizedName],
        fallback:
          this.fallbackLogos[normalizedName] || this.fallbackLogos.DEFAULT,
        alt: transportadoraName,
        transportadora: normalizedName,
        hasWhiteBackground: true, // ✅ SEMPRE COM FUNDO BRANCO
      };
    }

    // Tenta encontrar match parcial
    const partialMatch = this.findPartialMatch(normalizedName);
    if (partialMatch) {
      console.log(`✅ Logo parcial encontrada para ${normalizedName}`);
      return {
        type: "image",
        content: partialMatch,
        fallback:
          this.fallbackLogos[normalizedName] || this.fallbackLogos.DEFAULT,
        alt: transportadoraName,
        transportadora: normalizedName,
        hasWhiteBackground: true,
      };
    }

    // Se não encontrou logo, usa ícone com gradiente
    console.log(`⚠️ Usando ícone para ${normalizedName}`);
    return {
      type: "icon",
      content: this.iconMap[normalizedName] || this.iconMap["DEFAULT"],
      alt: transportadoraName,
      transportadora: normalizedName,
      hasWhiteBackground: false,
    };
  }

  // Encontra match parcial para nomes similares
  findPartialMatch(transportadoraName) {
    for (const [key, value] of Object.entries(this.logoMap)) {
      if (key !== "DEFAULT" && value !== "icon") {
        if (
          transportadoraName.includes(key) ||
          key.includes(transportadoraName)
        ) {
          return value;
        }
      }
    }
    return null;
  }

  // Logo padrão
  getDefaultLogo() {
    return {
      type: "icon",
      content: this.iconMap["DEFAULT"],
      alt: "Transportadora",
      transportadora: "DEFAULT",
      hasWhiteBackground: false,
    };
  }

  // Adiciona uma nova logo ao mapeamento
  addLogo(transportadoraName, logoUrl) {
    this.logoMap[transportadoraName.toUpperCase()] = logoUrl;
    console.log(`✅ Logo adicionada para ${transportadoraName}`);
  }

  // Remove uma logo do mapeamento
  removeLogo(transportadoraName) {
    delete this.logoMap[transportadoraName.toUpperCase()];
    console.log(`🗑️ Logo removida para ${transportadoraName}`);
  }

  // Lista todas as transportadoras mapeadas
  getMappedTransportadoras() {
    return Object.keys(this.logoMap).filter(
      (key) => key !== "DEFAULT" && this.logoMap[key] !== "icon"
    );
  }

  // Verifica se uma transportadora tem logo
  hasLogo(transportadoraName) {
    const normalizedName = transportadoraName.toUpperCase().trim();
    return (
      this.logoMap[normalizedName] && this.logoMap[normalizedName] !== "icon"
    );
  }
}

// Instância global do gerenciador de logos
let logoManager;

document.addEventListener("DOMContentLoaded", () => {
  logoManager = new LogoManager();
  console.log("🎨 Logo Manager carregado - Todas as logos com fundo branco");
});

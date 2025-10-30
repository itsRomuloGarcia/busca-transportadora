// Gerenciamento de comparação entre transportadoras
class ComparisonManager {
  constructor() {
    this.selectedItems = new Map();
    this.maxSelection = 5;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateComparisonUI();
  }

  setupEventListeners() {
    // Modal events
    document
      .getElementById("closeComparison")
      ?.addEventListener("click", () => {
        this.hideComparison();
      });

    document
      .getElementById("closeComparisonBtn")
      ?.addEventListener("click", () => {
        this.hideComparison();
      });

    document
      .getElementById("clearComparison")
      ?.addEventListener("click", () => {
        this.clearSelection();
      });

    // Toggle comparison button
    document
      .getElementById("toggleComparison")
      ?.addEventListener("click", () => {
        this.showComparison();
      });

    // Close modal when clicking outside
    document
      .getElementById("comparisonModal")
      ?.addEventListener("click", (e) => {
        if (e.target.id === "comparisonModal") {
          this.hideComparison();
        }
      });

    // Prevenir propagação de clique dentro do modal
    document.querySelector(".modal-content")?.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  // Adiciona/remove item da comparação
  toggleItem(item) {
    const itemId = this.getItemId(item);

    if (this.selectedItems.has(itemId)) {
      this.selectedItems.delete(itemId);
    } else {
      if (this.selectedItems.size >= this.maxSelection) {
        this.showLimitMessage();
        return false;
      }
      this.selectedItems.set(itemId, item);
    }

    this.updateComparisonUI();
    return true;
  }

  // Gera ID único para o item
  getItemId(item) {
    return `${item.cidade}-${item.uf}-${item.transportadora}-${item.modal}-${item.dias_uteis}`;
  }

  // Verifica se item está selecionado
  isItemSelected(item) {
    return this.selectedItems.has(this.getItemId(item));
  }

  // Atualiza UI da comparação
  updateComparisonUI() {
    const toggleBtn = document.getElementById("toggleComparison");
    const countElement = document.getElementById("comparisonCount");

    if (toggleBtn && countElement) {
      if (this.selectedItems.size > 0) {
        toggleBtn.style.display = "flex";
        countElement.textContent = this.selectedItems.size;

        const btnText = toggleBtn.querySelector("span:first-child");
        if (btnText) {
          if (this.selectedItems.size === 1) {
            btnText.textContent = "Comparar Selecionada";
          } else {
            btnText.textContent = "Comparar Selecionadas";
          }
        }
      } else {
        toggleBtn.style.display = "none";
      }
    }

    this.updateCardsSelection();
  }

  // Atualiza visualmente os cards selecionados
  updateCardsSelection() {
    document.querySelectorAll(".transport-card").forEach((card) => {
      const itemData = card.getAttribute("data-item");
      if (itemData) {
        try {
          const item = JSON.parse(itemData);
          if (this.isItemSelected(item)) {
            card.classList.add("selected");
          } else {
            card.classList.remove("selected");
          }
        } catch (error) {
          console.error("Erro ao atualizar seleção do card:", error);
        }
      }
    });
  }

  // Mostra mensagem de limite
  showLimitMessage() {
    const modal = document.createElement("div");
    modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;

    modal.innerHTML = `
            <div style="
                background: var(--card-bg);
                padding: 2rem;
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
                max-width: 400px;
                text-align: center;
            ">
                <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Limite de Comparação</h3>
                <p style="margin-bottom: 1.5rem;">Você pode comparar no máximo ${this.maxSelection} transportadoras.</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button id="modalClear" style="
                        background: var(--primary-color);
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: var(--border-radius);
                        cursor: pointer;
                    ">Limpar e Selecionar</button>
                    <button id="modalCancel" style="
                        background: var(--border-color);
                        color: var(--text-color);
                        border: none;
                        padding: 10px 20px;
                        border-radius: var(--border-radius);
                        cursor: pointer;
                    ">Manter Seleção</button>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    return new Promise((resolve) => {
      modal.querySelector("#modalClear").addEventListener("click", () => {
        document.body.removeChild(modal);
        this.clearSelection();
        resolve(true);
      });

      modal.querySelector("#modalCancel").addEventListener("click", () => {
        document.body.removeChild(modal);
        resolve(false);
      });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
          resolve(false);
        }
      });
    });
  }

  // Mostra modal de comparação
  showComparison() {
    const modal = document.getElementById("comparisonModal");
    const content = document.getElementById("comparisonContent");

    if (modal && content) {
      content.innerHTML = this.generateComparisonTable();
      modal.style.display = "flex";
    }
  }

  // Esconde modal de comparação
  hideComparison() {
    const modal = document.getElementById("comparisonModal");
    if (modal) {
      modal.style.display = "none";
    }
  }

  // Limpa seleção
  clearSelection() {
    this.selectedItems.clear();
    this.updateComparisonUI();
    this.hideComparison();

    window.dispatchEvent(new CustomEvent("comparisonCleared"));
  }

  // Gera tabela de comparação
  generateComparisonTable() {
    const items = Array.from(this.selectedItems.values());

    if (items.length === 0) {
      return "<p>Nenhuma transportadora selecionada para comparação.</p>";
    }

    const validPrazos = items
      .map((item) => parseInt(item.dias_uteis))
      .filter((prazo) => !isNaN(prazo));
    const bestPrazo = validPrazos.length > 0 ? Math.min(...validPrazos) : null;

    return `
            <div class="comparison-summary">
                <p><strong>${
                  items.length
                }</strong> transportadora(s) selecionada(s) para comparação</p>
            </div>
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Transportadora</th>
                        <th>Cidade/UF</th>
                        <th>Modal</th>
                        <th>Prazo (dias úteis)</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${items
                      .map((item) => {
                        const prazo = parseInt(item.dias_uteis);
                        const isBest =
                          bestPrazo !== null &&
                          !isNaN(prazo) &&
                          prazo === bestPrazo;

                        return `
                            <tr class="${isBest ? "best-prazo" : ""}">
                                <td><strong>${item.transportadora}</strong></td>
                                <td>${item.cidade} / ${item.uf}</td>
                                <td>${item.modal}</td>
                                <td>${item.dias_uteis}</td>
                                <td>${isBest ? "🏆 Melhor prazo" : "-"}</td>
                            </tr>
                        `;
                      })
                      .join("")}
                </tbody>
            </table>
            
            ${
              items.length > 1
                ? `
                <div class="comparison-insights" style="margin-top: 2rem; padding: 1rem; background: var(--border-color); border-radius: var(--border-radius);">
                    <h4>📊 Insights da Comparação</h4>
                    <p><strong>Total comparado:</strong> ${
                      items.length
                    } transportadora(s)</p>
                    ${
                      bestPrazo !== null
                        ? `
                        <p><strong>Melhor prazo:</strong> ${bestPrazo} dias úteis</p>
                        <p><strong>Transportadora(s) com melhor prazo:</strong> ${items
                          .filter(
                            (item) => parseInt(item.dias_uteis) === bestPrazo
                          )
                          .map((item) => item.transportadora)
                          .join(", ")}</p>
                        <p><strong>Diferença entre prazos:</strong> ${this.calculatePrazoRange(
                          items
                        )} dias</p>
                    `
                        : "<p><strong>Nenhum prazo válido para comparação</strong></p>"
                    }
                </div>
            `
                : `
                <div class="comparison-insights" style="margin-top: 2rem; padding: 1rem; background: var(--border-color); border-radius: var(--border-radius);">
                    <p>Selecione mais transportadoras para ver comparações detalhadas.</p>
                </div>
            `
            }
        `;
  }

  // Calcula a diferença entre prazos
  calculatePrazoRange(items) {
    const prazos = items
      .map((item) => parseInt(item.dias_uteis))
      .filter((prazo) => !isNaN(prazo));
    if (prazos.length === 0) return 0;

    const min = Math.min(...prazos);
    const max = Math.max(...prazos);
    return max - min;
  }

  getSelectedItems() {
    return Array.from(this.selectedItems.values());
  }

  getSelectionCount() {
    return this.selectedItems.size;
  }
}

let comparisonManager;

document.addEventListener("DOMContentLoaded", () => {
  comparisonManager = new ComparisonManager();
});

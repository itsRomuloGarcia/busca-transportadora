// Utilitários de performance para a aplicação de transportadoras
class PerformanceManager {
  static debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Preload das logos mais usadas
  static preloadCriticalImages() {
    const criticalImages = [
      "https://marketing-jamef-prd.s3.us-east-2.amazonaws.com/site/assets/logotipos/nova-logo-jamef.svg",
      "https://www.azulcargoexpress.com.br/Images/logoAzul.png",
      "https://www.tbl.com.br/site/img/LOGO-TBL-BRANCO.png",
    ];

    criticalImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    console.log("🖼️ Logos críticas pré-carregadas");
  }

  // Medir performance de operações
  static measurePerformance(operationName, operation) {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();

    console.log(
      `⏱️ ${operationName} levou ${(endTime - startTime).toFixed(2)}ms`
    );

    // Enviar para analytics se disponível
    if (window.gtag) {
      gtag("event", "timing_complete", {
        name: operationName,
        value: Math.round(endTime - startTime),
        event_category: "Performance",
      });
    }

    return result;
  }

  // Otimizar scroll para dispositivos móveis
  static enableSmoothScroll() {
    if ("scrollBehavior" in document.documentElement.style) {
      return;
    }

    const smoothScroll = (target, duration = 500) => {
      const targetPosition = target.offsetTop;
      const startPosition = window.pageYOffset;
      const distance = targetPosition - startPosition;
      let startTime = null;

      const animation = (currentTime) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
      };

      const ease = (t, b, c, d) => {
        t /= d / 2;
        if (t < 1) return (c / 2) * t * t + b;
        t--;
        return (-c / 2) * (t * (t - 2) - 1) + b;
      };

      requestAnimationFrame(animation);
    };

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute("href"));
        if (target) smoothScroll(target);
      });
    });
  }

  // Monitorar Core Web Vitals
  static monitorWebVitals() {
    if ("web-vitals" in window) {
      window.webVitals.getCLS(console.log);
      window.webVitals.getFID(console.log);
      window.webVitals.getFCP(console.log);
      window.webVitals.getLCP(console.log);
      window.webVitals.getTTFB(console.log);
    }
  }

  // Prevenir memory leaks
  static setupCleanup() {
    window.addEventListener("beforeunload", () => {
      // Limpar timeouts e intervals
      const highestTimeoutId = setTimeout(() => {}, 0);
      for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
      }

      // Limpar event listeners customizados se necessário
      if (window.transportadoraApp && window.transportadoraApp.destroy) {
        window.transportadoraApp.destroy();
      }
    });
  }
}

// Intersection Observer para lazy loading de imagens
class LazyLoader {
  constructor() {
    this.observer = null;
    this.observedElements = new Set();
    this.init();
  }

  init() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            this.loadImage(img);
          }
        });
      },
      {
        rootMargin: "100px 0px",
        threshold: 0.1,
      }
    );
  }

  loadImage(img) {
    if (img.dataset.src) {
      img.src = img.dataset.src;
      img.classList.remove("lazy");
      img.removeAttribute("data-src");
    }
    this.unobserve(img);
  }

  observe(element) {
    if (this.observer && element && !this.observedElements.has(element)) {
      this.observer.observe(element);
      this.observedElements.add(element);
    }
  }

  unobserve(element) {
    if (this.observer && element) {
      this.observer.unobserve(element);
      this.observedElements.delete(element);
    }
  }

  observeAllLazyImages() {
    const lazyImages = document.querySelectorAll("img[data-src]");
    lazyImages.forEach((img) => this.observe(img));
    console.log(`🔍 Observando ${lazyImages.length} imagens para lazy loading`);
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observedElements.clear();
    }
  }
}

// ✅ CORREÇÃO: Inicialização correta
let lazyLoader = new LazyLoader();
let performanceManager = PerformanceManager;

document.addEventListener("DOMContentLoaded", () => {
  // ✅ Inicializar lazy loader
  lazyLoader = new LazyLoader();

  // ✅ Só tentar usar distanceCalculator se ele existir
  if (typeof DistanceCalculator !== "undefined" && !window.distanceCalculator) {
    window.distanceCalculator = new DistanceCalculator();
  }

  // ✅ Exportar somente quando pronto
  window.lazyLoader = lazyLoader;
  window.PerformanceManager = performanceManager;

  // Pré-carregar imagens críticas
  PerformanceManager.preloadCriticalImages();

  // Habilitar scroll suave
  PerformanceManager.enableSmoothScroll();

  // Monitorar performance
  PerformanceManager.setupCleanup();

  console.log("🚀 Performance managers inicializados");

  // Error boundary global
  window.addEventListener("error", (event) => {
    console.error("Erro global:", event.error);

    // Enviar para analytics se disponível
    if (window.gtag) {
      gtag("event", "exception", {
        description: event.error?.message || "Erro desconhecido",
        fatal: false,
      });
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("Promise rejeitada:", event.reason);

    if (window.gtag) {
      gtag("event", "exception", {
        description: event.reason?.message || "Promise rejeitada",
        fatal: false,
      });
    }
  });
});

// ✅ EXPORTAR CORRETAMENTE
window.PerformanceManager = PerformanceManager;
window.lazyLoader = lazyLoader;

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
      "http://www.azulcargoexpress.com.br//Images/logoAzul.png",
      "https://www.tbl.com.br/site/img/LOGO-TBL-BRANCO.png",
    ];

    criticalImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    console.log("Logos críticas pré-carregadas");
  }

  // Medir performance de operações
  static measurePerformance(operationName, operation) {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();

    console.log(
      `⏱️ ${operationName} levou ${(endTime - startTime).toFixed(2)}ms`
    );
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
}

// Intersection Observer para lazy loading de imagens
class LazyLoader {
  constructor() {
    this.observer = null;
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
    }
    this.observer.unobserve(img);
  }

  observe(element) {
    if (this.observer && element) {
      this.observer.observe(element);
    }
  }

  observeAllLazyImages() {
    const lazyImages = document.querySelectorAll("img[data-src]");
    lazyImages.forEach((img) => this.observe(img));
    console.log(`🔍 Observando ${lazyImages.length} imagens para lazy loading`);
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

  console.log("🚀 Performance managers inicializados");
});

// ✅ EXPORTAR CORRETAMENTE
window.PerformanceManager = PerformanceManager;
window.lazyLoader = lazyLoader;

/**
 * seo-config.ts — Central SEO data for all IDSS landing pages.
 *
 * Used by:
 *   - /best-laptops-for-[usecase]/page.tsx
 *   - /compare/[slug]/page.tsx
 *   - sitemap.ts
 *
 * Each entry is fully self-contained so generateMetadata() needs only
 * to look up one object.
 */

export const BASE_URL = "https://idss.vercel.app";

// ============================================================================
// Best-of pages: /best-laptops-for-[usecase]
// ============================================================================

export interface LaptopUsecase {
  slug: string;
  /** Browser <title> */
  title: string;
  /** <meta name="description"> (≤155 chars) */
  description: string;
  /** Page H1 */
  h1: string;
  /** Opening paragraph — keyword-rich, 50-80 words */
  intro: string;
  /** 5-6 key features that matter for this use case */
  keyFeatures: string[];
  /** Short buying-advice paragraph */
  buyingAdvice: string;
  /** Pre-filled query sent to the main chat when user clicks CTA */
  chatQuery: string;
  /** FAQ items rendered as JSON-LD FAQPage */
  faq: Array<{ q: string; a: string }>;
  /** Additional page-level keywords */
  keywords: string[];
}

export const LAPTOP_USECASES: Record<string, LaptopUsecase> = {
  students: {
    slug: "students",
    title: "Best Laptops for Students 2026 — AI-Ranked Picks",
    description:
      "Find the best student laptops in 2026. AI-ranked picks under $700 with long battery life, lightweight design, and enough RAM for every assignment.",
    h1: "Best Laptops for Students in 2026",
    intro:
      "Finding the best student laptop means balancing price, battery life, and portability. Whether you need a machine for programming homework, essay writing, or video calls, the right laptop makes every study session easier. Our AI engine ranks hundreds of laptops by student-friendly specs so you don't have to spend hours comparing.",
    keyFeatures: [
      "Battery life of 8+ hours for all-day classes",
      "Weight under 4 lbs for easy backpack carry",
      "At least 16 GB RAM for multitasking",
      "256 GB+ SSD for fast boot and file storage",
      "Comfortable keyboard for long typing sessions",
      "Price under $700 for tight student budgets",
    ],
    buyingAdvice:
      "For most students, a laptop with an Intel Core i5 or AMD Ryzen 5, 16 GB RAM, and a 512 GB SSD hits the sweet spot between performance and price. Prioritise battery life over raw CPU speed — you'll thank yourself during back-to-back lectures.",
    chatQuery: "I'm a student looking for a laptop under $700 with long battery life and at least 16GB RAM",
    faq: [
      {
        q: "What is the best laptop for college students?",
        a: "The best college laptop balances battery life (8+ hours), weight (under 4 lbs), at least 16 GB RAM, and a price under $800. Top picks in 2026 include the MacBook Air M3, ASUS Zenbook 14, and Acer Swift 3.",
      },
      {
        q: "How much RAM do I need as a student?",
        a: "16 GB RAM is the current sweet spot for students — enough for 20+ browser tabs, Zoom, Google Docs, and light coding simultaneously. If you plan to run virtual machines or do video editing, go for 32 GB.",
      },
      {
        q: "Should a student buy a Mac or Windows laptop?",
        a: "MacBooks offer best-in-class battery life and build quality but cost more. Windows laptops give more value per dollar and wider software compatibility. For STEM, both work well. For design or music, a Mac can be worth the premium.",
      },
      {
        q: "What laptop budget should a college student have?",
        a: "Most students do well with a budget of $500–$900. Under $700 you can get a solid Ryzen 5 or Intel i5 machine with 16 GB RAM. Above $1,000 you enter premium territory (MacBook Air, Dell XPS) which may not be necessary unless your major demands it.",
      },
    ],
    keywords: [
      "best laptop for students",
      "best college laptop 2026",
      "student laptop under 700",
      "best laptop for homework",
      "lightweight laptop for school",
    ],
  },

  programming: {
    slug: "programming",
    title: "Best Laptops for Programming 2026 — Developer Picks",
    description:
      "Top laptops for coding in 2026. AI-ranked picks with fast CPUs, 16–32 GB RAM, and developer-friendly keyboards for Python, JavaScript, and more.",
    h1: "Best Laptops for Programming in 2026",
    intro:
      "The best programming laptop needs a fast multi-core CPU, plenty of RAM for running containers and IDEs simultaneously, and a high-quality keyboard you'll be comfortable typing on for hours. Our AI engine evaluates hundreds of developer laptops and ranks them by the specs that actually matter for coding.",
    keyFeatures: [
      "Intel Core i7 / AMD Ryzen 7 or Apple M-series chip",
      "16–32 GB RAM for IDEs, Docker, and virtual machines",
      "512 GB+ NVMe SSD for fast compile times",
      "Sharp 13–15 inch display (1080p or higher)",
      "Comfortable, well-spaced keyboard for long coding sessions",
      "Linux / Unix compatibility or macOS for developer tools",
    ],
    buyingAdvice:
      "For web dev and general software engineering, 16 GB RAM and an i7/Ryzen 7 is sufficient. Data scientists and ML engineers should target 32 GB RAM with dedicated GPU support. Apple Silicon (M3/M4) is outstanding for battery life and compiled build speed.",
    chatQuery: "I need a laptop for programming and software development with 16GB RAM and a fast CPU under $1200",
    faq: [
      {
        q: "What is the best laptop for software developers in 2026?",
        a: "The best developer laptops in 2026 include the MacBook Pro M3, Lenovo ThinkPad X1 Carbon, and ASUS ProArt Studiobook. Look for 16–32 GB RAM, a fast NVMe SSD, and a keyboard rated highly by developers.",
      },
      {
        q: "Do I need a dedicated GPU for programming?",
        a: "For most web, backend, and mobile development, integrated graphics are fine. Machine learning engineers and game developers benefit from a dedicated GPU (RTX 3060 or better) for training models and running simulations.",
      },
      {
        q: "Is a MacBook better than ThinkPad for coding?",
        a: "MacBooks (M-series) excel in battery life, Unix-based terminal, and build quality. ThinkPads are praised for keyboard feel, repairability, and Linux support. Both are top-tier for developers — it depends on your ecosystem preference.",
      },
      {
        q: "How much storage do I need for a programming laptop?",
        a: "A 512 GB SSD is the minimum comfortable storage for developers. With Docker images, node_modules, project repos, and SDKs, 1 TB is a better target if budget allows.",
      },
    ],
    keywords: [
      "best laptop for programming",
      "best developer laptop 2026",
      "laptop for software engineering",
      "coding laptop 16gb ram",
      "best laptop for python",
    ],
  },

  gaming: {
    slug: "gaming",
    title: "Best Gaming Laptops 2026 — AI-Ranked by Performance",
    description:
      "Top gaming laptops of 2026 ranked by GPU performance, cooling, and price. AI-picked RTX 4060/4070 builds for 1080p and 1440p gaming.",
    h1: "Best Gaming Laptops in 2026",
    intro:
      "The best gaming laptop balances GPU power, thermal performance, display refresh rate, and battery life for on-the-go play. Our AI engine tests hundreds of gaming configurations and surfaces the builds that deliver the best frames-per-dollar across popular titles like Valorant, Elden Ring, and Cyberpunk 2077.",
    keyFeatures: [
      "NVIDIA RTX 4060 or better for 1080p/1440p gaming",
      "144 Hz+ display refresh rate for smooth gameplay",
      "16 GB DDR5 RAM minimum (32 GB for future-proofing)",
      "Efficient cooling system for sustained performance",
      "512 GB+ NVMe SSD (1 TB preferred for game libraries)",
      "MUX switch for direct GPU output and higher FPS",
    ],
    buyingAdvice:
      "For 1080p gaming on a budget, the RTX 4060 delivers excellent value. Step up to the RTX 4070 for 1440p. Avoid laptops that throttle under load — look for reviews that measure sustained GPU wattage. A 144 Hz display is the minimum; 165 Hz or 240 Hz panels are noticeably smoother.",
    chatQuery: "I want a gaming laptop with RTX 4060 or better for playing Valorant, under $1500",
    faq: [
      {
        q: "What is the best gaming laptop under $1000 in 2026?",
        a: "Under $1,000 the best gaming laptops typically come with RTX 4060, 16 GB RAM, and 144 Hz displays. Asus TUF Gaming, Lenovo Legion 5, and Acer Nitro 16 are consistently ranked near the top at this price point.",
      },
      {
        q: "Is 16 GB RAM enough for gaming in 2026?",
        a: "16 GB RAM is sufficient for most gaming in 2026. Some newer titles benefit from 32 GB, particularly when streaming or running the game alongside Discord, OBS, and a browser.",
      },
      {
        q: "How long do gaming laptops last?",
        a: "A well-maintained gaming laptop typically performs adequately for 4–6 years before the GPU starts showing its age. Thermal paste replacement at year 3–4 helps maintain performance significantly.",
      },
      {
        q: "Should I get a gaming laptop or desktop?",
        a: "Gaming desktops offer better performance per dollar and upgradability. Gaming laptops win on portability and all-in-one convenience. If you need to move between locations regularly, a gaming laptop is the better fit.",
      },
    ],
    keywords: [
      "best gaming laptop 2026",
      "gaming laptop RTX 4060",
      "best laptop for valorant",
      "gaming laptop under 1500",
      "best 144hz gaming laptop",
    ],
  },

  college: {
    slug: "college",
    title: "Best Laptops for College 2026 — Lightweight & Long Battery",
    description:
      "Best laptops for college students in 2026. Lightweight, affordable picks with all-day battery for lectures, labs, and dorm life.",
    h1: "Best Laptops for College Students in 2026",
    intro:
      "College students need a laptop that survives a full day of lectures, library sessions, and late-night study without hunting for an outlet. The best college laptops weigh under 3.5 lbs, run 10+ hours on a charge, and handle everything from Google Docs to Jupyter Notebooks. Our AI ranks the top picks across every major and budget.",
    keyFeatures: [
      "10+ hour battery life for lecture-to-library days",
      "Under 3.5 lbs to lighten your backpack",
      "16 GB RAM for multitasking browser + apps",
      "Fast SSD boot time so you're ready for class",
      "Bright, anti-glare display for outdoor reading",
      "Durable build that survives dorm life",
    ],
    buyingAdvice:
      "Business-class ultrabooks (ThinkPad, Dell XPS, MacBook Air) offer the best durability and battery life for college. Consumer models like ASUS ZenBook and HP Spectre x360 are strong alternatives at lower price points.",
    chatQuery: "I'm a college student looking for a lightweight laptop with 10+ hour battery life under $900",
    faq: [
      {
        q: "What laptop should I buy for college?",
        a: "The best college laptop depends on your major. For STEM, prioritise 16 GB RAM and a fast CPU. For humanities and business, a lightweight ultrabook with all-day battery (MacBook Air, Dell XPS 13) is ideal. Budget of $700–$1,000 covers most needs.",
      },
      {
        q: "Is 8 GB RAM enough for college in 2026?",
        a: "8 GB RAM is limiting in 2026. With a browser, video calls, and Office apps running simultaneously, 8 GB will feel cramped. We recommend 16 GB as the minimum for a new college laptop.",
      },
      {
        q: "What laptop do most college students use?",
        a: "MacBook Air is the most popular college laptop, especially at US universities. Among Windows laptops, Dell XPS, HP Spectre, and Lenovo IdeaPad are common. The right choice depends on your budget and field of study.",
      },
      {
        q: "Should I buy a laptop before or during college?",
        a: "Buy before college starts so you're prepared for orientation activities. Many schools also offer education discounts through Apple, Dell, and Lenovo's academic portals — factor these in to your price comparison.",
      },
    ],
    keywords: [
      "best laptop for college",
      "college laptop 2026",
      "lightweight laptop for college",
      "best laptop for university",
      "long battery laptop college",
    ],
  },

  "machine-learning": {
    slug: "machine-learning",
    title: "Best Laptops for Machine Learning 2026 — GPU & RAM Picks",
    description:
      "Best laptops for machine learning and AI development in 2026. High-RAM, GPU-accelerated picks for PyTorch, TensorFlow, and Jupyter.",
    h1: "Best Laptops for Machine Learning & AI in 2026",
    intro:
      "Machine learning engineers need more from a laptop than any other field — large RAM capacity for datasets, GPU compute for model training, and fast NVMe storage for dataset I/O. Our AI engine identifies the best ML workstation laptops by benchmarking real PyTorch and TensorFlow training runs across popular model sizes.",
    keyFeatures: [
      "NVIDIA RTX 4070 or better for CUDA-accelerated training",
      "32–64 GB RAM for large dataset loading",
      "1 TB+ NVMe SSD for dataset storage",
      "Apple M3/M4 Pro as a GPU-less alternative with unified memory",
      "Efficient cooling for sustained 100% CPU+GPU workloads",
      "Thunderbolt 4 for external GPU expansion",
    ],
    buyingAdvice:
      "If budget allows, an RTX 4080/4090-equipped laptop (Asus ProArt, Razer Blade 18) delivers the fastest local training. For mid-range, RTX 4070 with 32 GB RAM handles most experiments. Apple MacBook Pro M3 Max (96 GB unified memory) is a compelling option for models that fit in memory.",
    chatQuery: "I need a laptop for machine learning with 32GB RAM and a good GPU for PyTorch, budget $2000",
    faq: [
      {
        q: "What laptop is best for machine learning in 2026?",
        a: "The best ML laptops in 2026 are the ASUS ProArt Studiobook 16 (RTX 4090, 64 GB RAM), MacBook Pro M3 Max, and Lenovo Legion Pro 7i. Each offers different trade-offs between CUDA support, memory bandwidth, and portability.",
      },
      {
        q: "Can I run machine learning on a MacBook?",
        a: "Yes. Apple Silicon M3/M4 chips support PyTorch via Metal Performance Shaders (MPS). For models under 10B parameters, a MacBook Pro M3 Max with 48–96 GB unified memory is competitive with RTX 4070 laptops.",
      },
      {
        q: "How much RAM do I need for machine learning?",
        a: "16 GB RAM handles small experiments and Kaggle-style datasets. For production models and large embeddings, 32 GB is recommended. LLM fine-tuning benefits from 64 GB or more.",
      },
      {
        q: "Is a laptop good enough for machine learning?",
        a: "A high-end laptop can handle most ML coursework and research experiments. For large-scale production training, cloud GPUs (Google Colab, AWS SageMaker) are more cost-effective. A good ML laptop serves as your development environment while cloud handles the heavy lifting.",
      },
    ],
    keywords: [
      "best laptop for machine learning",
      "laptop for AI development",
      "best laptop for deep learning",
      "ML laptop 32gb ram",
      "best laptop for pytorch tensorflow",
    ],
  },

  "video-editing": {
    slug: "video-editing",
    title: "Best Laptops for Video Editing 2026 — 4K Export Picks",
    description:
      "Top video editing laptops in 2026. AI-ranked picks with RTX GPU, 32 GB RAM, and color-accurate displays for Premiere Pro and DaVinci Resolve.",
    h1: "Best Laptops for Video Editing in 2026",
    intro:
      "Video editors need a laptop that renders 4K footage without dropping frames, displays accurate colors for grading, and moves large files quickly. Our AI evaluates display color gamut, GPU encode performance, RAM, and storage speed to surface the best video editing laptops at every budget.",
    keyFeatures: [
      "NVIDIA RTX 4060+ or Apple M3 Pro for GPU-accelerated rendering",
      "32 GB RAM for 4K timeline performance",
      "1 TB+ NVMe SSD with 5 GB/s+ read speeds",
      "Color-accurate display (100% sRGB, ΔE < 2)",
      "Thunderbolt 4 for fast external drive connections",
      "macOS or Windows with Premiere/DaVinci Resolve support",
    ],
    buyingAdvice:
      "For Adobe Premiere Pro on Windows, target RTX 4070 + 32 GB RAM. For DaVinci Resolve, the macOS Metal pipeline on MacBook Pro M3 Pro/Max is exceptionally fast for H.265 and ProRes. Prioritise display color accuracy as much as CPU/GPU — you'll grade on whatever screen you have.",
    chatQuery: "I'm a video editor looking for a laptop with good GPU and 32GB RAM for Premiere Pro, under $2000",
    faq: [
      {
        q: "What is the best laptop for video editing in 2026?",
        a: "The MacBook Pro M3 Pro leads for Premiere Pro/Final Cut, offering best-in-class ProRes encoding. On Windows, Asus ProArt Studiobook (RTX 4080, OLED) and ASUS ZenBook Pro 16X are top picks for color-critical work.",
      },
      {
        q: "How much RAM do I need for 4K video editing?",
        a: "32 GB RAM is the recommended minimum for smooth 4K editing in Premiere Pro or Resolve. 64 GB helps when working with multiple 4K streams, 3D compositing, or 8K footage.",
      },
      {
        q: "Is a MacBook or Windows laptop better for video editing?",
        a: "MacBook Pro M-series leads for ProRes, Final Cut Pro, and overall efficiency. Windows laptops win for raw CUDA compute, upgradability, and running after-effects heavy workflows. Both are viable — the edge depends on your software stack.",
      },
      {
        q: "Do I need an external monitor for video editing on a laptop?",
        a: "Not necessarily — modern OLED and mini-LED laptop panels reach professional color standards. However, an external reference monitor is invaluable for color grading client work where accuracy is non-negotiable.",
      },
    ],
    keywords: [
      "best laptop for video editing",
      "video editing laptop 2026",
      "best laptop for premiere pro",
      "davinci resolve laptop",
      "4k video editing laptop",
    ],
  },
};

// ============================================================================
// Comparison pages: /compare/[slug]
// ============================================================================

export interface ComparisonConfig {
  slug: string;
  product1: string;
  product2: string;
  title: string;
  description: string;
  intro: string;
  chatQuery: string;
  keywords: string[];
}

export const COMPARISON_PAGES: Record<string, ComparisonConfig> = {
  "macbook-air-vs-dell-xps": {
    slug: "macbook-air-vs-dell-xps",
    product1: "MacBook Air",
    product2: "Dell XPS 13",
    title: "MacBook Air vs Dell XPS 13 (2026) — Full Comparison",
    description:
      "MacBook Air vs Dell XPS 13 in 2026: battery life, performance, display, and price. Our AI compares both to help you decide which is right for you.",
    intro:
      "The MacBook Air M3 and Dell XPS 13 are two of the most popular premium ultrabooks on the market. Both are thin, light, and capable — but they differ significantly in performance, ecosystem, and price. Our AI breaks down every key spec to help you decide.",
    chatQuery: "Compare MacBook Air vs Dell XPS 13 — which is better for my needs?",
    keywords: [
      "macbook air vs dell xps",
      "macbook air m3 vs dell xps 13 2026",
      "macbook vs dell comparison",
      "best ultrabook 2026",
    ],
  },
  "macbook-air-m3-vs-macbook-pro": {
    slug: "macbook-air-m3-vs-macbook-pro",
    product1: "MacBook Air M3",
    product2: "MacBook Pro M3",
    title: "MacBook Air M3 vs MacBook Pro M3 (2026) — Should You Upgrade?",
    description:
      "Is the MacBook Pro M3 worth the extra cost over MacBook Air M3? Our AI comparison covers performance, battery, display, and value in 2026.",
    intro:
      "The MacBook Air M3 and MacBook Pro M3 share the same base chip but differ in sustained performance, display quality, ports, and price. Is the Pro's extra cost justified for your workflow? Our AI answers that question.",
    chatQuery: "Compare MacBook Air M3 vs MacBook Pro M3 — is the Pro worth it?",
    keywords: [
      "macbook air m3 vs macbook pro m3",
      "macbook air vs pro comparison 2026",
      "is macbook pro worth it",
      "best macbook 2026",
    ],
  },
  "lenovo-thinkpad-vs-hp-spectre": {
    slug: "lenovo-thinkpad-vs-hp-spectre",
    product1: "Lenovo ThinkPad X1 Carbon",
    product2: "HP Spectre x360",
    title: "ThinkPad X1 Carbon vs HP Spectre x360 (2026) — Business Laptops Compared",
    description:
      "Lenovo ThinkPad X1 Carbon vs HP Spectre x360: keyboard, build quality, battery, and security features compared for business users in 2026.",
    intro:
      "The ThinkPad X1 Carbon and HP Spectre x360 are the gold standard of Windows business laptops. The ThinkPad wins on keyboard and durability; the Spectre wins on design and 2-in-1 flexibility. Here's which one fits your work style.",
    chatQuery: "Compare Lenovo ThinkPad X1 Carbon vs HP Spectre x360 for business use",
    keywords: [
      "thinkpad vs hp spectre",
      "best business laptop 2026",
      "lenovo thinkpad x1 vs hp spectre x360",
      "business ultrabook comparison",
    ],
  },
  "dell-xps-vs-lenovo-thinkpad": {
    slug: "dell-xps-vs-lenovo-thinkpad",
    product1: "Dell XPS 15",
    product2: "Lenovo ThinkPad X1 Extreme",
    title: "Dell XPS 15 vs Lenovo ThinkPad X1 Extreme (2026)",
    description:
      "Dell XPS 15 vs Lenovo ThinkPad X1 Extreme: display, GPU performance, and build quality compared for creative professionals in 2026.",
    intro:
      "For creative professionals who want a powerful 15-inch workhorse, the Dell XPS 15 and ThinkPad X1 Extreme are the top contenders. Both offer OLED options, discrete GPUs, and premium builds — but with different design philosophies.",
    chatQuery: "Compare Dell XPS 15 vs Lenovo ThinkPad X1 Extreme for creative work",
    keywords: [
      "dell xps 15 vs thinkpad x1 extreme",
      "best 15 inch laptop 2026",
      "powerful laptop comparison",
      "creative professional laptop",
    ],
  },
};

// ============================================================================
// Price-filter pages: /best-laptops-under-[price]
// ============================================================================

export interface PriceFilterConfig {
  slug: string;
  price: number;
  title: string;
  description: string;
  h1: string;
  intro: string;
  chatQuery: string;
  keywords: string[];
}

export const PRICE_FILTER_PAGES: Record<string, PriceFilterConfig> = {
  "700": {
    slug: "700",
    price: 700,
    title: "Best Laptops Under $700 in 2026 — AI-Ranked Value Picks",
    description:
      "Best laptops under $700 in 2026. AI-ranked picks with 16 GB RAM, fast SSD, and all-day battery for students and everyday users.",
    h1: "Best Laptops Under $700 in 2026",
    intro:
      "Under $700 you can get a genuinely capable laptop — one that handles college coursework, light coding, video calls, and media without compromise. Our AI engine ranks the top value picks at this price point, balancing specs, battery, and build quality.",
    chatQuery: "Show me the best laptops under $700 with 16GB RAM and good battery life",
    keywords: [
      "best laptop under 700",
      "best budget laptop 2026",
      "laptop under 700 dollars",
      "cheap laptop good performance",
    ],
  },
  "1000": {
    slug: "1000",
    price: 1000,
    title: "Best Laptops Under $1000 in 2026 — Top Mid-Range Picks",
    description:
      "The best laptops under $1000 in 2026. AI-ranked mid-range picks with fast processors, 16–32 GB RAM, and premium displays.",
    h1: "Best Laptops Under $1000 in 2026",
    intro:
      "The $700–$1,000 range is the sweet spot for laptop buyers — where you gain premium build quality, higher-res displays, and better CPUs without paying for the ultra-premium tier. Our AI surfaces the best value at this price point across all use cases.",
    chatQuery: "Show me the best laptops under $1000 with great performance and display",
    keywords: [
      "best laptop under 1000",
      "mid range laptop 2026",
      "best laptop 1000 dollars",
      "best value laptop 2026",
    ],
  },
  "1500": {
    slug: "1500",
    price: 1500,
    title: "Best Laptops Under $1500 in 2026 — Premium Performance",
    description:
      "Best laptops under $1500 in 2026. AI-ranked premium picks with dedicated GPUs, 32 GB RAM, and professional-grade displays.",
    h1: "Best Laptops Under $1500 in 2026",
    intro:
      "At $1,000–$1,500 you enter the premium performance tier — dedicated GPUs, OLED displays, and workstation-class CPUs become available. Our AI identifies which premium laptops deliver the best real-world performance for creative professionals, developers, and power users.",
    chatQuery: "Show me premium laptops under $1500 with dedicated GPU and 32GB RAM",
    keywords: [
      "best laptop under 1500",
      "premium laptop 2026",
      "best laptop 1500 dollars",
      "powerful laptop under 1500",
    ],
  },
};

// ============================================================================
// All slugs — used by sitemap.ts
// ============================================================================

export const ALL_USECASE_SLUGS = Object.keys(LAPTOP_USECASES);
export const ALL_COMPARISON_SLUGS = Object.keys(COMPARISON_PAGES);
export const ALL_PRICE_SLUGS = Object.keys(PRICE_FILTER_PAGES);

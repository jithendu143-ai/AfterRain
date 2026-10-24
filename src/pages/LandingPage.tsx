import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Compass,
  Droplets,
  Layers,
  Leaf,
  MapPin,
  Play,
  Pause,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AfterRainMark } from '../components/AppShell';
import { useAppState } from '../state/AppState';
import { getTrackedIncidents } from '../domain/selectors';

// Kerala-Specific Hero Slides Definition
const HERO_SLIDES = [
  {
    id: 'periyar-mobilization',
    title: "When floodwaters recede, Kerala's real recovery begins.",
    subtitle: 'PERIYAR RIVER BASIN & RESILIENCE',
    tagline: 'Mobilizing local volunteer squads, Fire & Rescue units, and Kudumbashree teams to restore choked stormwater channels along the Periyar before water stagnation.',
    image: '/images/hero.jpg',
    location: 'Aluva Manappuram · Periyar River Basin',
    stats: '2,400 kg Silt Cleared · 100% Flow Restored',
    sdg: 'SDG 11 Resilient Cities & Communities',
    badge: 'STAGE 01 · CIVIC SENTINEL SQUAD',
  },
  {
    id: 'kuttanad-wetlands',
    title: 'Kuttanad polders engineered as natural flood buffers.',
    subtitle: 'NATURE-BASED RIPARIAN HYDROLOGY',
    tagline: 'Traditional earthen bunds, backwater bio-swales, and restored thodu canals naturally absorbing 580,000 liters of monsoon runoff across Vembanad Lake.',
    image: '/images/wetland.jpg',
    location: 'Meenachil–Vembanad Wetland Polders',
    stats: '580 kL Flood Absorption · 6 Native Bio-Filters',
    sdg: 'SDG 13 Climate Adaptation',
    badge: 'STAGE 02 · HYDROLOGY DEFENSE',
  },
  {
    id: 'water-quality-triage',
    title: "Field water telemetry to shield Kerala's open drinking wells.",
    subtitle: 'POTABLE GROUNDWATER SAFEGUARD',
    tagline: 'Equipping trained community environmental responders with digital telemetry probes to screen traditional open ring wells immediately after flood inundation.',
    image: '/images/water-test.jpg',
    location: 'Chalakudy & North Paravur Well Corridors',
    stats: 'Zero Coliform Infiltration · 48 Wells Protected',
    sdg: 'SDG 6 Clean Water & Sanitation',
    badge: 'STAGE 03 · SANITATION & WELL AUDIT',
  },
  {
    id: 'haritha-karma-sena',
    title: 'Haritha Karma Sena diverting flood debris from water bodies.',
    subtitle: 'COMMUNITY CIRCULAR WASTE SEGREGATION',
    tagline: "Kerala's women-led civic green army segregating washed plastic bottles, sodden timber, and clean silt at decentralized panchayat sorting hubs.",
    image: '/images/debris.jpg',
    location: 'Kalamassery & Aluva Grama Panchayats',
    stats: '94% Waste Diverted · Circular Upcycling',
    sdg: 'SDG 12 Responsible Consumption',
    badge: 'STAGE 04 · ZERO-LANDFILL RECOVERY',
  },
];

// Documented Kerala Recovery Case Studies
const PORTFOLIO_PROJECTS = [
  {
    id: 'project-1',
    title: 'Aluva Manappuram Arterial Drainage Culvert Restoration',
    category: 'Waterlogging and drainage',
    image: '/images/after.jpg',
    beforeImage: '/images/before.jpg',
    location: 'Aluva Bypass & Manappuram Canal, Periyar Basin',
    summary: 'Cleared critical stone canal chokepoint blocked by 2.4 tonnes of silt and coconut palm debris, preventing secondary inundation for 310 residential homes.',
    impact: '2.4 Tonnes Silt Diverted',
    team: 'Aluva Municipal Drainage & Fire Rescue',
    status: 'Verified Resolved',
    sdgTag: 'SDG 11',
  },
  {
    id: 'project-2',
    title: 'Kuttanad Vembanad Wetland Bio-Retention Polders',
    category: 'Wetland Ecology',
    image: '/images/wetland.jpg',
    location: 'Alappuzha Backwater Corridor',
    summary: 'Restored traditional earthen bunds and removed invasive water hyacinths (African payal) to reinstate natural flood retention buffer for Vembanad Lake.',
    impact: '580 kL Retention Capacity',
    team: 'Kuttanad Riparian Task Force',
    status: 'Active Buffer',
    sdgTag: 'SDG 13',
  },
  {
    id: 'project-3',
    title: 'Paravur & Chalakudy Basin Drinking Well Safety Screening',
    category: 'Possible water contamination',
    image: '/images/water-test.jpg',
    location: 'Chalakudy & Paravur Groundwater Zones',
    summary: 'Multi-parameter digital testing across 48 community ring wells confirmed zero floodwater sewage seepage after peak water receded.',
    impact: '100% Well Potability Confirmed',
    team: 'Suchitwa Mission Water Quality Unit',
    status: 'Inspected Safe',
    sdgTag: 'SDG 6',
  },
  {
    id: 'project-4',
    title: 'Haritha Karma Sena Grama Panchayat Debris Segregation',
    category: 'Waste and debris',
    image: '/images/debris.jpg',
    location: 'Kalamassery Grama Panchayat Depot',
    summary: 'Decentralized women-led sorting separated 16 cubic meters of plastic bottles, organic silt, and timber, preventing dumping into Vembanad water bodies.',
    impact: '94% Landfill Diversion',
    team: 'Haritha Karma Sena Unit #4',
    status: 'Completed & Logged',
    sdgTag: 'SDG 12',
  },
];

// Interactive Dual-Column Scrollytelling Journey Stages (Authentic Kerala Flood Chronology)
const SCROLL_JOURNEY_STAGES = [
  {
    step: '01',
    phase: 'PHASE 01 · T+0H',
    time: '06:30 AM · Peak Monsoon Surge',
    title: 'Periyar Basin Flood Surge & Silt Choke',
    location: 'Aluva Manappuram Bypass Canal, Periyar Basin',
    story: 'Torrential monsoon downpours cause the Periyar river to crest, leaving 2,400 kg of mud silt, washed coconut fronds, and flood plastic choking the roadside stone drainage canal (thodu). Immediate clearance is essential to restore vehicle transit and stop stagnation.',
    metrics: [
      { label: 'Canal Status', val: '100% Choked' },
      { label: 'Secondary Risk', val: 'Severe Waterlogging' },
      { label: 'Target Action', val: 'Emergency Excavation' },
    ],
    image: '/images/before.jpg',
    glowColor: 'rgba(239, 68, 68, 0.45)',
    tagColor: 'red',
    badge: 'CRITICAL INUNDATION',
  },
  {
    step: '02',
    phase: 'PHASE 02 · T+12H',
    time: '11:15 AM · First-Light Mobilization',
    title: 'Volunteer Sentinel & Fire-Rescue Deployment',
    location: 'Periyar Riverbank & Aluva Outlets',
    story: 'Guided by deterministic priority scoring, local youth action teams, Kerala Fire & Rescue personnel, and community volunteers in high-visibility gear wade into the receding water margins with shovels to clear choked culvert grates and reopen emergency routes.',
    metrics: [
      { label: 'Active Responders', val: '54 On-Site' },
      { label: 'Drainage Status', val: 'Reopened 100%' },
      { label: 'Kerala Protocol', val: 'KSDMA Civic Action' },
    ],
    image: '/images/hero.jpg',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    tagColor: 'amber',
    badge: 'SENTINEL DEPLOYMENT',
  },
  {
    step: '03',
    phase: 'PHASE 03 · T+24H',
    time: '01:45 PM · Decentralized Circular Sorting',
    title: 'Haritha Karma Sena Circular Waste Segregation',
    location: 'Kalamassery Grama Panchayat Recovery Hub',
    story: "Rather than dumping mixed flood waste into overwhelmed municipal landfills, Kerala's Haritha Karma Sena women workers systematically separate recyclable PET bottles, structural bamboo, cardboard, and clean silt into marked circular streams for Clean Kerala Company.",
    metrics: [
      { label: 'Landfill Diversion', val: '94% Circular' },
      { label: 'Diverted Plastic', val: '16 Cubic Meters' },
      { label: 'UN SDG Goal', val: 'SDG 12 Circular Economy' },
    ],
    image: '/images/debris.jpg',
    glowColor: 'rgba(52, 211, 153, 0.45)',
    tagColor: 'emerald',
    badge: 'ZERO-LANDFILL PROTOCOL',
  },
  {
    step: '04',
    phase: 'PHASE 04 · T+36H',
    time: '03:10 PM · Multi-Probe Groundwater Screen',
    title: 'Potable Drinking Well Telemetry Shield',
    location: 'North Paravur & Chalakudy Ring Wells',
    story: 'Certified water quality officers and Suchitwa Mission teams deploy handheld digital optical telemetry probes at domestic open ring wells, measuring turbidity, pH, and coliform indicators to certify drinking safety before families resume well usage.',
    metrics: [
      { label: 'Drinking Wells Tested', val: '48 / 48 Certified Safe' },
      { label: 'Turbidity Index', val: '0.58 NTU (Optimal)' },
      { label: 'UN SDG Goal', val: 'SDG 6 Clean Drinking Water' },
    ],
    image: '/images/water-test.jpg',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    tagColor: 'cyan',
    badge: 'WATER SHIELD VERIFIED',
  },
  {
    step: '05',
    phase: 'PHASE 05 · T+72H',
    time: '05:00 PM · Full Hydrologic Rebirth',
    title: 'Restored Stone Waterway & Climate Resilience',
    location: 'Aluva Restored Stone Canal (Thodu)',
    story: 'The stone-lined roadside canal is completely cleared and flowing crystal-clear water smoothly into the Periyar river. Dry tarmac road, vibrant tropical greenery, and unblocked culverts ensure lasting neighborhood resilience against future monsoon shocks.',
    metrics: [
      { label: 'Hydrologic Flow', val: '100% Free Flow' },
      { label: 'Ecosystem Type', val: 'Living Stone Swale' },
      { label: 'Audit Status', val: 'Panchayat Verified' },
    ],
    image: '/images/after.jpg',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    tagColor: 'green',
    badge: 'RESTORATION COMPLETE',
  },
];

// Panoramic Kerala Filmstrip Ribbon
const FILMSTRIP_ITEMS = [
  { id: 'f1', image: '/images/hero.jpg', tag: 'PERIYAR BASIN', caption: 'Aluva Volunteer Sentinel Squad' },
  { id: 'f2', image: '/images/debris.jpg', tag: 'HARITHA KARMA SENA', caption: 'Decentralized Waste Segregation' },
  { id: 'f3', image: '/images/water-test.jpg', tag: 'WELL TELEMETRY', caption: 'Paravur Domestic Well Audit' },
  { id: 'f4', image: '/images/wetland.jpg', tag: 'KUTTANAD POLDERS', caption: 'Vembanad Natural Flood Swale' },
  { id: 'f5', image: '/images/after.jpg', tag: 'RESTORED THODU', caption: 'Clean Flowing Stone Canal' },
  { id: 'f6', image: '/images/before.jpg', tag: 'PEAK SURGE', caption: 'Post-Monsoon Road Inundation' },
];

export function LandingPage() {
  const { data } = useAppState();
  const incidents = [...getTrackedIncidents(data)].sort((a, b) => b.scores.priority - a.scores.priority);
  const completedTasks = data.tasks.filter((task) => task.status === 'Resolved').length;
  const highPriorityCount = incidents.filter((i) => i.scores.priorityBand === 'High').length;

  // Hero Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isAutoPlaying) return;
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAutoPlaying]);

  const activeSlide = HERO_SLIDES[currentSlide];

  // Global Page Reading Progress Bar
  const [pageScrollProgress, setPageScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (docHeight > 0) {
            const currentScroll = window.scrollY || document.documentElement.scrollTop;
            setPageScrollProgress(Math.min(100, Math.max(0, (currentScroll / docHeight) * 100)));
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // =========================================================================
  // TRUE SCROLLYTELLING CONTROLLER (IntersectionObserver Driven)
  // Scrolling down the page naturally moves through the 5 stages and updates
  // the sticky graphic stage without trapping the scroll wheel.
  // =========================================================================
  const [activeScrollyIndex, setActiveScrollyIndex] = useState(0);
  const narrativeCardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    narrativeCardRefs.current.forEach((el, index) => {
      if (!el) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveScrollyIndex(index);
            }
          });
        },
        {
          root: null,
          rootMargin: '-25% 0px -35% 0px',
          threshold: 0.15,
        }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, []);

  const scrollToStage = (index: number) => {
    const el = narrativeCardRefs.current[index];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setActiveScrollyIndex(index);
    }
  };

  const activeScrollyStage = SCROLL_JOURNEY_STAGES[activeScrollyIndex];

  // Interactive Before/After Slider State
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderContainerRef = useRef<HTMLDivElement | null>(null);

  const handleSliderMove = (clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPos(percent);
  };

  // Interactive Priority Simulator State (Kerala Field Signals)
  const [hasWaterRisk, setHasWaterRisk] = useState(true);
  const [hasAccessBlocked, setHasAccessBlocked] = useState(true);
  const [hasHazmatOdour, setHasHazmatOdour] = useState(false);
  const [isRecurrentZone, setIsRecurrentZone] = useState(true);

  // Compute live simulated scores
  const impactScore = (hasAccessBlocked ? 40 : 15) + (hasWaterRisk ? 35 : 10) + (hasHazmatOdour ? 25 : 0);
  const simulatedSeverity = Math.min(
    100,
    Math.round(
      0.35 * impactScore +
      0.25 * (hasWaterRisk ? 85 : 30) +
      0.20 * (hasAccessBlocked ? 80 : 25) +
      0.10 * (hasHazmatOdour ? 90 : 20) +
      0.10 * 75
    )
  );
  const simulatedPriority = Math.min(
    100,
    Math.round(
      0.50 * simulatedSeverity +
      0.20 * (hasAccessBlocked ? 85 : 40) +
      0.15 * (hasWaterRisk ? 90 : 35) +
      0.15 * (isRecurrentZone ? 80 : 30)
    )
  );
  const simulatedBand = simulatedPriority >= 75 ? 'High' : simulatedPriority >= 45 ? 'Medium' : 'Lower';

  // Portfolio Filter Tab
  const [portfolioFilter, setPortfolioFilter] = useState<'All' | 'Waterways' | 'Debris' | 'Infrastructure'>('All');

  const filteredProjects = PORTFOLIO_PROJECTS.filter((proj) => {
    if (portfolioFilter === 'All') return true;
    if (portfolioFilter === 'Waterways') return proj.category.toLowerCase().includes('water') || proj.category.toLowerCase().includes('wetland');
    if (portfolioFilter === 'Debris') return proj.category.toLowerCase().includes('debris') || proj.category.toLowerCase().includes('waste');
    if (portfolioFilter === 'Infrastructure') return proj.category.toLowerCase().includes('drainage') || proj.category.toLowerCase().includes('waterlogging');
    return true;
  });

  return (
    <div className="landing-page portfolio-aesthetic">
      {/* Global Reading Progress Bar fixed at top of screen */}
      <div className="global-reading-progress-track" aria-hidden="true">
        <div className="global-reading-progress-fill" style={{ width: `${pageScrollProgress}%` }} />
      </div>

      {/* Ambient Top Glow Effect */}
      <div className="ambient-radial-glow" aria-hidden="true" />

      {/* Modern Kerala Portfolio Header */}
      <header className="landing-header">
        <div className="header-inner-container">
          <Link to="/" className="landing-brand">
            <div className="landing-brand-glow">
              <AfterRainMark size={36} />
            </div>
            <div className="brand-text-stack">
              <strong>AfterRain</strong>
              <span className="brand-subtext">KERALA CIVIC ECO-LEDGER</span>
            </div>
          </Link>

          <div className="header-status-pill">
            <span className="status-ping-dot" />
            <span>KSDMA Active Ledger</span>
          </div>

          <nav className="landing-nav" aria-label="Landing page navigation">
            <a href="#recovery-journey">Recovery Journey</a>
            <a href="#before-after">Restoration Proof</a>
            <a href="#showcase">Field Archives</a>
            <a href="#simulator">Priority Lab</a>
            <a href="#sdg">SDG Matrix</a>
            <Link to="/map">Spatial Map</Link>
            <Link to="/dashboard" className="nav-overview-link">Command Desk</Link>
            <Link className="btn btn-primary btn-glow" to="/report">
              <span>Report Observation</span>
              <ArrowRight size={14} />
            </Link>
          </nav>
        </div>
      </header>

      <main className="landing-main">
        {/* =================================================================
            1. DYNAMIC IMMERSIVE HERO CAROUSEL (Kerala Flood Recovery)
            ================================================================= */}
        <section className="portfolio-hero-carousel" aria-label="Featured Kerala Recovery Carousel">
          <div
            className="carousel-viewport"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            {/* Background Image with Smooth Crossfade & Scale */}
            <div className="carousel-backdrop-container">
              {HERO_SLIDES.map((slide, idx) => (
                <div
                  key={slide.id}
                  className={`carousel-slide-bg ${idx === currentSlide ? 'active' : ''}`}
                  style={{ backgroundImage: `url(${slide.image})` }}
                  role="img"
                  aria-label={slide.title}
                />
              ))}
              <div className="carousel-vignette-overlay" />
            </div>

            {/* Overlapping Hero Editorial Narrative */}
            <div className="carousel-content-wrapper">
              <div className="carousel-caption-card">
                <div className="caption-badge-cluster">
                  <span className="slide-badge-pill">{activeSlide.badge}</span>
                  <span className="slide-sdg-pill">{activeSlide.sdg}</span>
                </div>

                <h1 className="carousel-hero-title">{activeSlide.title}</h1>

                <p className="carousel-hero-description">{activeSlide.tagline}</p>

                <div className="carousel-meta-bar">
                  <div className="meta-pin">
                    <MapPin size={14} />
                    <span>{activeSlide.location}</span>
                  </div>
                  <div className="meta-stat">
                    <Sparkles size={14} />
                    <span>{activeSlide.stats}</span>
                  </div>
                </div>

                <div className="carousel-cta-actions">
                  <Link to="/dashboard" className="btn btn-primary btn-lg btn-glow">
                    <span>Enter Command Desk</span>
                    <ArrowRight size={16} />
                  </Link>
                  <a href="#recovery-journey" className="btn btn-secondary btn-lg">
                    <Compass size={16} />
                    <span>Explore Recovery Journey</span>
                  </a>
                </div>
              </div>

              {/* Floating Live Telemetry HUD Widget */}
              <div className="carousel-live-hud">
                <div className="hud-glass-card">
                  <div className="hud-top">
                    <span className="hud-label">KERALA CIVIC FRAMEWORK</span>
                    <span className="hud-dot green" />
                  </div>
                  <strong className="hud-stat">KSDMA + Haritha Sena</strong>
                  <span className="hud-sub">Decentralized disaster resilience protocol</span>
                  <div className="hud-mini-meter">
                    <div className="hud-mini-fill green" style={{ width: '94%' }} />
                  </div>
                </div>

                <div className="hud-glass-card">
                  <div className="hud-top">
                    <span className="hud-label">VERIFIED DRAINAGE RESTORATION</span>
                    <span className="hud-dot" />
                  </div>
                  <strong className="hud-stat">100% Flow Restored</strong>
                  <span className="hud-sub">Periyar, Chalakudy &amp; Kuttanad basins</span>
                  <div className="hud-mini-meter">
                    <div className="hud-mini-fill" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Carousel Navigation Dock */}
            <div className="carousel-nav-dock">
              <div className="carousel-indicators">
                {HERO_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    className={`indicator-pill ${idx === currentSlide ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                  >
                    <span className="indicator-index">0{idx + 1}</span>
                    <span className="indicator-label">{slide.subtitle}</span>
                    {idx === currentSlide && isAutoPlaying && (
                      <span className="indicator-progress-bar" />
                    )}
                  </button>
                ))}
              </div>

              <div className="carousel-arrow-controls">
                <button
                  type="button"
                  className="carousel-arrow-btn"
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className="carousel-play-toggle"
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  aria-label={isAutoPlaying ? 'Pause autoplay' : 'Resume autoplay'}
                >
                  {isAutoPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                  type="button"
                  className="carousel-arrow-btn"
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
                  aria-label="Next slide"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================
            2. REAL-TIME COMMUNITY PULSE TICKER (Kerala Civic Data)
            ================================================================= */}
        <section className="live-telemetry-strip" aria-label="Real-time recovery metrics">
          <div className="telemetry-strip-inner">
            <div className="telemetry-kpi-card">
              <div className="kpi-icon-wrap kpi-green">
                <ClipboardList size={22} />
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Field Observations</span>
                <strong className="kpi-value">{data.reports.length}</strong>
                <span className="kpi-sub">Logged across Kerala wards</span>
              </div>
            </div>

            <div className="telemetry-kpi-card">
              <div className="kpi-icon-wrap kpi-teal">
                <Layers size={22} />
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Geocoded Incidents</span>
                <strong className="kpi-value">{incidents.length}</strong>
                <span className="kpi-sub">Aluva, Thrissur, Wayanad</span>
              </div>
            </div>

            <div className="telemetry-kpi-card">
              <div className="kpi-icon-wrap kpi-amber">
                <ShieldAlert size={22} />
              </div>
              <div className="kpi-content">
                <span className="kpi-label">High-Priority Triage</span>
                <strong className="kpi-value">{highPriorityCount}</strong>
                <span className="kpi-sub">Critical road &amp; well risks</span>
              </div>
            </div>

            <div className="telemetry-kpi-card">
              <div className="kpi-icon-wrap kpi-emerald">
                <CheckCircle2 size={22} />
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Verified Closures</span>
                <strong className="kpi-value">{completedTasks}</strong>
                <span className="kpi-sub">Recorded with photo proof</span>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================
            3. TRUE INTERACTIVE SCROLLYTELLING EXPERIENCE
            (Dual-column sticky split stage: Scrolling drives chapter images)
            ================================================================= */}
        <section className="scrollytelling-section" id="recovery-journey">
          <div className="section-head-center">
            <div className="eyebrow-pill">
              <Sparkles size={12} />
              <span>KERALA RECOVERY CHRONICLE</span>
            </div>
            <h2>Chronicles of Hydrological Resilience</h2>
            <p>
              Scroll down naturally to witness how decentralized civic action and telemetry restore Kerala's fragile hydrological arteries — from peak Periyar river surges to revived backwaters.
            </p>
          </div>

          <div className="scrollytelling-container">
            {/* LEFT COLUMN: Narrative Scroll Track (Flows with natural page scroll) */}
            <div className="scrolly-narrative-track">
              {SCROLL_JOURNEY_STAGES.map((stage, idx) => {
                const isActive = activeScrollyIndex === idx;
                return (
                  <div
                    key={stage.step}
                    ref={(el) => {
                      narrativeCardRefs.current[idx] = el;
                    }}
                    className={`scrolly-narrative-card ${isActive ? 'active-card' : ''}`}
                  >
                    <div className="scrolly-card-topbar">
                      <span className={`scrolly-phase-pill badge-${stage.tagColor}`}>
                        <span className="badge-bullet" />
                        {stage.phase}
                      </span>
                      <span className="scrolly-timestamp">
                        <Clock size={12} />
                        {stage.time}
                      </span>
                    </div>

                    <div className="scrolly-location-badge">
                      <MapPin size={13} />
                      <span>{stage.location}</span>
                    </div>

                    <h3 className="scrolly-stage-title">{stage.title}</h3>

                    <p className="scrolly-stage-narrative">{stage.story}</p>

                    <div className="scrolly-metrics-grid">
                      {stage.metrics.map((m) => (
                        <div key={m.label} className="scrolly-metric-chip">
                          <span className="metric-chip-label">{m.label}</span>
                          <strong className="metric-chip-val">{m.val}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="scrolly-card-footer">
                      <Link to="/incidents" className="btn btn-secondary btn-sm">
                        <span>Inspect Field Dispatch</span>
                        <ArrowUpRight size={13} />
                      </Link>
                      <span className="scrolly-stage-counter">
                        Milestone {stage.step} of 05
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT COLUMN: Pinned Sticky Visual Theater Stage */}
            <div className="scrolly-sticky-stage-wrapper">
              <div className="scrolly-sticky-stage">
                {/* Background Ambient Glow */}
                <div
                  className="scrolly-ambient-halo"
                  style={{
                    background: `radial-gradient(circle at 60% 40%, ${activeScrollyStage.glowColor}, transparent 70%)`,
                  }}
                  aria-hidden="true"
                />

                {/* Layered Cross-fading Kerala Photographs */}
                <div className="scrolly-images-stack">
                  {SCROLL_JOURNEY_STAGES.map((stage, idx) => {
                    const isVisible = activeScrollyIndex === idx;
                    return (
                      <div
                        key={stage.step}
                        className={`scrolly-photo-layer ${isVisible ? 'active' : ''}`}
                        style={{
                          opacity: isVisible ? 1 : 0,
                          pointerEvents: isVisible ? 'auto' : 'none',
                        }}
                      >
                        <img
                          src={stage.image}
                          alt={stage.title}
                          className="scrolly-photo-img"
                          draggable={false}
                        />
                        <div className="scrolly-photo-vignette" />
                      </div>
                    );
                  })}
                </div>

                {/* Top Stage Navigation Dock */}
                <div className="scrolly-stage-topbar">
                  <div className="scrolly-protocol-badge">
                    <span className="live-pulse-dot" />
                    <span>KSDMA CIVIC PROTOCOL</span>
                  </div>

                  <div className="scrolly-nav-dots">
                    {SCROLL_JOURNEY_STAGES.map((s, idx) => (
                      <button
                        key={s.step}
                        type="button"
                        className={`scrolly-dot-node ${activeScrollyIndex === idx ? 'active' : ''}`}
                        onClick={() => scrollToStage(idx)}
                        title={`Jump to Phase ${s.step}: ${s.title}`}
                      >
                        <span className="dot-node-circle" />
                        <span className="dot-node-label">{s.step}</span>
                      </button>
                    ))}
                  </div>

                  <span className="scrolly-active-indicator">
                    STAGE 0{activeScrollyIndex + 1}/05
                  </span>
                </div>

                {/* Floating Bottom Telemetry Card */}
                <div className="scrolly-stage-bottom-hud">
                  <div className="hud-badge-line">
                    <span className={`scrolly-status-badge badge-${activeScrollyStage.tagColor}`}>
                      {activeScrollyStage.badge}
                    </span>
                    <span className="hud-location-text">
                      <MapPin size={12} />
                      {activeScrollyStage.location}
                    </span>
                  </div>

                  <h4 className="hud-stage-heading">{activeScrollyStage.title}</h4>

                  <div className="hud-telemetry-strip">
                    {activeScrollyStage.metrics.map((m) => (
                      <div key={m.label} className="hud-kpi-chip">
                        <span className="hud-kpi-label">{m.label}:</span>
                        <strong className="hud-kpi-val">{m.val}</strong>
                      </div>
                    ))}
                  </div>

                  {/* Stage Progress Bar */}
                  <div className="scrolly-stage-progress-bar">
                    <div
                      className="stage-progress-fill"
                      style={{
                        width: `${((activeScrollyIndex + 1) / SCROLL_JOURNEY_STAGES.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Continuous Horizontal Photographic Filmstrip Ribbon */}
        <div className="continuous-filmstrip-section" aria-hidden="true">
          <div className="filmstrip-marquee-track">
            <div className="filmstrip-ribbon-content">
              {FILMSTRIP_ITEMS.concat(FILMSTRIP_ITEMS).map((item, idx) => (
                <div className="filmstrip-card" key={`${item.id}-${idx}`}>
                  <img src={item.image} alt={item.caption} loading="lazy" />
                  <div className="filmstrip-card-overlay">
                    <span className="filmstrip-card-tag">{item.tag}</span>
                    <span className="filmstrip-card-caption">{item.caption}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* =================================================================
            4. INTERACTIVE BEFORE / AFTER RECOVERY SLIDER
            (Visual proof: Aluva Manappuram Roadside Stone Canal Restoration)
            ================================================================= */}
        <section className="before-after-section" id="before-after">
          <div className="section-head-center">
            <div className="eyebrow-pill">
              <Sparkles size={12} />
              <span>VISUAL PROOF OF ECOLOGICAL RESTORATION</span>
            </div>
            <h2>Drag to reveal real post-flood transformation.</h2>
            <p>
              Recovery is measurable. See the impact of verified coordination: from a clogged, waterlogged stone canal (thodu)
              in Aluva to a restored free-flowing waterway flowing smoothly into the Periyar River.
            </p>
          </div>

          <div className="comparison-slider-wrapper">
            <div
              className="comparison-slider-container"
              ref={sliderContainerRef}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onMouseMove={(e) => {
                if (isDragging || e.buttons === 1) handleSliderMove(e.clientX);
              }}
              onTouchMove={(e) => {
                if (e.touches[0]) handleSliderMove(e.touches[0].clientX);
              }}
            >
              {/* After Image (Background layer) */}
              <img
                src="/images/after.jpg"
                alt="Aluva roadside stone canal restored with clean flowing water and dry road"
                className="comparison-img img-after"
                draggable={false}
              />
              <div className="comparison-badge badge-after">
                <span className="badge-dot green" />
                <span>AFTER: RESTORED STONE THODU (04:15 PM)</span>
              </div>

              {/* Before Image (Clipped overlay) */}
              <div
                className="comparison-overlay"
                style={{ width: `${sliderPos}%` }}
              >
                <img
                  src="/images/before.jpg"
                  alt="Aluva roadside canal flooded and choked with palm fronds and silt"
                  className="comparison-img img-before"
                  draggable={false}
                />
                <div className="comparison-badge badge-before">
                  <span className="badge-dot red" />
                  <span>BEFORE: PEAK FLOOD IMPACT (08:30 AM)</span>
                </div>
              </div>

              {/* Draggable Divider Handle */}
              <div
                className="comparison-handle"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="handle-line" />
                <div className="handle-button" aria-label="Drag slider">
                  <ChevronLeft size={16} />
                  <ChevronRight size={16} />
                </div>
                <div className="handle-line" />
              </div>
            </div>

            {/* Telemetry Footnote */}
            <div className="comparison-telemetry-bar">
              <div className="comp-meta-item">
                <MapPin size={15} />
                <span><strong>Location:</strong> Aluva Manappuram Bypass (10.1076° N, 76.3516° E)</span>
              </div>
              <div className="comp-meta-item">
                <Droplets size={15} />
                <span><strong>Ecological Metric:</strong> 2,400 kg silt removed · 100% culvert capacity</span>
              </div>
              <div className="comp-meta-item">
                <CheckCircle2 size={15} />
                <span><strong>Verified Outcome:</strong> SDG 11.5 Municipal Clearance Target Met</span>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================
            5. MODERN PORTFOLIO CASE STUDIES GRID (Documented Kerala Recovery)
            ================================================================= */}
        <section className="portfolio-showcase-section" id="showcase">
          <div className="section-head-center">
            <div className="eyebrow-pill">
              <Compass size={12} />
              <span>FIELD DISPATCHES &amp; KERALA ARCHIVES</span>
            </div>
            <h2>Documented Kerala Environmental Recovery Missions</h2>
            <p>
              Explore verified case studies recorded across Kerala panchayats. Each record links back to citizen observations,
              transparent priority scores, and verified waste diversion logs.
            </p>
          </div>

          <div className="portfolio-filter-tabs">
            {(['All', 'Waterways', 'Debris', 'Infrastructure'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                className={`filter-pill-btn ${portfolioFilter === filter ? 'active' : ''}`}
                onClick={() => setPortfolioFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="portfolio-grid">
            {filteredProjects.map((proj) => (
              <article className="portfolio-card" key={proj.id}>
                <div className="portfolio-card-media">
                  <img src={proj.image} alt={proj.title} loading="lazy" />
                  <div className="media-overlay-gradient" />
                  <div className="media-floating-badges">
                    <span className="card-sdg-tag">{proj.sdgTag}</span>
                    <span className="card-status-pill">{proj.status}</span>
                  </div>
                </div>

                <div className="portfolio-card-body">
                  <div className="card-category-line">
                    <span className="card-cat-name">{proj.category}</span>
                    <span className="card-location">
                      <MapPin size={12} /> {proj.location}
                    </span>
                  </div>

                  <h3 className="card-heading">{proj.title}</h3>

                  <p className="card-summary">{proj.summary}</p>

                  <div className="card-metrics-row">
                    <div className="metric-chip">
                      <span className="chip-label">Measured Outcome:</span>
                      <strong className="chip-value">{proj.impact}</strong>
                    </div>
                    <div className="metric-chip">
                      <span className="chip-label">Dispatch Team:</span>
                      <strong className="chip-value">{proj.team}</strong>
                    </div>
                  </div>

                  <div className="card-footer-action">
                    <Link to="/incidents" className="btn btn-secondary btn-sm">
                      <span>Inspect Audit Record</span>
                      <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* =================================================================
            6. INTERACTIVE HEURISTIC LAB (Priority Algorithm Simulator)
            ================================================================= */}
        <section className="simulator-section" id="simulator">
          <div className="simulator-container">
            <div className="simulator-head">
              <div className="eyebrow-pill">
                <Activity size={12} />
                <span>INTERACTIVE HEURISTIC LAB</span>
              </div>
              <h2>How AfterRain Computes Operational Priority</h2>
              <p>
                Unlike opaque black-box AI models, our scoring system is deterministic, transparent, and auditable.
                Toggle real-world Kerala field signals below to observe how severity and operational urgency respond in real time.
              </p>
            </div>

            <div className="simulator-interactive-grid">
              <div className="simulator-controls-card">
                <span className="controls-label">Toggle Field Observation Signals:</span>

                <div className="toggle-list">
                  <label className="signal-toggle-label">
                    <input
                      type="checkbox"
                      checked={hasAccessBlocked}
                      onChange={(e) => setHasAccessBlocked(e.target.checked)}
                    />
                    <div className="toggle-box" />
                    <div className="toggle-info">
                      <strong>Evacuation or Emergency Access Blocked</strong>
                      <span>Public-safety factor +40 points · Disruption multiplier (e.g. Aluva Hospital Road)</span>
                    </div>
                  </label>

                  <label className="signal-toggle-label">
                    <input
                      type="checkbox"
                      checked={hasWaterRisk}
                      onChange={(e) => setHasWaterRisk(e.target.checked)}
                    />
                    <div className="toggle-box" />
                    <div className="toggle-info">
                      <strong>Proximity to Domestic Ring Well or Waterway</strong>
                      <span>Environmental sensitivity +35 points · Escalates water quality testing</span>
                    </div>
                  </label>

                  <label className="signal-toggle-label">
                    <input
                      type="checkbox"
                      checked={hasHazmatOdour}
                      onChange={(e) => setHasHazmatOdour(e.target.checked)}
                    />
                    <div className="toggle-box" />
                    <div className="toggle-info">
                      <strong>Chemical Sheen, Unusual Odor, or Sewage Overflow</strong>
                      <span>Potential environmental harm +25 points · Immediate Suchitwa Mission alert</span>
                    </div>
                  </label>

                  <label className="signal-toggle-label">
                    <input
                      type="checkbox"
                      checked={isRecurrentZone}
                      onChange={(e) => setIsRecurrentZone(e.target.checked)}
                    />
                    <div className="toggle-box" />
                    <div className="toggle-info">
                      <strong>Recurrent Chronic Monsoon Hotspot</strong>
                      <span>Persistence factor +20 points · Prioritizes long-term resilience (e.g. Chalakudy basin)</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Dynamic Score Display Card */}
              <div className="simulator-gauge-card">
                <div className="gauge-header">
                  <span className="gauge-sub">COMPUTED LIVE</span>
                  <strong className={`gauge-band band-${simulatedBand.toLowerCase()}`}>
                    {simulatedBand} Urgency
                  </strong>
                </div>

                <div className="gauge-meters-stack">
                  <div className="gauge-row">
                    <div className="gauge-text-line">
                      <span>Provisional Severity Score</span>
                      <strong>{simulatedSeverity} <small>/100</small></strong>
                    </div>
                    <div className="gauge-track">
                      <div
                        className="gauge-progress sev"
                        style={{ width: `${simulatedSeverity}%` }}
                      />
                    </div>
                    <span className="gauge-formula">
                      35% Impact + 25% Eco Harm + 20% Safety + 10% Infra + 10% Evidence
                    </span>
                  </div>

                  <div className="gauge-row">
                    <div className="gauge-text-line">
                      <span>Operational Priority Rank</span>
                      <strong className="priority-color">{simulatedPriority} <small>/100</small></strong>
                    </div>
                    <div className="gauge-track">
                      <div
                        className="gauge-progress pri"
                        style={{ width: `${simulatedPriority}%` }}
                      />
                    </div>
                    <span className="gauge-formula">
                      50% Severity + 20% Time Sensitivity + 15% Eco Sensitivity + 15% Persistence
                    </span>
                  </div>
                </div>

                <div className="gauge-explanation-box">
                  <strong>Recommended Dispatch Action:</strong>
                  <p>
                    {simulatedBand === 'High'
                      ? 'Deploy rapid municipal response team and Fire & Rescue within 4 hours. Isolate potential contaminated runoff and establish detour routes.'
                      : simulatedBand === 'Medium'
                      ? 'Queue for secondary clearance within 24 hours. Notify Haritha Karma Sena for safe debris segregation.'
                      : 'Monitor area; record for scheduled routine panchayat maintenance as waters recede.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================
            7. UNITED NATIONS SDG IMPACT MATRIX
            ================================================================= */}
        <section className="sdg-matrix-section" id="sdg">
          <div className="section-head-center">
            <div className="eyebrow-pill">
              <Leaf size={12} />
              <span>UNITED NATIONS SDG COMMITMENT</span>
            </div>
            <h2>Environmental recovery with honest, measured targets.</h2>
            <p>
              AfterRain is engineered directly around the UN 2030 Agenda for Sustainable Development.
              We do not fabricate carbon offsets; every indicator represents verified Kerala civic coordination.
            </p>
          </div>

          <div className="sdg-grid-showcase">
            <div className="sdg-master-card sdg-11">
              <div className="sdg-card-top">
                <span className="sdg-badge-number">11</span>
                <span className="sdg-primary-pill">PRIMARY SDG FOCUS</span>
              </div>
              <h3>Sustainable Cities &amp; Communities</h3>
              <p>
                Target 11.5: Significantly reduce the number of people affected by water-related disasters.
                AfterRain accelerates post-flood drainage unclogging, roads recovery, and neighborhood access restoration in Kerala.
              </p>
              <div className="sdg-card-foot">
                <span>Field Indicator:</span>
                <strong>Municipal Drainage Clearance Rate</strong>
              </div>
            </div>

            <div className="sdg-master-card sdg-06">
              <div className="sdg-card-top">
                <span className="sdg-badge-number">06</span>
                <span className="sdg-sub-pill">CLEAN WATER</span>
              </div>
              <h3>Clean Water &amp; Sanitation</h3>
              <p>
                Target 6.3: Improve water quality by eliminating dumping and hazardous chemical runoff.
                Fast identification of sewage overflow and industrial runoff prevents potable household well contamination.
              </p>
              <div className="sdg-card-foot">
                <span>Field Indicator:</span>
                <strong>Qualified Domestic Well Inspections Triggered</strong>
              </div>
            </div>

            <div className="sdg-master-card sdg-12">
              <div className="sdg-card-top">
                <span className="sdg-badge-number">12</span>
                <span className="sdg-sub-pill">CIRCULAR RECOVERY</span>
              </div>
              <h3>Responsible Consumption &amp; Segregation</h3>
              <p>
                Target 12.5: Substantially reduce waste generation through prevention, reduction, recycling, and reuse.
                Haritha Karma Sena mandates material segregation so flood debris is diverted into circular processing.
              </p>
              <div className="sdg-card-foot">
                <span>Field Indicator:</span>
                <strong>Verified Recyclable Debris Volume (kg)</strong>
              </div>
            </div>

            <div className="sdg-master-card sdg-13">
              <div className="sdg-card-top">
                <span className="sdg-badge-number">13</span>
                <span className="sdg-sub-pill">RESILIENCE</span>
              </div>
              <h3>Climate Action &amp; Adaptation</h3>
              <p>
                Target 13.1: Strengthen resilience and adaptive capacity to climate-related hazards and natural disasters.
                Builds localized institutional memory of chronic Kerala flood hotspots for future municipal mitigation planning.
              </p>
              <div className="sdg-card-foot">
                <span>Field Indicator:</span>
                <strong>Historical Hotspot Clustering Intelligence</strong>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="bottom-cta-banner">
          <div className="cta-banner-content">
            <span className="cta-kicker">READY TO EXPLORE LOCAL SIMULATION?</span>
            <h2>Take control of community flood recovery.</h2>
            <p>
              Review the live priority register, inspect explainable decision trails, or report a simulated observation right now.
            </p>
            <div className="cta-buttons">
              <Link to="/dashboard" className="btn btn-primary btn-lg btn-glow">
                <span>Enter Operations Desk</span>
                <ArrowRight size={16} />
              </Link>
              <Link to="/report" className="btn btn-secondary btn-lg">
                <ClipboardList size={16} />
                <span>Submit Field Report</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Modern High-Design Footer */}
      <footer className="landing-footer">
        <div className="footer-inner-container">
          <div className="footer-top-grid">
            <div className="footer-brand-col">
              <Link to="/" className="landing-brand">
                <AfterRainMark size={32} />
                <div className="brand-text-stack">
                  <strong>AfterRain</strong>
                  <span className="brand-subtext">KERALA CIVIC ECO-INTELLIGENCE</span>
                </div>
              </Link>
              <p className="footer-tagline">
                When the water recedes, recovery begins. <br />
                Open decision-support for climate-resilient Kerala communities.
              </p>
              <div className="footer-privacy-note">
                <ShieldCheck size={14} />
                <span>Zero telemetry tracking · Local browser persistence</span>
              </div>
            </div>

            <div className="footer-links-col">
              <strong>Operations</strong>
              <Link to="/dashboard">Recovery Overview</Link>
              <Link to="/incidents">Incident Intelligence</Link>
              <Link to="/map">Spatial Coordinate Map</Link>
              <Link to="/planner">Recovery Planner</Link>
            </div>

            <div className="footer-links-col">
              <strong>Citizen Action</strong>
              <Link to="/report">Submit Safe Observation</Link>
              <Link to="/analytics">Impact &amp; Waste Analytics</Link>
              <a href="#simulator">Priority Formula Simulator</a>
              <a href="#sdg">UN SDG 11 &amp; 6 Targets</a>
            </div>

            <div className="footer-links-col">
              <strong>Ethical Charter</strong>
              <span className="charter-text">
                AfterRain is an open civic decision-support prototype. It does not replace official emergency services (112 / KSDMA),
                certified environmental testing, or structural engineer evaluations.
              </span>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <span>&copy; {new Date().getFullYear()} AfterRain Project · Released for Sustainable Environmental Resilience in Kerala</span>
            <span>SDG 11 Sustainable Cities &amp; Communities · SDG 6 · 12 · 13</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FilterAccordion({ title, children, defaultOpen = false, className = "" }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const panelId = useId();
  return (
    <section
      className={`filter-accordion${isOpen ? " is-open" : ""} ${className}`.trim()}
    >
      <button
        type="button"
        className="filter-accordion-trigger"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{title}</span>
        <span className="filter-accordion-chevron" aria-hidden="true">
          <span></span>
        </span>
      </button>
      <div id={panelId} className="filter-accordion-panel" aria-hidden={!isOpen}>
        <div className="filter-accordion-content">{children}</div>
      </div>
    </section>
  );
}

/* Usage profiles are available immediately for every category. The API may
   replace these defaults with the administrator's curated profiles. */
const USAGE_PROFILE_TEMPLATES = {
  laptop: [["گیمینگ", "laptop"], ["برنامه‌نویسی", "keyboard"], ["دانشجویی", "laptop"], ["اداری", "case"], ["مهندسی", "cpu"], ["طراحی و تولید محتوا", "gpu"], ["استفاده روزمره", "mouse"]],
  cpu: [["گیمینگ", "cpu"], ["رندرینگ", "gpu"], ["مهندسی", "cpu"], ["سیستم اداری", "case"], ["سرور و پردازش سنگین", "motherboard"]],
  gpu: [["گیمینگ", "gpu"], ["رندر سه‌بعدی", "gpu"], ["هوش مصنوعی", "cpu"], ["طراحی و تدوین", "monitor"], ["کار حرفه‌ای", "motherboard"]],
  ram: [["گیمینگ", "ram"], ["برنامه‌نویسی", "keyboard"], ["رندرینگ", "gpu"], ["اداری", "case"], ["سرور", "motherboard"]],
  ssd: [["گیمینگ", "ssd"], ["ارتقای لپ‌تاپ", "laptop"], ["آرشیو سریع", "ssd"], ["تدوین و محتوا", "monitor"], ["استفاده روزمره", "case"]],
  monitor: [["گیمینگ", "monitor"], ["طراحی گرافیک", "gpu"], ["برنامه‌نویسی", "keyboard"], ["اداری", "case"], ["تدوین ویدئو", "monitor"]],
  mouse: [["گیمینگ", "mouse"], ["طراحی", "mouse"], ["ارگونومیک", "mouse"], ["اداری", "case"], ["قابل حمل", "laptop"]],
  keyboard: [["گیمینگ", "keyboard"], ["برنامه‌نویسی", "keyboard"], ["تایپ حرفه‌ای", "keyboard"], ["اداری", "case"], ["طراحی", "monitor"]],
  headphone: [["گیمینگ", "headphone"], ["موسیقی", "headphone"], ["تماس و جلسه", "speaker"], ["استودیو", "headphone"], ["استفاده روزمره", "headphone"]],
  case: [["گیمینگ", "case"], ["رندرینگ", "gpu"], ["مهندسی", "cpu"], ["اداری", "case"], ["برنامه‌نویسی", "keyboard"], ["خانگی", "case"]],
  motherboard: [["گیمینگ", "motherboard"], ["اورکلاک", "cpu"], ["ورک‌استیشن", "gpu"], ["اداری", "case"], ["ارتقای سیستم", "motherboard"]],
  hdd: [["آرشیو اطلاعات", "ssd"], ["دوربین و نظارت", "monitor"], ["استفاده خانگی", "case"], ["ذخیره پشتیبان", "ssd"], ["سرور", "motherboard"]],
  battery: [["استفاده روزمره", "laptop"], ["سفر و قابل حمل", "laptop"], ["کار طولانی", "battery"], ["دانشجویی", "laptop"]],
  cooling: [["گیمینگ", "fan"], ["رندرینگ", "cpu"], ["خنک‌کاری لپ‌تاپ", "laptop"], ["سیستم کم‌صدا", "fan"], ["اورکلاک", "motherboard"]],
  desk: [["گیمینگ", "desk"], ["کار و برنامه‌نویسی", "keyboard"], ["اداری", "desk"], ["استودیو", "monitor"], ["فضای کوچک", "desk"]],
  chair: [["گیمینگ", "chair"], ["ارگونومیک", "chair"], ["اداری", "case"], ["نشستن طولانی", "chair"], ["اقتصادی", "chair"]],
  mousepad: [["گیمینگ", "mouse"], ["کنترل", "mouse"], ["سرعت", "mouse"], ["RGB", "mousepad"], ["سایز بزرگ", "desk"]],
  default: [["استفاده روزمره", "case"], ["حرفه‌ای", "cpu"], ["اقتصادی", "mouse"], ["گیمینگ", "gpu"]],
};

const categoryUsageKey = (category) => {
  const id = String(category?.id || "").toLowerCase();
  const name = String(category?.name || "").toLowerCase();
  if (/laptop|لپ|لب/.test(`${id} ${name}`)) return "laptop";
  if (/cpu|پردازنده/.test(`${id} ${name}`)) return "cpu";
  if (/gpu|گرافیک/.test(`${id} ${name}`)) return "gpu";
  if (/ram|رم/.test(`${id} ${name}`)) return "ram";
  if (/ssd/.test(`${id} ${name}`)) return "ssd";
  if (/monitor|مانیتور/.test(`${id} ${name}`)) return "monitor";
  if (/mouse.?pad|موس.?پد|ماوس.?پد/.test(`${id} ${name}`)) return "mousepad";
  if (/mouse|ماوس/.test(`${id} ${name}`)) return "mouse";
  if (/keyboard|کیبورد/.test(`${id} ${name}`)) return "keyboard";
  if (/headphone|هدفون/.test(`${id} ${name}`)) return "headphone";
  if (/motherboard|مادربرد/.test(`${id} ${name}`)) return "motherboard";
  if (/case|کیس/.test(`${id} ${name}`)) return "case";
  if (/hdd|هارد/.test(`${id} ${name}`)) return "hdd";
  if (/battery|باتری/.test(`${id} ${name}`)) return "battery";
  if (/fan|cool|فن|کول/.test(`${id} ${name}`)) return "cooling";
  if (/desk|میز/.test(`${id} ${name}`)) return "desk";
  if (/chair|صندلی/.test(`${id} ${name}`)) return "chair";
  return "default";
};

const defaultUsageProfiles = (category, catalog) =>
  (USAGE_PROFILE_TEMPLATES[categoryUsageKey(category)] || USAGE_PROFILE_TEMPLATES.default)
    .map(([name, icon], index) => ({
      id: `local-${String(catalog).toLowerCase()}-${category?.id || "all"}-${index}`,
      name,
      icon,
      description: `مشاهده محصولات مناسب ${name}`,
      product_ids: [],
      is_active: true,
      _fallbackIndex: index,
    }));

const productMatchesUsage = (product, profile, profiles, availableProducts = []) => {
  if (!profile) return true;
  const ids = (profile.product_ids || []).map(String);
  const availableIds = new Set(availableProducts.map((item) => String(item.apiId)));
  const validIds = ids.filter((id) => availableIds.has(id));
  if (validIds.length) return validIds.includes(String(product.apiId));
  if (!availableProducts.length || !profiles.length) return true;
  const index = Math.max(0, profiles.findIndex((item) => item.id === profile.id));
  const distributed = availableProducts.filter((item, productIndex) => productIndex % profiles.length === index);
  const guaranteed = distributed.length
    ? distributed
    : [availableProducts[index % availableProducts.length]];
  return guaranteed.some((item) => String(item.apiId) === String(product.apiId));
};

const usageFromLocation = () => new URLSearchParams(location.search).get("usage") || "";
const setUsageInLocation = (usage) => {
  const url = new URL(location.href);
  usage ? url.searchParams.set("usage", usage) : url.searchParams.delete("usage");
  history.replaceState(history.state, "", `${url.pathname}${url.search}${url.hash}`);
};

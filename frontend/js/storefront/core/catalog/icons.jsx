const I = {
  home: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9M9 20v-6h6v6" />
    </svg>
  ),
  laptop: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M2 20h20M8 20l1-2h6l1 2" />
    </svg>
  ),
  cpu: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
    </svg>
  ),
  gpu: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="8" cy="12" r="2.4" />
      <circle cx="15" cy="12" r="2.4" />
      <path d="M2 18v3" />
    </svg>
  ),
  ram: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <rect x="2" y="7" width="20" height="9" rx="1" />
      <path d="M6 16v3M10 16v3M14 16v3M18 16v3M6 10v3M10 10v3M14 10v3M18 10v3" />
    </svg>
  ),
  ssd: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="9" r="3" />
      <path d="M8 15h8" />
    </svg>
  ),
  monitor: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  mouse: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <rect x="6" y="3" width="12" height="18" rx="6" />
      <path d="M12 7v4" />
    </svg>
  ),
  keyboard: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
    </svg>
  ),
  headphone: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <path d="M4 14v-2a8 8 0 0116 0v2" />
      <rect x="2" y="14" width="4" height="7" rx="2" />
      <rect x="18" y="14" width="4" height="7" rx="2" />
    </svg>
  ),
  speaker: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <circle cx="12" cy="15" r="3.5" />
      <circle cx="12" cy="6" r="1.2" />
    </svg>
  ),
  case: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M9 6h6M9 9h6" />
      <circle cx="12" cy="16" r="2" />
    </svg>
  ),
  motherboard: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <rect x="7" y="7" width="7" height="7" rx="1.5" />
      <path d="M16 7h2M16 10h2M16 13h2M7 17h3M13 17h5M5 7v3M5 13v4" />
      <circle cx="12" cy="10.5" r="1.5" />
    </svg>
  ),
  power: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="9" cy="12" r="3" />
      <path d="M16 10h3M16 14h3" />
    </svg>
  ),
  hdd: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" />
      <path d="M15.5 8.5l2-2M16 17h2" />
    </svg>
  ),
  battery: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <rect x="3" y="7" width="17" height="10" rx="2" />
      <path d="M20 10h2v4h-2M7 12h3M8.5 10.5v3" />
    </svg>
  ),
  board: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <rect x="7" y="7" width="6" height="6" rx="1" />
      <path d="M15 7h3M15 10h3M7 16h4M14 16h4M5 7v4M5 14v3" />
    </svg>
  ),
  cooling: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 10c-1-3 0-5 2-6 2 2 2 5 0 7M14 12c3-1 5 0 6 2-2 2-5 2-7 0M12 14c1 3 0 5-2 6-2-2-2-5 0-7M10 12c-3 1-5 0-6-2 2-2 5-2 7 0" />
    </svg>
  ),
  desk: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M3 8h18v4H3zM6 12v9M18 12v9M6 17h12" />
      <path d="M8 8V4h8v4" />
    </svg>
  ),
  chair: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <rect x="7" y="3" width="10" height="10" rx="3" />
      <path d="M5 11v5h14v-5M12 16v4M8 21h8M5 14H3M19 14h2" />
    </svg>
  ),
  mousepad: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="M15 8h3a2 2 0 0 1 2 2v4a3 3 0 0 1-6 0v-4a2 2 0 0 1 1-2zM17 8v3" />
    </svg>
  ),
  net: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <rect x="3" y="13" width="18" height="7" rx="2" />
      <path d="M7 13V9a5 5 0 0110 0v4M12 4V2" />
    </svg>
  ),
  search: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
    </svg>
  ),
  cart: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h3l2.5 13h11l2-9H6" />
    </svg>
  ),
  heart: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 21s-8-5-10-11a5 5 0 019-3 5 5 0 019 3c-2 6-8 11-8 11z" />
    </svg>
  ),
  heartO: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <path d="M12 21s-8-5-10-11a5 5 0 019-3 5 5 0 019 3c-2 6-8 11-8 11z" />
    </svg>
  ),
  user: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  ),
  bell: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />
    </svg>
  ),
  sun: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
    </svg>
  ),
  moon: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
    </svg>
  ),
  star: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 2l3 6.5 7 .8-5 4.7 1.3 7L12 17.8 5.4 21l1.3-7-5-4.7 7-.8z" />
    </svg>
  ),
  x: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...p}
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  trash: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
    </svg>
  ),
  plus: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      {...p}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  edit: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <path d="M12 20h9M16.5 3.5a2 2 0 013 3L7 19l-4 1 1-4z" />
    </svg>
  ),
  bot: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <circle cx="9" cy="14" r="1.2" />
      <circle cx="15" cy="14" r="1.2" />
      <path d="M12 4v4M8 4h8" />
    </svg>
  ),
  send: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
    </svg>
  ),
  bag: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <path d="M6 7h12l1 14H5zM9 7a3 3 0 016 0" />
    </svg>
  ),
  shield: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  truck: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <rect x="1" y="6" width="13" height="10" rx="1" />
      <path d="M14 9h4l3 3v4h-7" />
      <circle cx="6" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </svg>
  ),
  gift: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...p}
    >
      <rect x="3" y="8" width="18" height="13" rx="1" />
      <path d="M3 12h18M12 8v13M12 8S9 2 6.5 4.5 12 8 12 8zM12 8s3-6 5.5-3.5S12 8 12 8z" />
    </svg>
  ),
  menu: (p) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...p}
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
};

/* ============================================================
   DATA
   ============================================================ */

// Small set of hand-drawn outline icons for the sidebar nav.
// Plain stroke-based SVGs (no icon library, no emoji) so they read as a
// real product's iconography rather than a generic AI-generated look.

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
};

export function DashboardIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.2" />
      <rect x="13" y="3.5" width="7.5" height="4.5" rx="1.2" />
      <rect x="13" y="10.5" width="7.5" height="10" rx="1.2" />
      <rect x="3.5" y="13.5" width="7.5" height="7" rx="1.2" />
    </svg>
  );
}

export function ProfileIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M4.5 20c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6" />
    </svg>
  );
}

export function SalaryIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M3.5 9.5h1.5M19 9.5h1.5M3.5 14.5h1.5M19 14.5h1.5" />
    </svg>
  );
}

export function GpfIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M5.5 10v9h13v-9" />
      <path d="M10 19v-5h4v5" />
    </svg>
  );
}

export function RequestsIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3.5h9l3 3v14H6z" />
      <path d="M15 3.5v3h3" />
      <path d="M8.5 12.5l2 2 4.5-4.5" />
    </svg>
  );
}

export function CertificateIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M8.7 13.8 7.5 20.5 12 18l4.5 2.5-1.2-6.7" />
    </svg>
  );
}

export function TaxIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <circle cx="9" cy="9" r="1.4" />
      <circle cx="15" cy="15" r="1.4" />
      <path d="M16 8 8 16" />
    </svg>
  );
}

export function PensionIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function GrievanceIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 4v16" />
      <path d="M5 4.5h11l-2.2 3.5L16 11.5H5" />
    </svg>
  );
}

export function CircularsIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 10v4h3l5 4V6l-5 4H4z" />
      <path d="M16 9.5a4 4 0 0 1 0 5M18.5 7a7.5 7.5 0 0 1 0 10" />
    </svg>
  );
}

export function FaqIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.8 9.5a2.2 2.2 0 1 1 3.4 1.8c-.9.6-1.2 1-1.2 2" />
      <circle cx="12" cy="16.3" r="0.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ApproverIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5 5 6v6c0 4.5 3 7.5 7 8.5 4-1 7-4 7-8.5V6z" />
      <path d="M9 12l2 2 4-4.5" />
    </svg>
  );
}

export type NavItem =
  | { label: string; href: string; children?: NavItem[] }
  | { label: string; href: string; modalTarget?: string; children?: NavItem[] };

// Single source of truth for header/footer navigation.
// NOTE: Keep hrefs exactly as your site routes expect.
export const PRIMARY_NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "FAQ", href: "/faq" },
  { label: "Services", href: "/services" },
  { label: "Reviews", href: "/reviews" },
  { label: "Financing", href: "/financing" },
  { label: "Join our team", href: "/join-our-team" },
  // Appointments opens the existing modal system (do not change modal markup)
  { label: "Appointments", href: "#", modalTarget: "appointmentForm" },
];

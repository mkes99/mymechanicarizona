export type NavItem = {
  id: string;
  label: string;
  href?: string;
  modalTarget?: string; // e.g. "#appointmentForm" for modal triggers
  children?: NavItem[];
};

// Single source of truth for primary navigation.
// This lets us render both desktop + mobile wrappers without duplicating link content.
export const PRIMARY_NAV: NavItem[] = [
  {
    id: "nav-menu-item-3775",
    label: "Home",
    href: "/",
  },
  {
    id: "nav-menu-item-3776",
    label: "About Us",
    href: "/about-us",
    children: [
      {
        id: "nav-menu-item-3779",
        label: "FAQ",
        href: "/faq",
      },
    ],
  },
  {
    id: "nav-menu-item-3793",
    label: "Services",
    href: "/services",
  },
  {
    id: "nav-menu-item-3782",
    label: "Reviews",
    href: "/reviews",
  },
  {
    id: "nav-menu-item-3781",
    label: "Join our team",
    href: "/join-our-team",
  },
  {
    id: "nav-menu-item-3780",
    label: "Financing",
    href: "/financing",
  },
  {
    id: "nav-menu-item-3777",
    label: "Contact Us",
    href: "/contacts",
    children: [
      {
        id: "nav-menu-item-3778",
        label: "Customer Information Form",
        href: "/customer-information-form",
      },
    ],
  },
  {
    id: "nav-menu-item-custom",
    label: "Appointments",
    modalTarget: "#appointmentForm",
  },
];

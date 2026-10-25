import { LayoutDashboard, Truck, Users } from "lucide-react";
import { ROLES } from "./roles";

// The ONE list that drives the sidebar. To add a page:
//   1) add a <Route> in App.jsx
//   2) add one line here
// `roles` hides the link from other roles. That's cosmetic only; the server
// still enforces permissions on the API.
export const NAV_ITEMS = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard, end: true },
  { label: "Assets", to: "/assets", icon: Truck },
  // Coming next:
  // { label: "Maintenance", to: "/maintenance", icon: Wrench },
  { label: "Users", to: "/users", icon: Users, roles: [ROLES.ADMIN] },
];

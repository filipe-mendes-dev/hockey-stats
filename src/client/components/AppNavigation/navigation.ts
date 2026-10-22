import { House, Shield, Trophy, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavigationDestination {
  id: "home" | "players" | "teams" | "matches";
  href: string;
  icon: LucideIcon;
}

export const navigationDestinations: readonly NavigationDestination[] = [
  { id: "home", href: "/app", icon: House },
  { id: "matches", href: "/app/matches", icon: Trophy },
  { id: "teams", href: "/app/teams", icon: Shield },
  { id: "players", href: "/app/players", icon: UsersRound },
];

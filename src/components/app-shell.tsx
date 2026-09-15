import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Factory,
  ShieldCheck,
  Truck,
  Receipt,
  BookOpenCheck,
  Users,
  Building2,
  Wrench,
  UserCog,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import omegaLogo from "@/assets/omega-logo.jpg.asset.json";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Visão Geral",
    items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Processo",
    items: [
      { to: "/orcamentos", label: "Orçamentos", icon: FileText },
      { to: "/pcp", label: "PCP", icon: ClipboardList },
      { to: "/producao", label: "Produção", icon: Factory },
      { to: "/qualidade", label: "Qualidade", icon: ShieldCheck },
      { to: "/expedicao", label: "Expedição", icon: Truck },
      { to: "/medicao", label: "Medição", icon: Receipt },
      { to: "/databook", label: "Databook", icon: BookOpenCheck },
    ],
  },
  {
    title: "Cadastros",
    items: [
      { to: "/cadastros/sub-areas", label: "Sub-áreas", icon: Users },
      { to: "/cadastros/contratos", label: "Contratos", icon: Building2 },
      { to: "/cadastros/equipamentos", label: "Equipamentos", icon: Wrench },
      { to: "/cadastros/funcionarios", label: "Funcionários", icon: UserCog },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: profile } = useQuery({
    queryKey: ["me-profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("nome, email")
        .eq("id", u.user.id)
        .maybeSingle();
      return data;
    },
  });

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
            <SidebarContent
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-card flex items-center px-4 gap-3 sticky top-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{profile?.nome ?? "Usuário"}</div>
              <div className="text-xs text-muted-foreground">{profile?.email}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border bg-white">
        <div className="flex items-center gap-3">
          <img
            src={omegaLogo.url}
            alt="Omega Service"
            className="h-10 w-10 object-contain"
          />
          <div>
            <div className="text-sm font-bold leading-tight text-primary tracking-wide">OMEGA SERVICE</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Gestão Industrial
            </div>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-4">
            <div className="px-5 mb-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/50 font-semibold">
              {group.title}
            </div>
            <ul className="space-y-0.5 px-2">
              {group.items.map((item) => {
                const active =
                  pathname === item.to || pathname.startsWith(item.to + "/");
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-sidebar-border text-[11px] text-sidebar-foreground/50">
        ERP Industrial Integrado
      </div>
    </>
  );
}

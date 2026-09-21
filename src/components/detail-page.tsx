import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Cabeçalho padrão das páginas de detalhe dos módulos.
 * Mantém voltar, título, identificação, badges, ações e navegação anterior/próximo.
 */
export function DetailShell({
  modulo,
  title,
  subtitle,
  badges,
  actions,
  onBack,
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
  children,
}: {
  modulo: string;
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  onBack: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  prevLabel?: string;
  nextLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2 text-muted-foreground" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {modulo}
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{title}</h1>
            {badges}
          </div>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <div className="flex items-center gap-1 rounded-md border p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!onPrev} title={prevLabel ?? "Anterior"} onClick={() => onPrev?.()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!onNext} title={nextLabel ?? "Próximo"} onClick={() => onNext?.()}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

/** Campo de leitura usado nos detalhamentos. */
export function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}

/** Estado de carregamento / demanda inexistente nas páginas de detalhe. */
export function DetailEmpty({ modulo, onBack, message }: { modulo: string; onBack: () => void; message: string }) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2 text-muted-foreground" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {modulo}
      </Button>
      <p className="py-16 text-center text-muted-foreground">{message}</p>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function ModulePlaceholder({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardContent className="py-16 flex flex-col items-center text-center gap-3">
          <Construction className="h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Módulo em construção</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Este módulo será implementado na <strong>{phase}</strong>. A fundação (autenticação, papéis por setor, cadastros básicos) já está pronta para suportá-lo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

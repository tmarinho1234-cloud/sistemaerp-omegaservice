import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Factory } from "lucide-react";
import {
  FarolDot,
  ModuleHeader,
  ProgressBar,
  avancoPrevisto,
  calcularFarol,
  dateBr,
  diasRestantes,
  usePedidos,
  useSincronizacaoTempoReal,
  useTodosConjuntos,
} from "@/components/operations";

export const Route = createFileRoute("/_authenticated/producao/")({
  head: () => ({
    meta: [
      { title: "Produção | Omega Service ERP" },
      { name: "description", content: "Demandas em produção com avanço, peso fabricado e farol de prazo." },
      { property: "og:title", content: "Produção | Omega Service ERP" },
      { property: "og:description", content: "Demandas em produção com avanço, peso fabricado e farol de prazo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProducaoListaPage,
});

function ProducaoListaPage() {
  const navigate = useNavigate();
  useSincronizacaoTempoReal();
  const { data: todosPedidos = [] } = usePedidos();
  const { data: todosConjuntos = [] } = useTodosConjuntos();
  const pedidos = useMemo(() => todosPedidos.filter((p) => p.producao_iniciada), [todosPedidos]);

  const linhas = useMemo(
    () =>
      pedidos.map((p) => {
        const cs = todosConjuntos.filter((c) => c.pedido_id === p.id);
        const real = cs.length ? cs.reduce((s, c) => s + Number(c.progresso), 0) / cs.length : 0;
        const restante = diasRestantes(p.data_sla ?? p.prazo_entrega);
        const pesoTotal = cs.reduce((s, c) => s + Number(c.peso_kg ?? 0), 0);
        const pesoFab = cs.reduce((s, c) => s + Number(c.peso_fabricado_kg ?? 0), 0);
        return { pedido: p, real, restante, pesoFab, pesoTotal, farol: calcularFarol({ previsto: avancoPrevisto(cs), real, restante, status: p.pcp_status }) };
      }),
    [pedidos, todosConjuntos],
  );

  return (
    <div className="space-y-6">
      <ModuleHeader title="Produção" description="Atividades por conjunto, quantidades fabricadas, paralisações e atividades não previstas." icon={Factory} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demandas em produção</CardTitle>
          <p className="text-xs text-muted-foreground">Clique em uma demanda para abrir a página de produção dos conjuntos.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>POMG</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Subárea</TableHead>
                  <TableHead>Peso fabricado / total</TableHead>
                  <TableHead>Avanço</TableHead>
                  <TableHead>Prazo / SLA</TableHead>
                  <TableHead>Farol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.length ? (
                  linhas.map(({ pedido: p, real, restante, pesoFab, pesoTotal, farol }) => (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate({ to: "/producao/$pedidoId", params: { pedidoId: p.id } })}>
                      <TableCell className="font-mono text-xs font-semibold">{p.pomg_codigo ?? p.numero}</TableCell>
                      <TableCell className="text-xs">{p.contratos?.nome ?? "—"}</TableCell>
                      <TableCell className="text-xs">{p.sub_areas?.nome ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        <span className="font-medium">{pesoFab.toFixed(0)} kg</span>
                        <span className="text-muted-foreground"> de {pesoTotal.toFixed(0)} kg</span>
                      </TableCell>
                      <TableCell>
                        <ProgressBar value={real} />
                      </TableCell>
                      <TableCell className="text-xs">
                        {dateBr(p.data_sla ?? p.prazo_entrega)}
                        {restante !== null && (
                          <span className={cn("ml-2", restante < 0 ? "text-destructive" : "text-muted-foreground")}>
                            {restante < 0 ? `${Math.abs(restante)}d em atraso` : `${restante}d`}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <FarolDot farol={farol} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      Nenhuma demanda iniciada. Use "Iniciar produção" no PCP para liberar a demanda aqui.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

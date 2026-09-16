import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ListChecks } from "lucide-react";
import {
  FarolDot,
  MetricCard,
  ModuleHeader,
  ProgressBar,
  avancoPrevisto,
  calcularFarol,
  dateBr,
  diasRestantes,
  pcpStatusLabel,
  usePedidos,
  useTodosConjuntos, useSincronizacaoTempoReal } from "@/components/operations";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel de Demandas | Omega Service ERP" },
      { name: "description", content: "Lista de todas as demandas em produção com farol, avanço e situação." },
      { property: "og:title", content: "Painel de Demandas | Omega Service ERP" },
      { property: "og:description", content: "Lista de todas as demandas em produção com farol, avanço e situação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PainelPage,
});

function PainelPage() {
  useSincronizacaoTempoReal();
  const navigate = useNavigate();
  const { data: pedidos = [] } = usePedidos();
  const { data: conjuntos = [] } = useTodosConjuntos();

  const linhas = useMemo(
    () =>
      pedidos.map((p) => {
        const cs = conjuntos.filter((c) => c.pedido_id === p.id);
        const previsto = avancoPrevisto(cs);
        const real = cs.length ? cs.reduce((s, c) => s + Number(c.progresso), 0) / cs.length : 0;
        const restante = diasRestantes(p.data_sla ?? p.prazo_entrega);
        const fabricadas = cs.reduce((s, c) => s + Number(c.quantidade_fabricada ?? 0), 0);
        const totalQtd = cs.reduce((s, c) => s + Number(c.quantidade ?? 0), 0);
        return { pedido: p, previsto, real, restante, conjuntos: cs, fabricadas, totalQtd, farol: calcularFarol({ previsto, real, restante, status: p.pcp_status }) };
      }),
    [pedidos, conjuntos],
  );

  const criticos = linhas.filter((l) => l.farol === "vermelho").length;
  const emProducao = linhas.filter((l) => l.pedido.pcp_status === "em_fabricacao").length;

  return (
    <div className="space-y-6">
      <ModuleHeader title="Painel de Demandas" description="Todas as demandas em produção: avanço, farol e situação em tempo real." icon={ListChecks} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Demandas" value={linhas.length} />
        <MetricCard label="Em fabricação" value={emProducao} />
        <MetricCard label="Entregues" value={linhas.filter((l) => l.pedido.pcp_status === "entregue").length} tone="success" />
        <MetricCard label="Críticas" value={criticos} tone={criticos ? "danger" : "default"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demandas em produção</CardTitle>
          <p className="text-xs text-muted-foreground">Clique em uma demanda para abrir o detalhamento no PCP.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>POMG</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Subárea</TableHead>
                  <TableHead>Conjuntos</TableHead>
                  <TableHead>Fabricado</TableHead>
                  <TableHead>Avanço</TableHead>
                  <TableHead>Prazo / SLA</TableHead>
                  <TableHead>Restante</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Farol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.length ? (
                  linhas.map(({ pedido: p, real, restante, conjuntos: cs, fabricadas, totalQtd, farol }) => (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate({ to: "/pcp" })}>
                      <TableCell className="font-mono text-xs font-semibold">{p.pomg_codigo ?? p.numero}</TableCell>
                      <TableCell className="text-xs">{p.contratos?.nome ?? "—"}</TableCell>
                      <TableCell className="text-xs">{p.sub_areas?.nome ?? "—"}</TableCell>
                      <TableCell className="text-xs">{cs.length}</TableCell>
                      <TableCell className="text-xs">
                        {fabricadas} de {totalQtd}
                      </TableCell>
                      <TableCell>
                        <ProgressBar value={real} />
                      </TableCell>
                      <TableCell className="text-xs">{dateBr(p.data_sla ?? p.prazo_entrega)}</TableCell>
                      <TableCell className="text-xs">{restante === null ? "—" : restante < 0 ? `${Math.abs(restante)} dias em atraso` : `${restante} dias`}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{pcpStatusLabel(p.pcp_status)}</Badge>
                      </TableCell>
                      <TableCell>
                        <FarolDot farol={farol} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                      Nenhuma demanda em produção.
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

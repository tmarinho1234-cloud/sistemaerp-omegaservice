import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FarolDot, avancoPrevisto, calcularFarol, dateBr, diasRestantes, pcpStatusLabel, prazoVigente, type ConjuntoResumo, type PedidoResumo } from "@/components/operations";

/**
 * Lista padrão de demandas usada nos módulos que abrem página de detalhe.
 * Cada linha navega para a demanda (o módulo informa o destino em onSelect).
 */
export function DemandaLista({
  titulo,
  pedidos,
  conjuntos,
  onSelect,
  vazio,
}: {
  titulo: string;
  pedidos: PedidoResumo[];
  conjuntos: ConjuntoResumo[];
  onSelect: (pedido: PedidoResumo) => void;
  vazio: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
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
                <TableHead>Peso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Farol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.length ? (
                pedidos.map((p) => {
                  const doPedido = conjuntos.filter((c) => c.pedido_id === p.id);
                  const peso = doPedido.reduce((s, c) => s + Number(c.peso_kg ?? 0), 0);
                  const real = doPedido.length ? doPedido.reduce((s, c) => s + Number(c.progresso ?? 0), 0) / doPedido.length : 0;
                  const prazo = prazoVigente(p);
                  const restantes = diasRestantes(prazo);
                  const farol = calcularFarol(avancoPrevisto(p), real, restantes);
                  return (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => onSelect(p)}>
                      <TableCell className="font-mono font-medium">{p.pomg_codigo ?? p.numero}</TableCell>
                      <TableCell className="text-xs">{p.contratos?.nome ?? "—"}</TableCell>
                      <TableCell className="text-xs">{p.sub_areas?.nome ?? "—"}</TableCell>
                      <TableCell>{doPedido.length}</TableCell>
                      <TableCell className="text-xs">{peso ? `${peso.toFixed(0)} kg` : "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{pcpStatusLabel(p.pcp_status)}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {dateBr(prazo)}
                        {restantes !== null && (
                          <span className="ml-1 text-muted-foreground">({restantes < 0 ? `${Math.abs(restantes)}d atraso` : `${restantes}d`})</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <FarolDot farol={farol} />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    {vazio}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

import ParceiroDetalhePage from "./ParceiroDetalhePage";

/**
 * Rota /loja/:id — usa o mesmo componente de detalhe do parceiro.
 * Mantém compatibilidade com links antigos sem redirecionamento.
 */
export default function LojaDetalhePage() {
  return <ParceiroDetalhePage />;
}

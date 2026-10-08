<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Derive pending quality quantities from closed nonconformities instead of mutating inspection history, so audits remain intact.
- QQP lines live in `contrato_linhas_preco` (unique contrato_id+codigo); budget items copy item_qqp/classificacao and keep `contrato_linha_id`, and measurements bill per budget item via `medicao_itens` (saldo enforced by trigger) — so each QQP line is traceable from contract to billing.

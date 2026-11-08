# Comparação com as seis auditorias anteriores

Consulta: **08/11/2026**, America/Sao_Paulo. Código comparado: [`5aa14c1`](https://github.com/dinastia-velarian/academia/blob/5aa14c13e83100e8943343ee7ecbce50457dbf6b/). Relatórios anteriores: [`757865d`](https://github.com/dinastia-velarian/academia/blob/757865d9e358a5071aa1ff7e7d4d54503bb4c4db/docs/auditorias/).

**Coleta bloqueada e não concluída: zero páginas oficiais lidas nesta execução.** Não há regras atuais oficialmente confirmadas nesta base. Links de investigação e afirmações do repositório não são documentação oficial.

## Proveniência

Os seis documentos estão no commit `757865d9e358a5071aa1ff7e7d4d54503bb4c4db` da branch `audit/wiki-diplomacia-academia`. **Eles não estão integrados ao `main` `5aa14c13e83100e8943343ee7ecbce50457dbf6b`** nesta consulta. Por isso, os links abaixo são fixados no commit anterior; não foram copiados nem modificados para aparentar que já fazem parte do main.

| Relatório consultado | Resultado da comparação atual |
|---|---|
| [inventario-wiki-diplomacia.md](https://github.com/dinastia-velarian/academia/blob/757865d9e358a5071aa1ff7e7d4d54503bb4c4db/docs/auditorias/inventario-wiki-diplomacia.md) | Mantém-se a impossibilidade de enumerar a wiki. A tentativa atual usa exatamente /wiki/Main_Page. As sete referências continuam apenas históricas. |
| [auditoria-mecanicas-militares.md](https://github.com/dinastia-velarian/academia/blob/757865d9e358a5071aa1ff7e7d4d54503bb4c4db/docs/auditorias/auditoria-mecanicas-militares.md) | Nenhuma regra militar foi confirmada. Custos de tropas, bônus de Defesa, autoridade de guerra, fronts e buffers continuam pendentes. |
| [comparativo-wiki-academia.md](https://github.com/dinastia-velarian/academia/blob/757865d9e358a5071aa1ff7e7d4d54503bb4c4db/docs/auditorias/comparativo-wiki-academia.md) | As lacunas e 60 registros são achados do corpus estático da revisão anterior; não comprovam todo o conteúdo publicado. Sem a wiki, não classificar aulas como desatualizadas por regra oficial. |
| [auditoria-calculadoras.md](https://github.com/dinastia-velarian/academia/blob/757865d9e358a5071aa1ff7e7d4d54503bb4c4db/docs/auditorias/auditoria-calculadoras.md) | A descrição do limite implementado de habilidades 201 ficou desatualizada em relação ao main atual: agora é 999. Essa mudança de código não valida a regra do jogo. As oito ferramentas continuam sem nova confirmação primária. |
| [proposta-formacao-militar.md](https://github.com/dinastia-velarian/academia/blob/757865d9e358a5071aa1ff7e7d4d54503bb4c4db/docs/auditorias/proposta-formacao-militar.md) | As 58 aulas em oito blocos continuam proposta editorial, sem confirmação de existência/limites de buffers ou simultaneidade; não são material oficial coletado. |
| [resumo-executivo.md](https://github.com/dinastia-velarian/academia/blob/757865d9e358a5071aa1ff7e7d4d54503bb4c4db/docs/auditorias/resumo-executivo.md) | A limitação de acesso continua válida. Nenhuma mudança recente da wiki pode ser confirmada. O resumo deve futuramente incorporar as fontes recebidas e a atualização local do limite de habilidades. |

## O que pode ser concluído

- **Regras oficiais confirmadas nesta execução:** nenhuma, por ausência de conteúdo primário recebido.
- **Informação local desatualizada:** a referência ao limite de habilidades 201 no relatório antigo já não descreve o código do main. O commit [5aa14c1](https://github.com/dinastia-velarian/academia/blob/5aa14c13e83100e8943343ee7ecbce50457dbf6b/public/calculator-engine.js) usa `range(d.current,d.target,999)`; [a interface](https://github.com/dinastia-velarian/academia/blob/5aa14c13e83100e8943343ee7ecbce50457dbf6b/public/calculators.js) também permite 999. Isso é fato de implementação, não afirmação sobre o teto oficial.
- **Divergência interna Premium:** a comparação histórica entre texto −25% e fator 0,65 continua uma questão a resolver com fonte primária. Não escolher qual valor corresponde ao jogo sem documentação.
- **Possíveis divergências nas calculadoras:** custos de tropas, regeneração, curva de XP, limites e composição de bônus continuam pistas históricas ou dúvidas; nenhum novo erro relativo à wiki foi demonstrado.
- **Lacunas nas aulas:** os relatórios anteriores apontam procedimentos militares insuficientes, blocos fora do catálogo canônico padrão e termos sem equivalência validada. Isso descreve o corpus local da auditoria, não a cobertura completa do site ou da wiki.
- **Mecânicas ainda não documentadas nesta base:** todas, inclusive as conhecidas por nomes no pedido. Sem página recebida, não há ficha técnica oficial preenchida.

## Próxima validação

Após cada página recebida: atualizar a [matriz](matriz-regras.md) com fonte e revisão, comparar regra por regra com os relatórios, localizar aulas e função matemática afetadas e classificar como confirmado, parcialmente sustentado, incompatível ou ainda pendente. Divergência exige comparar condições equivalentes; limite de formulário não deve ser tomado como limite oficial. Registrar impacto e recomendação sem editar aulas ou fórmulas nesta entrega.

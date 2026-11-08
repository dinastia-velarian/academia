# Resumo executivo — auditoria Wiki e Academia Velarian

Data da pesquisa: **07/11/2026**, America/Sao_Paulo. Base do repositório: [`6b7f0bd4b2190fd96076299569a94e5f22d2cca8`](https://github.com/dinastia-velarian/academia/blob/6b7f0bd4b2190fd96076299569a94e5f22d2cca8/).

**Estado: auditoria oficial bloqueada por acesso de rede; análise local e planejamento preliminar. Não representa revisão integral da wiki nem homologação das mecânicas atuais.**

Legenda: **R** = fato verificado no repositório; **H** = registro histórico em documento local, sem revalidação primária; **I** = inferência/risco a investigar; **E** = proposta editorial ou estratégia de jogadores; **P** = confirmação oficial pendente. Nenhuma afirmação H, I ou E é promovida a regra oficial nesta auditoria.

## Resultado e limites

A auditoria integral da wiki **não foi concluída**. O proxy retornou `CONNECT tunnel failed, response 403` para a wiki e o site da Academia, antes do acesso ao conteúdo. Não foi possível enumerar categorias, ler páginas oficiais, identificar mudanças recentes ou conferir as aulas efetivamente publicadas pelo banco. Isso é uma limitação de rede, não evidência de indisponibilidade ou erro dos sites.

Foi concluída a análise do material acessível no repositório: **60 registros estáticos de aulas**, **44 pertencentes ao catálogo canônico padrão**, **oito calculadoras expostas** e seus motores. Os conteúdos dinâmicos podem complementar ou substituir essa base. **Zero páginas oficiais de conteúdo foram consultadas nesta execução**; sete referências históricas foram inventariadas como pistas, sem revalidação.

## Descobertas e prioridades

| Prioridade editorial | Evidência | Impacto e recomendação |
|---|---|---|
| P1 | **R:** aula sobre Premium informa redução de tempo de 25%; o motor de habilidades aplica fator 0,65, equivalente a 35% em cenário isolado. | Divergência interna confirmada. Verificar o percentual oficial antes de decidir qual texto ou fórmula corrigir. Nenhum foi alterado. |
| P1 | **R/P:** aulas chamam o bônus de 20% de Defesa de mecânica oficial; há afirmações sobre declaração de guerra em Relações Exteriores. | Exigir fontes atuais e distinguir autorização política, declaração e abertura de front. Não afirmar que os percentuais ou atribuições estão errados sem consulta oficial. |
| P1 | **R:** explicação de blocos está no tópico 6, fora dos IDs do catálogo canônico padrão. | Lacuna de cobertura do catálogo estático; confirmar publicação dinâmica e distinguir bloco formal de coalizão ou RP. |
| P1 | **R/P:** não há procedimentos substanciais no corpus estático para fronts, independências, revoltas e buffers. | Priorizar pesquisa e formação militar; não preencher lacunas com suposições. |
| P2 | **R:** Economia prevê seis posições, mas o JSON contém cinco aulas desse tópico; Mercado possui registros no tópico 3. | Mapear o sexto conteúdo e as sobreposições do banco antes de reorganizar. Não prova ausência na produção. |
| P2 | **R:** calculadoras de trabalho usam modelos discreto e contínuo; a ferramenta chamada lucro calcula remuneração do trabalhador. | Explicar alcance, frações de tempo e exclusão de despesas do proprietário. Diferenças de modelo não são automaticamente defeitos. |
| P2 | **H/P:** auditoria anterior registra possíveis diferenças em custos de unidades, HP e limites. | Reabrir referências originais com revisões e idioma; não promover registro histórico a regra atual. |
| P2 | **R/P:** vocabulário NTE/TRM e HP/EP/comprimidos não possui equivalência oficial validada nesta etapa. | Elaborar glossário referenciado antes de atualizar textos e cálculos. |

P1/P2 nesta tabela indicam ordem de investigação e revisão editorial, não novas vulnerabilidades técnicas nem autorização de alterações. Não foi confirmada nenhuma mudança recente da wiki.

## Calculadoras

As oito ferramentas foram classificadas como **dependentes de confirmação oficial**. Existem coerência aritmética local e pistas históricas, mas não fontes primárias atuais suficientes para homologação. A comparação detalha fórmulas, limites do simulador, possíveis divergências históricas e cenários reproduzíveis. Não foram alteradas fórmulas nem adicionados valores como se fossem oficiais.

## Formação recomendada

Um único tópico **Guerras e Estratégia Militar**, com **58 aulas propostas** em oito blocos internos: fundamentos; formação e preparação; blocos e alianças; autorizações e fronts; combate; território e mecânicas especiais; economia de guerra; estratégias e integração. A seção final agrega estratégia, estudos de caso e avaliação. Cada aula especifica objetivo, conteúdo, dificuldade, situação das referências e pontos pendentes. A contagem deve acompanhar a pesquisa, sem limite artificial.

Buffers, múltiplos buffers e fronts simultâneos são objetos de investigação e cenários condicionais. Não se afirma aqui que constituam recursos oficiais. A proposta separa regras, RP, inferências e estratégias, preservando o progresso e os IDs em uma eventual implantação futura.

## Documentos entregues

- [Inventário da wiki e fontes](inventario-wiki-diplomacia.md): acesso bloqueado, pistas históricas e protocolo para levantamento integral.
- [Auditoria das mecânicas militares](auditoria-mecanicas-militares.md): evidências locais, matriz de dúvidas e limites de interpretação.
- [Comparativo Wiki–Academia](comparativo-wiki-academia.md): análise individual dos 60 registros, cobertura e divergências internas.
- [Auditoria das calculadoras](auditoria-calculadoras.md): oito ferramentas, fórmulas, classificações e cenários.
- [Proposta de formação militar](proposta-formacao-militar.md): 58 unidades, sem alteração do currículo publicado.
- Este resumo executivo.

## Validação e próximos passos

A validação desta entrega consiste em conferir cobertura dos registros, inventário das ferramentas, estrutura dos seis documentos, links internos e escopo do diff. Foram executados cálculos puros para comparar Premium e trabalho discreto/contínuo; não houve chamada de escrita a APIs, consulta ao banco, alteração de conteúdos ou execução de operações do jogo. Não se apresenta aprovação de testes de aplicação nesta etapa documental.

O rascunho de configuração do ambiente recebeu adição dos domínios da wiki e do site, preservando os domínios já cadastrados. O rascunho não muda a política de rede em execução: sua aplicação nas configurações do ambiente é uma dependência externa para retomar a pesquisa. Isso se refere ao ambiente de trabalho, sem deploy da Academia. O acesso à API do GitHub também estava bloqueado; publicação de PR depende desse acesso, enquanto o transporte Git deve ser verificado separadamente.

Após liberação: inventariar e ler integralmente as páginas, registrar revisões e idiomas, preencher as perguntas pendentes, confirmar o catálogo realmente publicado por leitura autorizada e revisar cada classificação. Só então propor alterações de conteúdos ou fórmulas em trabalho separado, sujeito à autorização. Esta entrega contém exclusivamente relatórios, sem merge, deploy ou mudanças nos dados.

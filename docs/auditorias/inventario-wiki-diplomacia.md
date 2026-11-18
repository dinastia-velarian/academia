# Inventário da Wiki Oficial do Diplomacia

Data da pesquisa: **07/11/2026**, America/Sao_Paulo. Base do repositório: [`6b7f0bd4b2190fd96076299569a94e5f22d2cca8`](https://github.com/dinastia-velarian/academia/blob/6b7f0bd4b2190fd96076299569a94e5f22d2cca8/).

**Estado: auditoria oficial bloqueada por acesso de rede; análise local e planejamento preliminar. Não representa revisão integral da wiki nem homologação das mecânicas atuais.**

Legenda: **R** = fato verificado no repositório; **H** = registro histórico em documento local, sem revalidação primária; **I** = inferência/risco a investigar; **E** = proposta editorial ou estratégia de jogadores; **P** = confirmação oficial pendente. Nenhuma afirmação H, I ou E é promovida a regra oficial nesta auditoria.

## Cobertura real da pesquisa

| Medida | Resultado |
| --- | --- |
| Páginas da wiki com conteúdo recebido e integralmente lido nesta execução | **0** |
| Categorias atuais enumeradas | **Não foi possível determinar** |
| Total atual de páginas internas | **Não foi possível determinar** |
| Revisões/datas de atualização confirmadas | **Nenhuma** |
| Referências históricas localizadas no repositório | **7**, não reconsultadas |
| Aulas estáticas locais lidas integralmente | **60** |

A atualização recente da wiki é informação fornecida no pedido; autoria, data e extensão das alterações não puderam ser verificadas. Não há base para afirmar que as categorias ou URLs históricas continuam organizadas da mesma maneira.

## Registro verificável das tentativas

| Destino | Operação | Resultado observado | Consequência |
| --- | --- | --- | --- |
| https://wiki.diplomacia.com.tr/ | GET via `curl -L --max-time 20`, com proxy e TLS herdados | `CONNECT tunnel failed, response 403`; resposta do proxy `server: envoy` | Nenhum HTML da wiki obtido; não foi possível extrair categorias, links ou texto |
| https://academia.velarian.workers.dev/ | HEAD via `curl -I --max-time 15` | Mesmo erro CONNECT/403 do proxy | Versão publicada e catálogo em produção não confirmados |
| https://api.github.com/graphql | Consulta de PRs via `gh pr list` | `Forbidden` | Criação/consulta de PR pela API indisponível |
| Repositório GitHub, HTTPS nativo | Leitura Git e fetch de `main` | Sucesso; base `6b7f0bd4b2190fd96076299569a94e5f22d2cca8` | Auditoria local possível |

A tentativa inicial da wiki dentro do sandbox falhou ao conectar ao proxy. A repetição com execução aprovada fora do sandbox isolou o impedimento: **negação de destino no proxy**, não uma resposta de autorização do MediaWiki ou prova de que o site esteja fora do ar. O cabeçalho da tentativa principal registrou `Sun, 08 Nov 2026 01:39:33 GMT`, equivalente a **07/11/2026 22:39:33** em São Paulo. Não se tentou contornar essa restrição.

Não foram alegadas consultas a sitemap, API, páginas especiais, histórico ou links internos. O bloqueio ocorre antes de recebê-los. O formato `index.php?title=...` abaixo deriva de documentos locais, não de uma identificação atual da plataforma da wiki.

## URLs históricas a verificar após liberar o acesso

**Não são páginas consultadas nesta execução.** R6 declara que foram consultadas em 28/10/2026; esse registro histórico também não prova que suas conclusões ainda sejam válidas. Os IDs de revisão são preservados para rastreabilidade; as páginas correntes precisam ser localizadas e comparadas posteriormente.

| ID | Rótulo no registro local | URL original registrada | Revisão histórica | Finalidade da reconsulta |
| --- | --- | --- | --- | --- |
| H1 | Perfil | [Perfil](https://wiki.diplomacia.com.tr/index.php?title=Profil_Bilgileri&oldid=361) | `361` | Custos, tempos de habilidade, redutores e diamantes |
| H2 | Nível | [Nível](https://wiki.diplomacia.com.tr/index.php?title=Seviye&oldid=134) | `134` | Curva de XP e transições de nível |
| H3 | Unidades e armas | [Unidades e armas](https://wiki.diplomacia.com.tr/index.php?title=Unidades_%26_Armas&oldid=86) | `86` | Tipos, custos unitários e multiplicadores militares |
| H4 | Trabalho em português | [Trabalho em português](https://wiki.diplomacia.com.tr/index.php?title=Sistema_de_Trabalho&oldid=80) | `80` | HP, experiência, intervalos e regeneração |
| H5 | Trabalho em turco | [Trabalho em turco](https://wiki.diplomacia.com.tr/index.php?title=%C3%87al%C4%B1%C5%9Fma_Sistemi&oldid=363) | `363` | Confrontar tradução e critérios da versão portuguesa |
| H6 | Tipos de fábrica | [Tipos de fábrica](https://wiki.diplomacia.com.tr/index.php?title=Tipos_de_F%C3%A1brica&oldid=82) | `82` | Produção, bônus e recursos |
| H7 | Criação de fábrica | [Criação de fábrica](https://wiki.diplomacia.com.tr/index.php?title=Criar_F%C3%A1brica&oldid=81) | `81` | Requisitos e limites de evolução |

Não foram inventadas URLs para blocos, guerras, independências, revoltas, buffers ou fronts simultâneos. Esses assuntos são alvos de pesquisa, não páginas cuja existência foi confirmada.

## Protocolo para concluir o inventário

1. Aplicar no ambiente as liberações de `wiki.diplomacia.com.tr`, `academia.velarian.workers.dev` e `api.github.com` e refazer as operações com novas conexões. As inclusões foram salvas apenas no rascunho, preservando os domínios customizados anteriores; não foram aplicadas automaticamente.
2. Receber a página inicial e identificar o mecanismo de navegação real: categorias, idiomas, páginas especiais e eventual índice/API públicos.
3. Enumerar os URLs reais; normalizar duplicatas, registrar redirecionamentos e distinguir páginas de conteúdo, categorias, traduções e histórico. Não presumir que um único caminho do menu enumera toda a wiki.
4. Ler integralmente cada página acessível e manter, para cada uma: URL de origem e final, título, categoria, idioma, revisão/data quando expostas, status HTTP, data/hora de consulta, seções lidas, regras extraídas e dúvidas. Registrar páginas bloqueadas em vez de omiti-las.
5. Para cada regra, conservar trecho e seção que sustentam a interpretação, unidades, condições e exceções. Distinguir comentário estratégico de norma do sistema. Comparar traduções e revisões antes de declarar mudança.
6. Só classificar uma informação como **nova/alterada** mediante comparação entre revisões verificadas. Sem revisão anterior verificável, registrar apenas a informação presente na versão consultada.
7. Para a Academia, usar requisições GET de leitura (`/api/curriculum`, `/api/lessons`, `/api/topics`, `/api/public`) após confirmar seu comportamento. Evitar abrir o site com scripts de telemetria, enviar `/api/visit`, fazer login ou consultar rotas que atualizem atividade, respeitando a proibição de alterar o banco.
8. Atualizar estes seis relatórios e somente então declarar a cobertura oficial concluída, informando numeradores, denominadores e exclusões.

## Fontes locais efetivamente lidas

- **R1 — Base completa de aulas:** [public/approved-lessons.json](https://github.com/dinastia-velarian/academia/blob/6b7f0bd4b2190fd96076299569a94e5f22d2cca8/public/approved-lessons.json). Foram lidos título e corpo dos 60 registros.
- **R2 — Organização e interface pública:** [public/script.js](https://github.com/dinastia-velarian/academia/blob/6b7f0bd4b2190fd96076299569a94e5f22d2cca8/public/script.js).
- **R3 — Catálogo canônico e sobreposições dinâmicas:** [worker.js](https://github.com/dinastia-velarian/academia/blob/6b7f0bd4b2190fd96076299569a94e5f22d2cca8/worker.js#L54), especialmente `publishedCurriculum`, `/api/lessons`, `/api/topic-order` e `/api/public`.
- **R4 — Motor matemático atual:** [public/calculator-engine.js](https://github.com/dinastia-velarian/academia/blob/6b7f0bd4b2190fd96076299569a94e5f22d2cca8/public/calculator-engine.js).
- **R5 — Oito ferramentas expostas, fórmulas e notas de uso:** [public/calculators.js](https://github.com/dinastia-velarian/academia/blob/6b7f0bd4b2190fd96076299569a94e5f22d2cca8/public/calculators.js).
- **R6 — Auditoria histórica das calculadoras:** [docs/audit-calculators/homologacao.md](https://github.com/dinastia-velarian/academia/blob/6b7f0bd4b2190fd96076299569a94e5f22d2cca8/docs/audit-calculators/homologacao.md#L77). Fonte secundária para H1–H7, não substitui consulta da wiki.
- **R7 — Documentação anterior das ferramentas:** [docs/calculadoras-velarian.md](https://github.com/dinastia-velarian/academia/blob/6b7f0bd4b2190fd96076299569a94e5f22d2cca8/docs/calculadoras-velarian.md). Sua lista de ferramentas não deve substituir o inventário do código atual.

A navegação pública e os conteúdos adicionais/sobrescritos no D1 não foram inspecionados. Não houve login, acesso ao banco nem execução de scripts de telemetria do site.

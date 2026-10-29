# Auditoria matemática, técnica e funcional — 11 Calculadoras Velarian

Data: 28/10/2026 (São Paulo). Base efetivamente auditada: `056fa64b39c1e34bd8326e122ca8792f6992dcbb`.
Entrega: branch `audit/calculadoras-20261028`, para revisão. **Sem publicação em produção ou liberação pública.**

## Parecer

A homologação técnica do código corrigido foi aprovada nos cenários executados. **A homologação das regras do jogo continua parcial:** três modelos contábeis aprovados sob as premissas explicitadas; oito ferramentas permanecem em validação. Aprovação de um teste não certifica automaticamente uma mecânica do Diplomacia.

A versão anterior reprovou **45 cenários** desta nova matriz. Isso não representa 45 defeitos independentes: validação numérica compartilhada e redutores incorretos afetam várias ferramentas. Após as correções, **358 casos nomeados passaram**, sem reprovações. Um desses casos contém **22.350 comparações exatas de intervalos de fábrica**, contabilizadas separadamente como subverificações. Também passaram as **40 verificações anteriores** (com atualização documentada do resultado de XP corrigido) e **9 regressões** de currículo, administração e certificado.

## Tabela de homologação

Contagens abaixo são da nova matriz automatizada, não incluem testes de interface nem as 49 regressões anteriores. “Reprovados antes” descreve a versão de base; o resultado final refere-se somente à branch corrigida.

| Ferramenta | Categoria | Testes | Reprovados antes | Aprovados finais | Reprovados finais | Fórmulas verificadas | Pendências | Correções | Status final |
|---|---|---:|---:|---:|---:|---|---|---|---|
| Evolução de habilidades | Evolução da conta | 43 | 8 | 43 | 0 | Custo e tempo-base corroborados parcialmente; redutores comparados no DipTools. | Premium, engenharia, educação, tarifa em degraus e mínimo do tempo em diamantes no jogo. | Composição dos redutores; tempo-base sem arredondamento intermediário; tipos inválidos. | **Em validação** |
| Nível e experiência | Evolução da conta | 35 | 6 | 35 | 0 | Recorrência e pisos verificados matematicamente; curva inicial documentada. | Multiplicadores após 80/90 e arredondamento efetivo do jogo; tabela da wiki é inconsistente. | Aritmética racional exata; XP parcial inteiro; aviso de divergência da referência. | **Em validação** |
| Custo de desenvolvimento da conta | Evolução da conta | 22 | 5 | 22 | 0 | Soma dos mesmos custos individuais, sem segunda tarifa. | Redutores, estado inicial real e eventuais bônus gratuitos. | Herda os redutores corrigidos; finalidade agregada e tempos sequenciais explícitos. | **Em validação** |
| Evolução de fábricas | Indústria | 26 | 2 | 26 | 0 | Modelo exponencial do DipTools testado em 22.350 intervalos exatos. | Curva atual do jogo, truncamento versus XP necessário inteiro e ampliação da faixa. | Validação de tipos; fórmula preservada por falta de erro numérico nesta faixa. | **Em validação** |
| Bonificações e turnos de fábrica | Indústria | 23 | 4 | 23 | 0 | Aritmética de bônus proporcional, salários e turnos. | 100 EP/XP por trabalho e política de bônus proporcional do acordo real. | Ignora campos inativos; alternância de pagamento e reset coerentes. | **Em validação** |
| Rendimento do trabalhador | Trabalho e economia | 67 | 5 | 67 | 0 | Folha, imposto informado e reposição do modelo; orçamento não excedido. | Saúde 10/10+, cinco HP por diamante, vinte diamantes por trabalho e limites reais. | Valida tipo de remuneração; ignora divisor sem bônus; campos condicionais. | **Em validação** |
| Construções e manutenção | Governo e militar | 23 | 3 | 23 | 0 | Soma dos custos e 3% no modelo DipTools. | Tabela vigente do jogo, manutenção de 3% e arredondamentos reais. | Validação de tipos; custos preservados como modelo de referência. | **Em validação** |
| Quartel e exército | Governo e militar | 27 | 3 | 27 | 0 | Força-base e composição de custos; exemplo coincide com DipTools. | Custos unitários conflitam com wiki; desconto e arredondamento do jogo. | Rótulo força-base; aviso do conflito; validação de tipos. | **Em validação** |
| Impostos | Trabalho e economia | 32 | 3 | 32 | 0 | Modelo aditivo sobre a mesma base; conservação bruto = impostos + líquido. | Aplicação efetiva do jogo e bônus pessoais não incluídos. | Tipos inválidos rejeitados; rótulo de modelo contábil. | **Aprovada** |
| Lucro de fábrica | Trabalho e economia | 31 | 3 | 31 | 0 | Receita, custos, margem e preço de equilíbrio sob taxa informada. | Não presume produtividade, tributos ou bônus do jogo. | Tipos inválidos rejeitados; zero denominador e prejuízo mantidos. | **Aprovada** |
| Planejamento de recursos | Comércio e recursos | 29 | 3 | 29 | 0 | Déficit não negativo × preço fornecido. | Cotação fornecida pelo usuário; não consulta mercado automaticamente. | Tipos inválidos rejeitados; exibição de resultados positivos muito pequenos. | **Aprovada** |

“Aprovada” para impostos, lucro e recursos significa correção aritmética do modelo informado, não confirmação de todas as regras tributárias ou produtivas do jogo. Nenhuma ferramenta foi removida.

## Fórmulas auditadas

Convenções: `n` é o nível de origem de uma melhoria; `a` e `b` são nível atual e alvo. Somatórios usam `a ≤ n < b`.

1. **Habilidades:** moedas `Σ250n`; diamantes `Σarredondar(7,5 × teto(n/10))`. Tempo-base de moedas em segundos `T(n)=máximo(60,1080(n/50)^2,5)`. Fator observado na referência `C × E × P − G`, com C=0,9 para Acadêmico ou 1 para outras classes; E=1−0,02×educação até10 e 0,7 no índice11; P=0,65 com Premium ou 1 sem; G=engenharia/100. Tempo final `teto(ΣT(n)×fator)`; rota de diamantes `teto(tempo bruto/4)`. Não arredondar T(n) antes de aplicar os redutores.
2. **XP:** até origem80, `piso(250 × (217/200)^(n−1))`; origens81–90, `piso(anterior ×13/10)`; acima90, `piso(anterior ×14/10)`. Implementação racional com BigInt, convertendo a saída para Number apenas dentro da faixa de inteiros seguros. Restante = soma − XP parcial inteiro; dias = restante/ganho diário, ou indisponível se ganho zero. A curva acima80 é hipótese do modelo de referência, ainda pendente no jogo.
3. **Conta:** soma das quatro simulações individuais; mesmas tarifas e redutores, sem duplicação de fórmulas. Tempos sequenciais; valor dos diamantes = quantidade × cotação informada. Não somar dinheiro e diamantes como gastos obrigatórios simultâneos e não chamar isso de preço de venda.
4. **Fábrica:** XP bruto `Σ base×(53/50)^(n−1)`, truncado após a soma; base500 em diamantes e150 nos outros quatro tipos. Diamantes `Σ(10+5n)`. Valores acumulados partem do nível1. O truncamento reproduz a referência; a regra efetiva continua pendente.
5. **Bônus/turnos:** pagamento proporcional = XP requerido/faixa de XP × valor do bônus. Trabalhos = teto(XP/100); turnos = teto(trabalhos/trabalhadores); horas = turnos/6. No modo fixo, folha = trabalhos × salário, sem cobrar vagas ociosas do último turno.
6. **Trabalho:** seis trabalhos/hora; cem EP/trabalho no modelo. Regeneração = piso(trabalhos×5/3)×HP/ciclo. Gasto = teto(máximo(0,EP−regeneração)/5). Fábrica de diamantes rende20 por trabalho no modelo. Bônus proporcional ao EP; líquido = (salário + bônus)×(1−taxa). Produção é informada manualmente, nunca inferida. Orçamento de diamantes é ajustado para caber após arredondamentos.
7. **Construções:** custo = Σ(alvo−atual)×tabela unitária; manutenção diária = 0,03×custo de instalação de todos os níveis alvo. Projeção = manutenção diária×dias. A tabela está em `calculator-engine.js` e no relatório anterior; coincide com os exemplos medidos do DipTools, mas carece de confirmação atual no jogo.
8. **Exército:** força-base = Σquantidade×força unitária (1–5); custo = Σquantidade×custo unitário×(1−Suprimentos×0,0005). Cotação total = moedas + Σrecurso×preço. Não calcula multiplicadores de combate. A tabela de custos é mantida como modelo DipTools, com conflito explícito com a wiki.
9. **Impostos:** cada parcela = bruto×alíquota/100; líquido = bruto−parcelas. União + província ≤100%. Modelo aditivo, sem redutor pessoal de impostos.
10. **Lucro:** receita = unidades×preço; custo = unidades×insumo + salários + outros + receita×taxa. Margem = lucro/receita; preço de equilíbrio = custos sem imposto/[unidades×(1−taxa)]. Divisores nulos não geram Infinity; prejuízo legítimo permanece negativo.
11. **Recursos:** faltante = máximo(0,necessário−estoque); orçamento = faltante×preço informado.

## Comparação controlada com o DipTools

Navegação realizada nos oito formulários equivalentes. As três calculadoras contábeis adicionais não têm equivalente direto na lista de oito: foram auditadas por identidades aritméticas independentes. Os exemplos não cobrem todas as combinações possíveis de parâmetros.

| Parâmetros e medida | DipTools observado | Velarian anterior | Branch corrigida | Interpretação |
|---|---:|---:|---:|---|
| Habilidade100→101, Acadêmico e Premium, índices0; segundos | 3.575 | 3.361 | 3.575 | Corrigida composição multiplicativa |
| Mesmo nível, Acadêmico, educação11, engenharia20, sem Premium; segundos | 2.628 | 2.444 | 2.628 | Engenharia é subtraída depois dos demais fatores no modelo observado |
| Mesmo cenário com Premium; segundos | 1.280 | 306 | 1.280 | Corrigida interação de redutores |
| Fábrica de diamantes10→11; XP | 844 | 844 | 844 | Paridade de exemplo; regra do jogo pendente |
| Bônus de5M/1.000XP, demanda500XP; moedas | 2.500.000 | 2.500.000 | 2.500.000 | Paridade proporcional; cinco trabalhos, um turno com dez trabalhadores |
| Trabalho1h, saúde7, salário50mil; diamantes gastos | 106 | 106 | 106 | Também observados6 trabalhos,70HP, saldo+14 e300mil moedas |
| Escola0→2; manutenção diária em moedas | 6.000 | 6.000 | 6.000 | Implantação200mil; ouro880, couro800 eNTE600 |
| Dez infantarias, Suprimentos100; moedas | 47.500 | 47.500 | 47.500 | Ouro475, couro950, força-base10; wiki conflita |
| Jogador100→101; XP | 62.747.892 | 62.747.892 | 62.747.897 | Divergência deliberada: piso racional correto do modelo, não prova do XP efetivamente cobrado no jogo |
| Conta: Ciência51→52 e demais1→2; moedas/diamantes | 13.500 /69 | 13.500 /69 | 13.500 /69 | Mesmos níveis explícitos; nenhum bônus inicial presumido |

O DipTools rejeitou o cenário de conta com todas as habilidades iniciais1 alegando um bônus inicial mínimo51 em uma das habilidades. Para comparar números válidos, foi usado Ciência51→52. A Velarian permite níveis explícitos: não impõe esse bônus sem confirmar o estado inicial do jogo.

Arquivos reprodutíveis: [comparisons.json](comparisons.json), [results.json](results.json) e `tests/calculators-audit.mjs`. O JSON de comparações registra entradas, campo medido, referência e resultados antes/depois.

### Erro de piso decimal

Em JavaScript, a recorrência antiga produz `11666995 ×1.4 =16333792.999999998`; aplicar floor resulta16.333.792, embora o produto racional correto resulte16.333.793 após o piso. A diferença se propaga: +5XP na transição100→101 e diferença maior nas simulações até150. BigInt com numerador/denominador inteiros elimina esse artefato. O teste antigo que fixava62.747.892 foi atualizado para62.747.897 com essa justificativa; não foi apenas adaptado para tornar o teste verde.

### Tempo arredondado cedo

A tabela antiga guardava segundos já arredondados. Aplicar descontos a esses valores introduzia segundos excedentes: Acadêmico150→151 mostrava15.153s em vez de15.152s no modelo temporal exato. A fórmula temporal pública coincide com os tempos-base observados e permite arredondar somente o resultado final. O mínimo de tempo em diamantes e o Premium permanecem pendentes de confirmação no jogo.

## Confronto com informações públicas do Diplomacia

Fontes consultadas em28/10/2026. A wiki é ligada ao domínio do jogo, mas contém páginas e exemplos contraditórios; documentação pública não substitui evidência da versão em execução.

- [Perfil — revisão361](https://wiki.diplomacia.com.tr/index.php?title=Profil_Bilgileri&oldid=361): documenta250×nível e o tempo18×(nível/50)^2,5 minutos, com mínimo de um minuto. Entretanto, o custo em diamantes é descrito de maneira diferente dos degraus do DipTools, e o mínimo da rota de diamantes não coincide com o observado. Não foram adotadas essas diferenças como correções sem confirmação.
- [Nível — revisão134](https://wiki.diplomacia.com.tr/index.php?title=Seviye&oldid=134): documenta250×1,085^(n−1), mas a própria tabela de exemplos não bate com a fórmula (por exemplo, no nível50). Não descreve consistentemente a mudança80/90. Assim, a curva completa segue em validação.
- [Unidades — revisão86](https://wiki.diplomacia.com.tr/index.php?title=Unidades_%26_Armas&oldid=86): descreve infantaria com100ouro e tanque por50mil moedas, enquanto o DipTools usa50ouro e10mil, respectivamente. Também menciona multiplicadores de combate ausentes no simulador de custo. Preservada a tabela de referência e alterado o rótulo para força-base. Não há prova suficiente para escolher qual tabela é atual.
- [Trabalho em português — revisão80](https://wiki.diplomacia.com.tr/index.php?title=Sistema_de_Trabalho&oldid=80) e [em turco — revisão363](https://wiki.diplomacia.com.tr/index.php?title=Çalışma_Sistemi&oldid=363): ambas corroboram100HP por trabalho, mas mostram expressões diferentes para XP. Limitam a descrição de regeneração a5HP no índice7+, enquanto o DipTools inclui6 e7HP para índices superiores. Faltam dados atuais para resolver o conflito.
- [Tipos de fábrica — revisão82](https://wiki.diplomacia.com.tr/index.php?title=Tipos_de_Fábrica&oldid=82): produção depende de nível, Ciência, região e impostos; isso sustenta evitar produtividade automática inventada. [Criação — revisão81](https://wiki.diplomacia.com.tr/index.php?title=Criar_Fábrica&oldid=81) menciona nível200; a ferramenta mantém seu limite conservador150 em vez de ampliar sem validação.

Não foi acessada conta do Diplomacia nem realizada compra, trabalho, melhoria, transferência ou ação de jogo para validar regras. Pendências a confirmar com telas atuais: valores/tempos de melhoria com os redutores discriminados; custo unitário de tropas; XP necessário nos níveis95/96 e100; valores de regeneração, reposição e produção do trabalho. Essas evidências são necessárias para uma homologação de mecânicas, não para usar os modelos contábeis.

## Auditoria funcional e segurança

- Cinco categorias exatamente como solicitadas: Evolução da conta; Indústria; Trabalho e economia; Governo e militar; Comércio e recursos.
- Todas as onze ferramentas mantidas. Evolução individual responde sobre uma habilidade; conta agrega quatro planos. Mesmo motor evita divergência e repetição de tarifas. Não houve remoção nem fusão de funcionalidades.
- Busca passou a ignorar acentos; categoria/busca agora selecionam um formulário compatível ou mostram estado vazio, evitando manter uma ferramenta fora do filtro.
- Campos de salário, bônus e produção só são exigidos no modo aplicável. O reset restaura a seleção e recalcula a visibilidade após a ação padrão do navegador.
- Resultados positivos menores que a precisão visual de duas casas não aparecem como zero exato; é exibido um intervalo. Unidades de tempo, moeda, EP e recurso continuam explicitadas.
- 11 formulários testados em computador e novamente em largura390; largura768 também inspecionada. Não houve transbordamento horizontal: larguras úteis375 e753px. São contêineres de navegador, não aparelhos físicos ou prova de acessibilidade completa.
- Verificados campo vazio, restauração, categoria sem resultado, busca sem acento, campos condicionais, reset de modo de pagamento e isolamento entre duas páginas. Alterar o bruto na primeira deixou a segunda com1M.
- Cada função ganhou verificação de determinismo e intercalamento: mesma entrada devolve o mesmo resultado após outro cálculo e o objeto fornecido não é alterado. Cálculos não escrevem em cookies, banco, localStorage nem contas reais.
- Renderização usa textContent; entradas numéricas rejeitam texto de ataque. Campos HTML têm limites e o motor também os valida. Inteiros, tipos e enums inválidos são rejeitados; valores não finitos e resultados acima do limite seguro geram erro.
- Os40 testes anteriores incluem visitante, token falso, aluno, administrador e administrador expirado, além de scripts, estilos, caminhos codificados, MIME, cache privado e arquivo interno bloqueado. Banco SQLite em memória, sem dados reais.
- Worker e configuração de rotas não foram alterados nesta correção; seus hashes locais correspondem aos arquivos obtidos da main auditada. `run_worker_first:true` e verificação de sessão administrativa permanecem. Acesso administrativo à central em produção foi observado.
- **Limite da verificação externa:** uma requisição HTTP independente sem sessão recebeu403/erro1010 da proteção Cloudflare. Isso não prova o403 da aplicação. Não foram feitas tentativas de contorno. A negação a aluno/visitante foi comprovada em ambiente isolado, mas não nesta sessão de produção com duas contas QA. A homologação desses perfis em produção continua pendente, sem modificar usuários reais.

## Resultado e publicação

358/358 casos novos, 40/40 verificações anteriores e9/9 regressões aprovados. Há zero reprovações automatizadas finais e pendências explícitas de regras e de teste externo de perfis. Não se declara100% de cobertura, equivalência integral ao DipTools ou homologação pública concluída.

Correções e relatório serão registrados no GitHub na branch de revisão indicada. **A main e a produção não serão alteradas nesta etapa.** O commit final e o PR constam da entrega; os arquivos de resultados preservam a base e os detalhes dos cenários. A liberação pública requer autorização posterior e resolução das pendências aplicáveis.

![Interface da branch auditada, ainda não publicada](interface.jpg)

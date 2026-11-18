# Auditoria das calculadoras da Academia Velarian

Data da pesquisa: **07/11/2026**, America/Sao_Paulo. Base do repositório: [`6b7f0bd4b2190fd96076299569a94e5f22d2cca8`](https://github.com/dinastia-velarian/academia/blob/6b7f0bd4b2190fd96076299569a94e5f22d2cca8/).

**Estado: auditoria oficial bloqueada por acesso de rede; análise local e planejamento preliminar. Não representa revisão integral da wiki nem homologação das mecânicas atuais.**

Legenda: **R** = fato verificado no repositório; **H** = registro histórico em documento local, sem revalidação primária; **I** = inferência/risco a investigar; **E** = proposta editorial ou estratégia de jogadores; **P** = confirmação oficial pendente. Nenhuma afirmação H, I ou E é promovida a regra oficial nesta auditoria.

## Critério de classificação

- **Validada pela documentação oficial:** a documentação primária atual sustenta os parâmetros, condições e arredondamentos implementados.
- **Parcialmente validada:** existem trechos atuais consultados que sustentam parte identificada do modelo, com lacunas expressas.
- **Dependente de confirmação:** faltam fontes primárias atuais acessíveis ou evidência suficiente para decidir.
- **Com possível divergência:** há evidência comparável que aponta incompatibilidade, sem resolver qual regra é vigente.

**Classificação primária das oito ferramentas: dependente de confirmação.** Foram recebidas zero páginas da wiki. Não atribuir “parcialmente validada” apenas por existir um link histórico. Há riscos secundários de divergência histórica e inconsistências internas comprováveis abaixo.

Fonte do inventário: [R5 — ferramentas expostas](https://github.com/dinastia-velarian/academia/blob/6b7f0bd4b2190fd96076299569a94e5f22d2cca8/public/calculators.js); fonte das fórmulas: [R4 — motor](https://github.com/dinastia-velarian/academia/blob/6b7f0bd4b2190fd96076299569a94e5f22d2cca8/public/calculator-engine.js). Os testes existentes não foram reexecutados nesta etapa documental; seus arquivos foram examinados. Aprovação histórica em testes ou paridade com DipTools não equivalem a validação oficial.

## Inventário e classificação individual

| Ferramenta pública | Função efetivamente chamada | Classificação atual | Modelo observado e pontos que faltam validar |
| --- | --- | --- | --- |
| Evolução de habilidades | `skills` | Dependente de confirmação | Moedas `Σ250n`; diamantes `Σround(ceil(n/10)×7,5)`; tempo-base `max(60,1080(n/50)^2,5)` segundos. Fator: classe × educação × Premium − engenharia. Validar tarifas, limiares, mínimos, ordem dos descontos e alcance de engenharia; H1 é somente pista histórica |
| Nível e experiência | `xp` | Dependente de confirmação | Até 80: `floor(250×1,085^(n−1))`; depois multiplicadores recursivos 1,3 e 1,4, com pisos. Validar transições 80/90, curva completa, tabela, precisão e limite do jogo; H2 |
| Custo de desenvolvimento da conta | `account` | Dependente de confirmação | Agrega quatro chamadas de `skills`; a parte de soma é matemática, mas herda todas as hipóteses de tarifas e descontos. Tempos sequenciais e cotação informada não equivalem a regra de simultaneidade ou preço de venda de conta |
| Evolução de fábricas | `factory` | Dependente de confirmação | XP-base 500/150, crescimento 1,06, diamantes `10+5n`; soma e truncamento. Validar abertura, limites, arredondamento e diferenças entre tipos; H6/H7 |
| Rendimento do trabalhador | `work` | Dependente de confirmação | Seis trabalhos/hora, 100 EP por trabalho, reposição por cinco, 20 diamantes por trabalho no tipo correspondente; trabalhos inteiros. Validar HP versus EP/comprimidos, intervalos, regeneração por índice, produção, bônus e imposto; H4/H5/H6 |
| Construções e manutenção | `construction` | Dependente de confirmação | Vetores de custo fixos; modo progressivo +10% a cada 25 unidades; modo manual com multiplicador. Manutenção estimada em 3% do custo-base dos níveis alvo/dia. Validar progressão por edifício, unidade temporal, base da manutenção e impostos/bônus; nenhuma página oficial de construção consultada |
| Quartel e exército | `army` | Dependente de confirmação; risco histórico de divergência | Tabela de cinco unidades, força-base 1–5 e desconto `0,0005S`. Sem dano final. Há registro local H3 de valores diferentes; confirmar tabela vigente, nomenclatura e limites antes de alterar |
| Lucro de fábrica | **`factoryEarnings`**, não `profit` | Dependente de confirmação | Projeção contínua da remuneração do trabalhador; salário/recursos cotados/bonificação. Não modela lucro completo do proprietário, impostos, custos fixos ou ação executável fracionária. Validar premissas de trabalho e revisar futuramente o nome/escopo da ferramenta |

Os IDs da interface são `skills`, `xp`, `account`, `factory`, `work`, `construction`, `army`, `profit`; no último, `engine:'factoryEarnings'` é explícito. Também permanecem no motor `bonus`, `tax`, `profit` e `resources`, sem formulário próprio entre esses oito. `num` é um auxiliar. Não apresentar o inventário antigo de onze calculadoras de R7 como inventário atual.

## Divergências internas verificadas

### 1. Premium: texto −25% e motor −35%

R: a aula [`t1-l4`](https://github.com/dinastia-velarian/academia/blob/6b7f0bd4b2190fd96076299569a94e5f22d2cca8/public/approved-lessons.json#L78) afirma redução de 25% no tempo. `skills()` aplica fator Premium **0,65**, isoladamente equivalente a redução de **35%**. A nota da própria interface reconhece essa diferença e diz que o modelo ainda está em validação.

Verificação puramente matemática nesta execução, sem alterar arquivos ou banco:

- Entrada: Quartel, Burocracia, nível 1 → 2, educação 0, engenharia 0.
- Sem Premium: 250 moedas, 8 diamantes, **60 s** na rota monetária.
- Com Premium: mesmas tarifas, **39 s**, tempo em diamantes arredondado para 10 s.
- Se o único redutor fosse 25%, os 60 s dariam **45 s**, não 39 s.

A diferença é confirmada **entre texto e código**. A wiki bloqueada impede escolher qual interpretação é oficial. Não foi alterada nenhuma aula ou fórmula.

### 2. Modelos discreto e contínuo não são intercambiáveis

Com 0,25 h, regeneração de 7 HP/ciclo, salário 50.000, fábrica de diamantes, sem bônus/imposto/conversão:

| Saída | `work` | `factoryEarnings` |
| --- | ---: | ---: |
| Trabalhos | 1 | 1,5 equivalentes |
| Duração efetiva | 1/6 h | 0,25 h |
| EP | 100 | 150 |
| Regeneração | 7 | 17,5 |
| Diamantes gastos | 19 | 26,5 |
| Diamantes ganhos | 20 | 30 |
| Saldo de diamantes | 1 | 3,5 |
| Moedas | 50.000 | 75.000 |

R: os resultados foram reproduzidos executando apenas as funções puras em memória. I: comparar ambos como previsão de ações efetivas pode induzir erro. A diferença não prova bug: as notas distinguem trabalhos inteiros de projeção contínua. A validação oficial exige modelo temporal, estoque inicial, capacidade, regeneração e arredondamentos documentados.

### 3. Vocabulário: HP, EP, comprimidos e recurso NTE/TRM

A aula `t2-l1` usa “100 comprimidos” por trabalho e distingue HP; a interface usa “EP/HP total consumido”, e o motor nomeia `ep` e `regen` em bases que são somadas/subtraídas. Isso exige um glossário de unidades antes de homologar a fórmula; não se pode assumir sinonímia.

R1 usa **TRM** em custos militares/recursos; R4/R5 usam **NTE** (`nte`). Não foi verificado se são tradução, nome antigo ou recursos diferentes. Criar correspondência somente após fonte primária; não renomear dados nesta etapa.

### 4. Documentação e limites do simulador

R7/R6 descrevem onze ferramentas e cinco categorias em trechos históricos; o código atual expõe oito ferramentas/quatro categorias. A aula de Premium e as notas dos modelos precisam ser conciliadas após verificar a wiki. Os limites 150 para XP/fábricas, 201 para habilidades, 999 para Suprimentos e 1000 para construções são **limites de implementação**, não prova de limites oficiais.

## Pistas históricas de divergência, sem revalidação

R6 atribui às revisões H1–H7 diferenças em diamantes/tempos mínimos, XP, custos militares, regeneração e limite de fábricas. Em particular, relata infantaria com 100 de ouro e tanque por 50.000 moedas em H3; o motor usa 50 e 10.000. Classificar como **risco histórico de possível divergência**, não como nova confirmação da wiki atual.

O registro histórico também diz ter corrigido XP usando aritmética racional, mas o motor atual usa `Math.floor` sobre ponto flutuante e um comentário preserva o comportamento observado no nível 96. Isso é uma diferença de versões locais a rastrear, não autorização para escolher outra fórmula. Nenhuma validação oficial atual foi obtida.

## Plano de validação antes de futura implementação

1. Reabrir cada fonte atual e registrar página, seção, revisão e unidades para cada constante da tabela.
2. Construir matriz de cenários: sem bônus e com cada bônus isolado; combinações; limites 10/11, 25/26, 50/51, 75, 80/81, 90/91 e 100; cada tipo de tropa/fábrica; estoque/HP inicial e carências.
3. Separar testes de aritmética, testes de paridade com referência de terceiros e testes que comprovem regras oficiais. Uma categoria não substitui as outras.
4. Em discrepâncias, conservar as duas evidências e pedir esclarecimento. Dados capturados do jogo precisam de data/contexto; não fazer compras, ataques ou gastos em contas reais para testar sem autorização específica.
5. Somente em uma etapa autorizada posterior: decidir alterações, adicionar casos independentes e atualizar notas e aulas em conjunto.

As oito ferramentas permanecem inalteradas. Para os requisitos militares, ver [auditoria-mecanicas-militares.md](auditoria-mecanicas-militares.md).

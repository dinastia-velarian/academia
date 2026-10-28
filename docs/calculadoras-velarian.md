# Calculadoras Velarian — relatório técnico

Data: 28/10/2026. Repositório: `dinastia-velarian/academia`.
Base preservada: `2c83a0b6308f3a734c92a33e1ea98f8033d5f4d3`.

## Resultado da implementação

Central integrada à área de ferramentas existente, com 11 calculadoras, categorias, busca, interface preta e dourada, explicações, validação de campos e restauração dos valores iniciais. O motor matemático é independente da autenticação e não grava dados, preparando a futura utilização pública sem cadastro. Nesta entrega, página, scripts e estilos continuam restritos a administradores pelo Worker. O menu administrativo recebeu um acesso à central; não foi criado um segundo catálogo público.

Não foram copiados código, imagens ou layouts do DipTools. A implementação usa operações matemáticas próprias e valores observados nos formulários públicos. Paridade com o DipTools não equivale a confirmação oficial das regras do Diplomacia.

## Inventário da referência e cobertura

| DipTools | Campos e resultados observados | Implementação Velarian |
|---|---|---|
| [Habilidades](https://diptools.blogspot.com/p/stat.html) | Habilidade, classe, níveis, educação 0–11, engenharia 0–20%, Premium; moedas, diamantes e tempos alternativos | Evolução de habilidades; quatro habilidades, três classes, índices e Premium, custos e tempos aproximados |
| [Construções](https://diptools.blogspot.com/p/building.html) | Níveis atuais/alvo de escola, base militar, estrada e hospital; cinco recursos; manutenção de 3% | Construções e manutenção; acrescenta projeção por quantidade de dias |
| [Fábricas](https://diptools.blogspot.com/p/factory.html) | Cinco tipos, níveis atual/alvo; XP e diamantes da melhoria e acumulados | Evolução de fábricas |
| [Fábrica com bônus](https://diptools.blogspot.com/p/factory-bonus.html) | Bônus proporcional por XP ou salário fixo; trabalhadores simultâneos; turnos e duração | Bonificações e turnos; distingue remuneração de benefício Premium |
| [Rendimento](https://diptools.blogspot.com/p/earn.html) | Índice de saúde; horas, EP ou orçamento de diamantes; salários/produção; bônus; ganhos e gastos | Rendimento do trabalhador; três bases de planejamento, cinco faixas de saúde, salário ou produção × cotação, bônus e imposto opcional |
| [Nível e XP](https://diptools.blogspot.com/p/level.html) | Nível atual/alvo, XP requerido e ritmo diário | Nível e experiência; acrescenta XP parcial dentro do nível atual |
| [Valor da conta](https://diptools.blogspot.com/p/cost.html) | Quatro habilidades; custo atual ou evolução; tempos e conversão do custo em diamantes | Custo de desenvolvimento da conta; níveis iniciais e finais explícitos, cotação informada; evita apresentar custo de habilidades como preço de venda |
| [Quartel/exército](https://diptools.blogspot.com/p/kisla.html) | Suprimentos, cinco unidades, força, moedas e recursos; avaliação por cotações | Quartel e exército; cotações manuais e desconto de Suprimentos |

Preservadas e incorporadas: **Impostos**, **Lucro de fábrica** e **Planejamento de recursos**. Lucro recebeu margem e preço de equilíbrio; não duplica o simulador do trabalhador, pois representa o resultado do proprietário.

O site de referência também oferece editores visuais, sorteios e jogos. Eles não são calculadoras de mecânicas e ficaram fora deste escopo. Não foi reproduzido o sistema próprio de diamantes/recompensas do DipTools.

## Fórmulas e exemplos

### Habilidades

Para cada melhoria saindo do nível `n`:

- Moedas: `250 × n`.
- Diamantes: `arredondar(7,5 × teto(n/10))`, somado por melhoria.
- Tempo: tabela de 200 tempos exibidos na referência, níveis de origem 1–200. Não foi inventada uma curva para níveis maiores.
- Reduções observadas: Acadêmico 10%; educação 2% por índice até 10, ou 30% no índice 11; engenharia pelo percentual selecionado; Premium aproximadamente 35%. O motor combina essas reduções no modelo observado. Não foi homologada toda a combinação cartesiana de parâmetros.
- O tempo em diamantes usa aproximadamente 1/4 do tempo em moedas. Arredondamentos dos tempos exibidos podem acumular alguns segundos de diferença.

Exemplos observados: 1→2, Burocracia, índices zero e sem Premium: 250 moedas, 8 diamantes, 60 s ou 15 s. Em Acadêmico: 54 s ou 14 s. 1→3: 750 moedas e 16 diamantes. 100→101 sem reduções: 25.000 moedas, 75 diamantes, 6.110 s. Com Premium: aproximadamente 3.972 s.

**Limitação relevante:** o rótulo do DipTools menciona 25% para Premium, enquanto o comportamento medido neste contexto corresponde aproximadamente a 35%. A interface Velarian identifica expressamente esse comportamento da referência. Confirmar no jogo antes da liberação pública. Classe Rebelde não recebeu modificador inventado.

### XP de jogador

- Até o nível de origem 80: `piso(250 × 1,085^(n−1))` por avanço.
- Origens 81–90: `piso(XP do avanço anterior × 1,3)`.
- Origens acima de 90: `piso(XP do avanço anterior × 1,4)`.
- Somar os avanços, descontar o XP parcial informado e dividir pelo ganho diário para obter dias. Ganho diário zero não produz divisão por zero.

Exemplos: 1→3 = **521 XP**; 1→75 = **1.228.202 XP**; 80→81 = **157.358 XP**; 81→82 = **204.565 XP**; 100→101 = **62.747.892 XP**.

Faixa conservadora implementada: níveis 1–150. A referência mostrou comportamento inconsistente de validação em níveis acima da faixa informada; a Velarian rejeita a extrapolação.

### Fábricas e folha de pagamento

XP por melhoria: `base × 1,06^(n−1)`. Somar antes de truncar o resultado inteiro. Base 500 para diamantes e 150 para os outros quatro tipos. Diamantes por melhoria: `10 + 5 × n`.

Exemplos: diamantes 1→3 = **1.030 XP e 35 diamantes**. Diamantes 10→11 = **844 XP e 60 diamantes**, com **6.590 XP e 375 diamantes** acumulados desde o nível 1. Na mesma melhoria, os tipos de recursos exibiram **253 XP**, com **1.977 XP** acumulados.

Pagamento proporcional: `XP necessário / XP por bônus × valor do bônus`. Trabalhos: `teto(XP/100)`; turnos: `teto(trabalhos/trabalhadores)`, de 10 minutos. Salário fixo remunera os trabalhos necessários, inclusive o trabalho final parcial em XP, sem presumir pagamento por vagas ociosas do último turno.

Exemplo: 500 XP, bônus de 5M a cada 1.000 XP, dez trabalhadores: **2,5M**, cinco trabalhos, um turno de dez minutos.

### Trabalho e energia

Modelo da referência: seis trabalhos/hora, 100 EP por trabalho, regeneração de 3–7 HP a cada seis minutos, cinco HP repostos por diamante, ganho de vinte diamantes por trabalho em fábrica de diamantes.

Regeneração = `piso(horas × 10) × HP por ciclo`. Gasto = `teto(máximo(0, EP − regeneração)/5)`. Orçamento em diamantes é ajustado para nunca ultrapassar o valor disponível. Bônus proporcional ao EP; imposto opcional sobre salário mais bônus. No modo produção, valor bruto = trabalhos × produção informada por trabalho × cotação informada.

Exemplos com regeneração de 7 HP e salário de 50 mil: uma hora = **6 trabalhos, 600 EP, 70 HP regenerados, 106 diamantes gastos, 120 ganhos e 300 mil moedas**. Em 24 horas = **144 trabalhos, 2.544 diamantes gastos, saldo +336 e 7,2M de moedas**.

Não inclui HP inicial, capacidade de armazenamento, pausas ou produtividade automática desconhecida. A quantidade de produto por trabalho é explicitamente informada pelo usuário. Não foram incluídas conversões em dinheiro real.

### Construções

Custos observados por nível:

| Construção | Moedas | Couro | Ouro | NTE | Petróleo |
|---|---:|---:|---:|---:|---:|
| Escola | 100.000 | 400 | 440 | 300 | 0 |
| Base militar | 120.000 | 300 | 0 | 400 | 400 |
| Estrada | 100.000 | 500 | 0 | 400 | 400 |
| Hospital | 110.000 | 0 | 440 | 500 | 300 |

Melhoria = diferença de níveis × custo unitário. Manutenção diária = 3% do custo dos níveis alvo totais; inclui o patrimônio já existente. Exemplo escola 0→2: 200 mil moedas, 800 couro, 880 ouro e 600 NTE; manutenção de 6 mil moedas/dia, além das parcelas dos recursos.

### Exército

| Unidade | Força | Moedas | Couro | Ouro | NTE | Petróleo |
|---|---:|---:|---:|---:|---:|---:|
| Infantaria | 1 | 5.000 | 100 | 50 | 0 | 0 |
| Tanque | 2 | 10.000 | 0 | 0 | 150 | 100 |
| Navio | 3 | 20.000 | 0 | 100 | 100 | 0 |
| Avião | 4 | 40.000 | 200 | 0 | 0 | 100 |
| Míssil | 5 | 80.000 | 0 | 0 | 300 | 500 |

Custos multiplicados por `1 − nível de Suprimentos × 0,0005`. Faixa implementada 0–200. Dez infantarias com Suprimentos 100: força 10, **47.500 moedas, 950 couro e 475 ouro**. Cotação manual converte os recursos em moedas, sem consulta automática ao mercado. Quantidades fracionárias de custo são mantidas no resultado, sem presumir o arredondamento efetivo do jogo.

### Ferramentas existentes

- Impostos: modelo aditivo, União e província sobre a mesma base. Bruto 1M, União 5%, província 8% = 130 mil de imposto e 870 mil líquidos.
- Lucro: receita menos insumos, salários, outros custos e imposto sobre receita. Cem unidades a 100, insumos 40 e salários 1.000 = lucro 5.000, margem 50%, preço de equilíbrio 50.
- Recursos: máximo entre zero e necessário menos estoque, multiplicado pelo preço. Necessidade 1.000, estoque 250, preço 80 = faltante 750 e custo 60.000.

## Testes e segurança

**40 verificações automatizadas novas aprovadas**, em `tests/calculators.mjs`:

- Exemplos de referência, limites de tarifas, curva XP com transições 80/90, cinco tipos de fábrica, bônus e salários.
- Construções, manutenção de níveis existentes, cinco unidades militares e cotações.
- Trabalho por horas/EP/diamantes e remuneração por produção; 1.505 combinações de orçamento e saúde verificam que o gasto não ultrapassa o orçamento.
- Valores zero, campos vazios, espaços, negativos, NaN, infinito, texto de ataque, frações em campos inteiros, faixas inválidas e estouro do limite de precisão.
- Resultados sem divisão por zero e preservação de prejuízos legítimos.
- Visitante, token falso, aluno, administrador e administrador expirado: acesso a página, JS, CSS e variantes de URL codificadas.
- Sem acesso ao serviço de arquivos antes da autorização; respostas privadas sem cache e com MIME correto; arquivo interno indisponível diretamente.
- Aliases `/ferramentas`, `/ferramentas/` e `/ferramentas.html` resolvem todos os scripts e estilos para caminhos protegidos absolutos.

**9 regressões anteriores aprovadas**, em `tests/homologacao-final.mjs`: catálogo canônico, contagens, elegibilidade e denominador de certificados, rotas administrativas e geração do PDF imperial. Não foi repetida desnecessariamente a antiga suíte completa de 35 testes.

**Verificações no navegador:** onze formulários com valores iniciais; mensagem de erro em campo vazio; restauração e novo cálculo; busca sem resultados; cálculo por produção; layouts em contêineres de 390 e 768 pixels, sem transbordamento horizontal (larguras úteis de 375 e 753 pixels, descontada a barra de rolagem). Isso é QA responsivo de navegador, não teste em aparelho físico. Prévia estática isolada; autenticação e Worker foram testados separadamente com SQLite em memória. Não foram utilizados cadastros reais.

Inspeção de sintaxe de JS/Worker e `git diff --check` aprovados. Não há gravações, integrações de mercado ou modificações em credenciais/permissões reais nos novos cálculos.

## Correções aplicadas

1. Removida a duplicidade de implementações antigas; suas funções integram o motor único.
2. Proteção do Worker também para scripts e estilos novos. Configuração `run_worker_first: true` impede o serviço de estáticos de contornar a autenticação. Isso passa as requisições de arquivos pelo Worker, sem executar consulta de sessão nas rotas públicas comuns.
3. Página interna servida como `ferramentas.asset`, bloqueada no acesso direto e entregue com MIME HTML após autenticação, evitando redirecionamentos do serviço de páginas estáticas.
4. Referências absolutas de arquivos, para funcionar também no alias com barra final.
5. Validação de precisão, faixas, campos vazios, total de impostos, divisores e sequências de níveis.
6. Correção do botão de restauração: valores padrão são registrados com `defaultValue` e repostos corretamente.
7. Separação entre custo contábil de desenvolver habilidades e alegação de preço de venda de uma conta.
8. Orçamento de diamantes não excedido após arredondamentos da regeneração.

## Homologação e liberação

Aprovado em ambiente isolado: motor, cenários automatizados, interface desktop e layouts estreitos. Código e documentação são entregues na branch `feature/calculadoras-velarian`, por pull request. A versão `main` e a produção não foram alteradas nesta entrega. O SHA final deve ser consultado no histórico do repositório e na resposta de entrega, pois o próprio relatório integra o commit.

A liberação para alunos/visitantes **não está autorizada e não foi habilitada**. A interface permanece marcada como em desenvolvimento. A aprovação local não comprova o SHA ativo no Cloudflare nem a operação autenticada desta nova central em produção.

Pendências para liberação pública, em ordem:

1. Revisar e integrar o pull request com autorização para atualizar a `main`. Depois, confirmar a implantação do commit e o acesso administrativo da nova central no Cloudflare; repetir o bloqueio para visitante/aluno na implantação efetiva.
2. Confirmar com regras atuais do jogo a divergência de Premium, combinações de redutores, arredondamentos de custos militares e o modelo de energia. Expandir a faixa somente com evidências.
3. Avaliar com a administração os níveis iniciais reais usados no custo de reprodução da conta e os valores-padrão de produção, sem inventar automação de produtividade.
4. Com autorização expressa do responsável, liberar somente a central de cálculos e seus recursos públicos, preservando a proteção das trilhas e demais funções administrativas. O motor não exige conta nem banco e pode ser reutilizado nessa vista pública.

## Evidência visual

![Central em QA](calculadoras-velarian-qa.jpg)

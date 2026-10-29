# Continuação da homologação — PR #2

Data: 28/10/2026. Revisão de partida: `e8f515772823e4fc78f4617ba1b80ff0c55c3540`. PR #2 aberto, em rascunho e sem conflitos na conferência. Base da main: `056fa64b39c1e34bd8326e122ca8792f6992dcbb`.

Escopo desta continuação: revisão de regressões, matriz de evidências do jogo e preparação de produção. **Os 407 testes já aprovados não foram repetidos.** Foram executadas somente 12 verificações novas de estrutura/integração. Não houve novo erro comprovado que justificasse alterar outra fórmula. Esta etapa acrescenta documentação e um teste de pré-homologação; preserva as correções do PR #2 como propostas em revisão.

## Organização confirmada

| Categoria | Calculadoras | Quantidade |
|---|---|---:|
| Evolução da conta | Evolução de habilidades; Nível e experiência; Custo de desenvolvimento da conta | 3 |
| Indústria | Evolução de fábricas; Bonificações e turnos de fábrica | 2 |
| Trabalho e economia | Rendimento do trabalhador; Impostos; Lucro de fábrica | 3 |
| Governo e militar | Construções e manutenção; Quartel e exército | 2 |
| Comércio e recursos | Planejamento de recursos | 1 |
| Total | Onze IDs distintos, nenhuma calculadora excluída | 11 |

**Aprovadas sob premissas:** Impostos (alíquotas aditivas sobre a mesma base); Lucro de fábrica (receitas, insumos, salários e imposto sobre receita informados); Planejamento de recursos (necessidade, estoque e preço informados). A aprovação é aritmética. Não valida automaticamente o tributo, bônus pessoal ou produtividade vigente no jogo.

**Em validação:** Evolução de habilidades; Nível e experiência; Custo de desenvolvimento da conta; Evolução de fábricas; Bonificações e turnos de fábrica; Rendimento do trabalhador; Construções e manutenção; Quartel e exército.

A central não contém seção de trilhas nem carrega seu script. `student-hub.js` continua usando `/api/student/tracks` e `/api/student/tracks/request` em Minha Academia. Não foi alterada a política de desbloqueio das trilhas.

## Revisão dos riscos de regressão

| Prioridade | Área | Avaliação e controle |
|---|---|---|
| P0 | XP racional versus comportamento do jogo | A correção do piso é matematicamente demonstrável, mas o servidor pode produzir precisamente o resultado antigo usando aritmética flutuante. Sem o valor real da tela do jogo, não afirmar que o novo resultado reproduz a cobrança do servidor. Bloqueia homologação dessa mecânica. |
| P0 | Redutores de tempo | A fórmula nova reproduz combinações controladas do DipTools. Isso ainda não prova que o Premium, a classe e a engenharia atuais do jogo usem os mesmos fatores. Registrar todos os redutores da mesma simulação e o tempo inicial anterior à confirmação. |
| P0 | Autorização | Worker e configuração não mudaram no PR. Mantidos `run_worker_first:true`, sessão com papel admin e arquivos internos protegidos. Os testes prévios de visitante/aluno/admin continuam evidência local; não transformar 1010 em aprovação do controle da aplicação. |
| P1 | Compatibilidade BigInt | A recorrência usa BigInt; o arquivo inteiro precisa ser interpretado por um navegador compatível. Homologar Chrome/Android e Safari/iOS atuais antes da liberação. Não declarar suporte a navegadores antigos não testados. |
| P1 | Formulários condicionais | Salário fixo, bônus e produção validam somente os parâmetros ativos. O reset recalcula a visibilidade após a ação padrão do navegador. Conferir alternância e reset nos testes de produção, sem repetir toda a matriz matemática. |
| P1 | Seleção e filtros | As cinco categorias e a busca podem trocar a ferramenta selecionada, reiniciando o formulário correspondente. Não há promessa de persistência de rascunhos. Confirmar que o resultado exibido pertence ao formulário selecionado e que o estado vazio não conserva resultado anterior. |
| P1 | Valores pequenos e unidades | Valores não nulos abaixo da precisão visual aparecem como intervalo; isso não é arredondamento contábil para pagamento. Tempos são estimativas; força militar é força-base, não dano final. |
| P1 | Cache/versão | JS e CSS usam identificadores novos; a página e seus arquivos são privados/no-store. Após implantação autorizada, conferir todos os três identificadores e a revisão do Worker, não apenas a presença do HTML novo. |
| P2 | Limites conservadores | Habilidades até201, fábricas/jogador até150 e Suprimentos até200 são limites da ferramenta; não são alegações sobre o teto do jogo. Não ampliar a partir de documentação contraditória. |

A análise não encontrou duplicação de tarifas entre habilidades e conta: conta agrega chamadas do mesmo motor. Permanecem duas ferramentas porque uma responde a uma habilidade e outra a um plano das quatro. Não houve autorização para excluir nenhuma.

## Matriz nominal de pendências

Convenções: `n` é o nível de origem; somas percorrem os avanços do atual ao alvo. Os resultados de referência abaixo são os exemplos já registrados na auditoria, não uma nova execução de todos os casos.

### 1. Nível e experiência — P0

- **Modelo usado:** até origem80, `piso(250×(217/200)^(n−1))`; origens81–90, `piso(anterior×13/10)`; acima90, `piso(anterior×14/10)`. Somar e subtrair XP parcial dentro do nível atual. Aritmética racional exata no PR.
- **DipTools observado:** 1→75 =1.228.202XP; 80→81 =157.358; 81→82 =204.565; 100→101 =62.747.892.
- **Divergência:** a fórmula racional do PR resulta62.747.897 em100→101. Em96→97 resulta16.333.793; o modelo antigo com float resulta16.333.792. A documentação pública de nível não resolve essa diferença nem confirma consistentemente a mudança80/90.
- **Dado necessário:** captura do **XP exato exigido para o próximo nível**, preferencialmente96→97 ou100→101. Informar nível atual e distinguir XP acumulado total, XP ganho dentro do nível e XP necessário para o avanço. Para confirmar os dois pontos de mudança, coletar depois80→81,81→82,90→91 e91→92. Pode ser evidência de outra conta com identificação ocultada. Não é necessário ganhar XP ou gastar recursos para produzir a captura.

### 2. Evolução de habilidades — P0

- **Modelo usado:** moedas `Σ250n`; diamantes `Σarredondar(7,5×teto(n/10))`; tempo-base em segundos `máximo(60,1080×(n/50)^2,5)`; fator `C×E×P−G`. C=0,9 no Acadêmico,1 nas demais classes modeladas; E=1−0,02×índice até10,0,7 para11; P=0,65 com Premium,1 sem; G=engenharia/100. Somar antes de arredondar; diamantes levam1/4 do tempo bruto no modelo.
- **DipTools observado:**100→101, Acadêmico, educação0/engenharia0, com Premium =25.000 moedas,75 diamantes,3.575s em moedas e894s em diamantes. Com educação11/engenharia20 e Premium =1.280s em moedas. Sem Premium, com esses dois índices =2.628s.
- **Divergência:** o rótulo Premium da referência diz25%, mas o comportamento medido usa outro fator. Fontes públicas também diferem quanto à tarifa em diamantes e ao tempo mínimo. O PR corrige a composição da referência, não certifica esses fatores no jogo.
- **Dado necessário:** tela de **prévia da melhoria**, com habilidade, nível atual/alvo, custos em moedas e diamantes, tempo inicial das duas rotas e todos os redutores mostrados. Informar classe, Premium ativo ou não, índice de educação/carreira e engenharia. Começar pelo cenário disponível na sua conta. Para identificar cada efeito, são úteis exemplos comparáveis de outras contas/classes, sem comprar Premium ou mudar classe só para testar. Um cronômetro já em andamento não substitui o tempo inicial.

### 3. Custo de desenvolvimento da conta — P1, compartilha evidências com habilidades

- **Modelo usado:** somar os custos e tempos sequenciais das quatro habilidades pelo mesmo motor. Valor dos diamantes em moedas = quantidade×cotação manual. Não presume bônus gratuito nem preço de venda da conta.
- **DipTools observado:** Ciência51→52 e as outras três1→2 =13.500 moedas e69 diamantes. A referência rejeita todas as habilidades iniciais1 alegando bônus inicial mínimo51 em uma das três habilidades principais.
- **Divergência:** a Velarian permite níveis explícitos e não aplica esse bônus por conta própria. Além disso, a estimativa agregada herda todas as pendências dos redutores de habilidades.
- **Dado necessário:** níveis atuais das quatro habilidades, níveis pretendidos e qual habilidade recebeu bônus inicial gratuito, até qual nível e em qual situação/classe. A tela do item2 já resolve tarifas e tempos; não são necessárias quatro capturas idênticas nem cadastro de nova conta para teste.

### 4. Evolução de fábricas — P1

- **Modelo usado:** XP = `piso(Σbase×1,06^(n−1))`; base500 para diamantes,150 para os outros quatro tipos. Diamantes = `Σ(10+5n)`. Não desconta XP parcialmente já ganho dentro de um nível.
- **DipTools observado:** diamantes10→11 =844XP e60 diamantes; desde o nível1 até11 =6.590XP e375 diamantes. Para recurso10→11 =253XP; acumulado1→11 =1.977XP.
- **Divergência:** não foi encontrada diferença numérica nesse modelo nos22.350 intervalos testados. A pendência é saber se o jogo usa a mesma curva, se trunca o requisito ou exige outro inteiro e como apresenta XP já acumulado. A wiki menciona limite200, enquanto a ferramenta conserva150.
- **Dado necessário:** uma fábrica de diamantes e uma de recursos: tipo, nível, XP atual dentro do nível, XP total necessário ao próximo e custo em diamantes da melhoria. Priorizar qualquer fábrica já disponível; não abrir ou melhorar uma só para testar. Se houver prévia para vários níveis, informar o alvo correspondente.

### 5. Bonificações e turnos de fábrica — P1, depende do item4

- **Modelo usado:** bônus proporcional = XP requerido/faixa×valor. Trabalhos =teto(XP/100); turnos =teto(trabalhos/trabalhadores); minutos =turnos×10. No modo fixo, folha =trabalhos×salário. Não paga vagas ociosas do turno final.
- **DipTools observado:**500XP, bônus5M/1.000XP, dez trabalhadores =2,5M, cinco trabalhos e um turno de dez minutos.
- **Divergência:** não há diferença nesse exemplo; faltam provas de que o “XP/EP” do acordo é a mesma grandeza do progresso da fábrica e de que cada trabalho contribui100 para ela. Um acordo pago somente por blocos completos não é equivalente ao modo proporcional atual.
- **Dado necessário:** dizer se o bônus é proporcional ou por blocos completos; qual grandeza o acordo remunera (EP da fábrica, XP do jogador ou outra); quantidade dessa grandeza acrescentada por um trabalho; salário e número de trabalhadores do exemplo. Um registro existente e a explicação do acordo bastam; não é necessário pagar bônus ou contratar ninguém para testar.

### 6. Rendimento do trabalhador — P1

- **Modelo usado:** seis trabalhos/hora,100EP por trabalho; regeneração =piso(trabalhos×5/3)×HP por ciclo de seis minutos; gasto em diamantes =teto(máximo(0,EP−regeneração)/5); ganho de20 diamantes por trabalho no tipo diamantes. Salário e bônus informados menos imposto informado; produção recebe quantidade e cotação manuais.
- **DipTools observado:**1h, regeneração7HP/ciclo e salário50mil =seis trabalhos,600EP,70HP regenerados,106 diamantes gastos,120 ganhos e300mil moedas. Em24h:144 trabalhos,2.544 gastos e saldo+336 diamantes.
- **Divergência:** as páginas da wiki de trabalho apresentam XP diferentes entre idiomas e descrevem5HP no índice7+, enquanto a referência usa6/7HP em índices superiores. Não foram confirmados os5HP por diamante, os20 diamantes por trabalho, o HP inicial e os limites que podem impedir uma jornada contínua.
- **Dado necessário:** descrição atual de regeneração na tela de saúde/hospital, índice, preço e quantidade de HP da reposição; registro existente de um trabalho com tipo e nível da fábrica, HP consumido, produção, remuneração, tributos e XP/EP recebidos. Identificar o que é ganho bruto e líquido. Não é necessário efetuar trabalho ou compra para a auditoria.

### 7. Quartel e exército — P1

- **Modelo usado:** força-base =Σquantidade×força unitária1–5; custo =Σquantidade×tabela×(1−Suprimentos×0,0005). Cotação de recursos é manual; não há multiplicadores de combate.
- **DipTools observado:**dez infantarias, Suprimentos100 =força-base10,47.500 moedas,950 couro e475 ouro. Na tabela da referência, uma infantaria sem desconto custa5.000 moedas/100couro/50ouro; tanque10.000 moedas/150NTE/100petróleo.
- **Divergência:** a wiki descreve infantaria com100ouro e tanque por50mil moedas,500NTE e300petróleo. Não foi possível confirmar qual tabela é atual nem como o jogo arredonda descontos em recursos. A força-base não deve ser confrontada diretamente com o dano final de uma operação.
- **Dado necessário:** tela de **prévia de recrutamento**, antes de confirmar, para cada tipo disponível; quantidade, recursos e moedas exigidos e nível de Suprimentos. Começar por infantaria e tanque. Para isolar o desconto, exemplos comparáveis com Suprimentos conhecidos ou valor-base mostrado pelo jogo. Não recrutar para produzir evidência.

### 8. Construções e manutenção — P2

- **Modelo usado:**Σ(alvo−atual)×custo unitário; manutenção diária =3% do custo de instalação de todos os níveis alvo. A tabela completa está no relatório de auditoria e no motor.
- **DipTools observado:**escola0→2 =200mil moedas,800couro,880ouro e600NTE; manutenção diária6mil moedas,24couro,26,4ouro e18NTE.
- **Divergência:** paridade com esse exemplo; não há evidência atual suficiente sobre custo linear, taxa3%, base da manutenção e tratamento dos recursos fracionários no jogo.
- **Dado necessário:** níveis atuais, custo da próxima melhoria e manutenção diária de escola, base militar, estrada e hospital. Começar por uma escola já existente. Identificar se o valor mostrado é incremental ou total e se a manutenção já inclui outras construções. Usar tela de orçamento/prévia, sem construir nem transferir recursos.

## Cloudflare1010: conclusão e limites

A investigação consultou a [documentação oficial de erro1010](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1010/), atualizada em24/10/2026.

A documentação descreve bloqueio por assinatura do cliente e cita especificamente `workers.dev` com User-Agent padrão do Python urllib. Esse é o cliente e o tipo de domínio usados na requisição anteriormente bloqueada. A combinação é uma **explicação provável e bem sustentada**, mas não é um diagnóstico individual por Ray ID. A resposta anterior não preservou um Ray ID utilizável.

Pontos relevantes para este caso:

- O bloqueio gerenciado em `workers.dev` pode ocorrer antes do Worker e não aparecer nos eventos da zona nem nos logs do Worker. Ausência desses registros não comprova erro do teste.
- Esse Browser Integrity Check gerenciado não é desativável pelo proprietário nesse hostname, segundo a documentação. Solicitar para desligar uma opção global não é uma solução adequada para esta homologação.
- O1010 não prova senha incorreta, sessão inválida, defeito de fórmula ou aprovação do403 administrativo.
- Navegação administrativa no navegador já funcionou na auditoria. Essa evidência é distinta do acesso HTTP independente bloqueado.
- Não foi repetida a chamada bloqueada, alterada assinatura/IP ou alterada proteção de produção nesta continuação. A homologação será feita com navegação normal e perfis QA identificados, preservando a proteção.

O site não precisa de mudança de domínio para preparar os testes. Se integração por cliente HTTP se tornar um requisito, tratar separadamente a identificação transparente desse aplicativo conforme a orientação do provedor e o ambiente autorizado; isso não é necessário para repetir navegação e cálculos no navegador.

## Roteiro de homologação em produção, ainda não executado para o PR2

### Antes da implantação

1. Resolver ou manter explícitas as pendências de mecânicas acima. Não apresentar equivalência com o jogo como provada por testes do modelo.
2. Obter autorização posterior para integrar/implantar a revisão final do PR2. Esta tarefa não autoriza publicação; o PR permanece em rascunho.
3. Conferir head/base atuais, arquivos alterados e a revisão exata pretendida. Caso outra alteração entre na main, revisar apenas as áreas afetadas antes de integrar.
4. Preparar perfis QA A/B exclusivos de teste, com papéis reais de aluno, mais um administrador existente. Não elevar privilégios de alunos reais. Senhas entram somente pelo fluxo seguro, nunca no relatório ou chat.
5. Definir duas sessões de navegador separadas por perfil e uma sessão sem autenticação. Não compartilhar o cookie administrativo entre elas. Não extrair nem registrar cookies em ferramentas de inspeção.

### Após uma implantação autorizada

| Verificação dirigida | Resultado exigido | Evidência a guardar |
|---|---|---|
| Revisão ativa | Deploy do Cloudflare ligado ao commit aprovado | ID da versão/deploy, SHA associado e horário; o merge no GitHub sozinho não basta |
| Administrador | Central abre, há11 ferramentas em cinco categorias | Tela administrativa e inventário de categorias |
| Visitante sem sessão | Central, JS e CSS privados negados pela aplicação |403 com mensagem da aplicação;1010 fica como “não testado”, não aprovado |
| QA A e QA B alunos | Mesmas rotas privadas negadas | Respostas em sessões independentes, sem dados pessoais reais |
| HTML interno | `ferramentas.asset` inacessível diretamente |404 esperado, inclusive com sessão administrativa |
| Aliases | `/ferramentas`, `/ferramentas/`, `/ferramentas.html` funcionam para admin | Página e recursos carregados, sem loop nem redirecionamento para conteúdo público |
| Versionamento | JS `v=2-audit` e CSS `v=3-audit`, ou novos identificadores do commit final | Referências do HTML, MIME e cache privado/no-store |
| Smoke de cálculos | Um exemplo já documentado em cada ferramenta |11 resultados, sem repetir os407 testes |
| Redutores/XP | Casos sensíveis aprovados com dados reais ou mantidos explicitamente como estimativas | Comparativo com as evidências fornecidas pelo usuário |
| Interface | Filtro, busca, campo vazio, reset e modo de remuneração corretos | Computador e celular; confirmar navegador com BigInt |
| Isolamento | Editar uma página não afeta a outra; cálculos não criam registros | Valores independentes; ausência de ações de gravação de dados do jogo |
| Trilhas | Continuam em Minha Academia, sem aparecer na central de cálculos | Área de aluno e central separadas |

Nenhum desses testes exige aprovar certificados, marcar aulas, criar desbloqueios, editar cadastros reais, recrutar ou pagar recursos do jogo. Se uma sessão deixar de estar autenticada, concluir o fluxo seguro de login em vez de alterar permissões.

### Critérios para encerrar

- Arquivos implantados e Worker correspondem à revisão aprovada.
- Acesso administrativo e negação de alunos/visitantes comprovados pela aplicação.
- Regressões sensíveis e separação de trilhas aprovadas.
- Cada calculadora mantém seu status individual; regras não confirmadas continuam em validação.
- A liberação pública exige autorização específica posterior. A implantação administrativa não libera alunos automaticamente.

## Verificações executadas nesta continuação

Comando: `node tests/calculators-preflight.mjs`.

12/12 aprovadas: onze IDs únicos; cinco categorias; cinco verificações de associação; ausência de trilhas na central; APIs de trilhas no escopo do aluno; Worker idêntico à base; encaminhamento obrigatório pelo Worker; identificadores dos recursos alterados.

Não foram repetidas as358 verificações novas da auditoria, as40 anteriores nem as9 regressões, pois o motor, a interface e o Worker não foram modificados nesta continuação. A documentação explica os riscos e os testes de produção que ainda dependem de publicação autorizada e sessões adequadas.

## O mínimo a fornecer primeiro

1. **XP96→97 ou100→101:** valor exato exigido para subir e indicação do que é total versus parcial. Prioridade máxima para decidir o piso racional.
2. **Uma prévia de melhoria de habilidade:** custos e tempos iniciais das duas rotas, nível, classe, Premium e todos os redutores. Isso também ajuda a validar a calculadora agregada da conta.
3. Depois: telas de fábrica, trabalho, tropas e construções descritas nos itens4–8. Para bonificações, basta também esclarecer a regra do acordo e a unidade remunerada.

Oculte nomes/identificadores se desejar. **Não envie senhas, tokens ou cookies. Não é necessário gastar moeda ou executar as ações previstas nas telas.**


## Decisão de referência — 29/10/2026

Por autorização do responsável, DipTools passa a ser a referência de paridade para calculadoras equivalentes. A curva de XP foi ajustada na branch para reproduzir o arredondamento de ponto flutuante observado no DipTools: 100→101 = 62.747.892 XP e 96→97 = 16.333.792 XP. Os testes de regressão correspondentes foram atualizados. As seções anteriores registram o histórico da auditoria antes desta decisão e não descrevem mais a implementação atual de XP. Paridade integral de todos os cenários e execução da bateria completa após esta mudança ainda não foram comprovadas; manter PR em rascunho e acesso somente administrativo.

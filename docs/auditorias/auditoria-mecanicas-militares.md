# Auditoria das mecânicas militares e geopolíticas

Data da pesquisa: **07/11/2026**, America/Sao_Paulo. Base do repositório: [`6b7f0bd4b2190fd96076299569a94e5f22d2cca8`](https://github.com/dinastia-velarian/academia/blob/6b7f0bd4b2190fd96076299569a94e5f22d2cca8/).

**Estado: auditoria oficial bloqueada por acesso de rede; análise local e planejamento preliminar. Não representa revisão integral da wiki nem homologação das mecânicas atuais.**

Legenda: **R** = fato verificado no repositório; **H** = registro histórico em documento local, sem revalidação primária; **I** = inferência/risco a investigar; **E** = proposta editorial ou estratégia de jogadores; **P** = confirmação oficial pendente. Nenhuma afirmação H, I ou E é promovida a regra oficial nesta auditoria.

## O que foi e o que não foi verificado

Foram analisados os textos militares, de cargos, política e RP da base versionada e o motor matemático. **Nenhuma regra foi validada na versão atual da wiki**. As tabelas a seguir descrevem o que a Academia afirma e o que deve ser confirmado; não fornecem instruções oficiais para executar guerras.

Referências primárias atuais: **nenhuma página consultada**. Os URLs H1–H7 e o bloqueio estão no [inventário](inventario-wiki-diplomacia.md). O relatório histórico R6 é somente fonte secundária.

## Matriz de investigação prioritária

| ID | Tema | Evidência local e lacuna | Perguntas para a fonte oficial | Prioridade |
| --- | --- | --- | --- | --- |
| Q-BLO | Blocos geopolíticos | R: `t6-l5` descreve alianças entre países, partidos ou grupos e regras internas. Não demonstra uma entidade formal do sistema | Bloco formal existe? Quem pode criar/aderir/sair? Quais entidades são membros? Custos, quórum, liderança, dissolução e carências? | P1 |
| Q-ALI | Alianças e guerra | R: `t6-l5` recomenda coordenação; `t8-l3` explica que pacto de RP não cria proteção automática | Há obrigações/benefícios militares implementados? Apoio automático ou voluntário? Qual o alcance de pactos e limitações de participação? | P1 |
| Q-FOR | Quartel, treinamento e capacidade | R: `t4-l0` a `t4-l4` são introduções; não definem fórmula de capacidade, tempos ou reserva | Requisitos por tipo, limites de tropas, produção por ação, tempo, custos, capacidade e passagem à reserva? | P1 |
| Q-UNI | Unidades e custos | R: cinco pesos-base 1/2/3/4/5 no texto e no motor. H3: registro antigo de custos diferentes | Quais custos vigentes por unidade e recurso? Alvos permitidos? Dano e poder são métricas distintas? Como entram Suprimentos e Quartel? | P1 |
| Q-BON | Índices e bônus | R: classe Militar +20%, Premium +50% no texto; motor `army()` não calcula combate | Condições, escopo pessoal/provincial, ordem de aplicação, soma versus produto, tetos, arredondamentos e duração? | P1 |
| Q-AUT | Autoridades e autorização | R: `t5-l6` atribui declarar/aprovar/rejeitar guerra a Relações Exteriores; `t5-l4` distingue Defesa de declarar guerra | Quem propõe, aprova, declara e abre cada front? Presidência, Parlamento e ministérios têm quais permissões e substituições? | P1 |
| Q-FRT | Abertura e simultaneidade de fronts | R: aulas mencionam fronts, mas não ensinam requisitos, custos ou limites | Declaração e abertura de front são etapas distintas? Conexão territorial, acessos, cooldowns, custo, quantidade por ator/território/guerra e condições de defesa? | P1 |
| Q-COM | Ataque, defesa e dano | R: a aula de tropas dá poder-base; não há fórmula completa de dano na base | Fórmula vigente, tipos e alvos, requisitos de participação, consumo por ataque, HP, perdas, defesa, bônus e relatórios? | P1 |
| Q-TEM | Duração e encerramento | R: sem regra detalhada sobre duração, horários ou vitória | Relógio, fuso, condições de início/fim, vitória, empate, cancelamento e relação entre fim de front e fim de guerra? | P1 |
| Q-TER | Conquista e recuperação | R: menções genéricas a defesa e territórios, sem procedimento canônico | Quando e como muda a soberania? Ocupação, propriedade, recuperação, restrições geográficas e efeitos em tesouro/índices? | P1 |
| Q-IND | Independências | R: `t8-l9` separa narrativa de independência da mudança real de soberania | Existe ação específica? Quem inicia, contra quem, por quais requisitos, custos, prazos, limites e critérios de sucesso? | P1 |
| Q-REV | Revoltas e classe Rebelde | R: `t1-l3` menciona bônus rebelde sem parâmetros; `t8-l9` trata de RP | Revolta e independência são processos distintos? Quem participa, quais gatilhos e consequências? Bônus e desbloqueio da classe? | P1 |
| Q-BUF | Regiões buffer e múltiplos buffers | R: nenhum procedimento explicativo na base examinada | “Buffer” é termo oficial, estado do território ou jargão? Que transições o produzem? Protege ou apenas limita quais ações? Vários buffers interagem como? | P1 |
| Q-LOG | Economia e mobilização | R: economia, recursos e reserva são introdutórios; modelos usam HP/diamantes | Consumos militares reais, custos de mobilização, reposição, manutenção, disponibilidade de tropas, impostos e limites de estoque? | P2 |

**P1** significa prioridade de verificação antes de ensinar decisões com alto custo de erro. Não significa bug do jogo ou regra já contradita pela wiki. **P2** significa aprofundamento a fazer após estabelecer os fundamentos oficiais.

## Afirmações locais que exigem citação primária antes de serem reafirmadas como oficiais

1. **Bônus do Ministério da Defesa:** `t5-l4` diz literalmente “o cargo concede automaticamente +20% de poder militar nas guerras”. `t8-l4` repete a caracterização automática. Isso é uma **afirmação da Academia**, não uma confirmação desta pesquisa. Verificar se a regra existe, qual estatística modifica, quem recebe, quando se aplica e como acumula com classe/Premium/índice. Fontes locais: [t5-l4](https://github.com/dinastia-velarian/academia/blob/6b7f0bd4b2190fd96076299569a94e5f22d2cca8/public/approved-lessons.json#L302) e [R1](https://github.com/dinastia-velarian/academia/blob/6b7f0bd4b2190fd96076299569a94e5f22d2cca8/public/approved-lessons.json).
2. **Autoridade de guerra de Relações Exteriores:** `t5-l6` atribui declarar guerras e aprovar/rejeitar projetos. Falta fonte que delimite a cadeia de autorização e diferencie guerra de front. Não transferir essas ações automaticamente para Defesa ou Presidência. [t5-l6](https://github.com/dinastia-velarian/academia/blob/6b7f0bd4b2190fd96076299569a94e5f22d2cca8/public/approved-lessons.json#L318).
3. **Bônus de classe e Premium:** `t1-l3` informa +20% de dano para Militar; `t1-l4`, +50% de dano para Premium. Não derivar multiplicador 1,7 ou 1,8: soma/produto, base e contexto não foram confirmados. [R1](https://github.com/dinastia-velarian/academia/blob/6b7f0bd4b2190fd96076299569a94e5f22d2cca8/public/approved-lessons.json).
4. **Poder unitário:** a sequência 1/2/3/4/5 é coerente entre `t4-l1` e `army()` (**consistência interna R**). Isso não valida dano final, eficácia relativa ou relação de alvos no jogo. [Aula](https://github.com/dinastia-velarian/academia/blob/6b7f0bd4b2190fd96076299569a94e5f22d2cca8/public/approved-lessons.json#L166) e [motor](https://github.com/dinastia-velarian/academia/blob/6b7f0bd4b2190fd96076299569a94e5f22d2cca8/public/calculator-engine.js#L18).
5. **Suprimentos, capacidade e reservas:** os textos mencionam benefícios e uma área de reserva, mas não dão fórmula de capacidade, disponibilidade, custo de mobilização ou transferência entre estados. Não ensinar quantidade disponível como equivalente à quantidade mobilizável sem regra documentada.
6. **Blocos:** a descrição genérica mistura potenciais entidades formais e alianças comunitárias. Confirmar os tipos de membros e as ferramentas antes de chamar de mecanismo oficial. A aula está no grupo 6, que não integra o catálogo canônico desta revisão; [comparativo](comparativo-wiki-academia.md).

## Fórmulas efetivamente implementadas — não regras oficiais validadas

Fonte: [R4](https://github.com/dinastia-velarian/academia/blob/6b7f0bd4b2190fd96076299569a94e5f22d2cca8/public/calculator-engine.js). Tabela sem descontos, na ordem dos vetores do motor:

| Unidade no motor | Força-base | Moedas | Couro | Ouro | NTE | Petróleo |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Infantaria | 1 | 5.000 | 100 | 50 | 0 | 0 |
| Tanque | 2 | 10.000 | 0 | 0 | 150 | 100 |
| Navio | 3 | 20.000 | 0 | 100 | 100 | 0 |
| Avião | 4 | 40.000 | 200 | 0 | 0 | 100 |
| Míssil | 5 | 80.000 | 0 | 0 | 300 | 500 |

Para quantidades `qᵢ` e nível de Suprimentos `S`:

- Força-base do modelo: `Σ(qᵢ × forçaᵢ)`.
- Fator aplicado aos custos monetários e materiais: `1 − 0,0005 × S`.
- Custo por recurso: `Σ(qᵢ × custo-baseᵢ × fator)`.
- Avaliação com cotações: `moedas + Σ(quantidade de recurso × preço informado)`.
- Faixa aceita pelo código: `S` inteiro de 0 a 999; **não é um limite oficial confirmado**.
- O resultado é rotulado “Força-base das unidades”. Não há entradas para Técnicas de Guerra, Índice Militar, classe, Premium, bônus de cargo, capacidade ou condições do front. Portanto, essa função **não é um simulador de dano ou vitória**.

H3 é uma pista histórica importante: R6 atribui à revisão 86 infantaria com 100 de ouro e tanque de 50.000 moedas, enquanto o código usa 50 de ouro e 10.000 moedas. A página não foi recebida nesta auditoria; não se sabe qual tabela corresponde à versão atual. Não corrigir o motor com base apenas nesse registro secundário.

## Regra, estratégia e RP: critérios de separação

| Classe | Exemplo nesta análise | Tratamento |
| --- | --- | --- |
| Regra oficial atual | Nenhuma confirmada nesta execução | Só preencher com página/seção/revisão efetivamente lida e condições explícitas |
| Afirmação local R | Ministério da Defesa +20% automático no texto | Registrar fielmente e pedir fonte; não dar selo oficial |
| Inferência I | Um peso-base maior significaria necessariamente mais dano por custo | Não concluir: depende de fórmulas, alvos e bônus ainda não verificados |
| Estratégia E | Manter reserva, coordenar aliados, priorizar fronts, comparar índices | Pode compor exercício de planejamento; rotular como recomendação, declarar hipóteses e riscos |
| RP | Manifestos, pactos narrativos, títulos e relatos | Não substitui declaração/ação oficial nem altera soberania ou permissões |

Buffers múltiplos, escolha de índices e sincronização de fronts devem ser ensinados em duas camadas: **primeiro** os limites oficiais comprovados; **depois** as escolhas estratégicas possíveis dentro desses limites. Não propor “proteção garantida”, “front ilimitado”, “guerra automática”, duração fixa ou fórmula de dano sem documentação.

## Evidência necessária para concluir

Para cada Q acima: URL oficial atual, seção e trecho exato, revisão/idioma/data, atores autorizados, pré-condições, custos e unidades, sequência, limites e exceções. Para números, registrar ordem dos bônus e arredondamentos. Se a wiki for incompleta, manter P e solicitar esclarecimento aos administradores; relatos de jogadores podem gerar hipóteses E/I, não substituir a regra.

A proposta de formação está em [proposta-formacao-militar.md](proposta-formacao-militar.md). Não foram abertas guerras, treinadas tropas, movimentados recursos nem consultadas contas do jogo.

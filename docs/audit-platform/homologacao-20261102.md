# Homologação da Academia Velarian — 02/11/2026

## Parecer

Correções técnicas verificadas em ambiente isolado e preparadas para revisão. **Homologação final de produção pendente**, porque não existe autenticação Cloudflare neste ambiente e a mecânica de aumento de custos de edifícios não foi comprovada. Não declarar a plataforma 100% homologada.

Base examinada: `4c335de4ee5be87f2be18437da42f486bc13bf65`, branch main de `dinastia-velarian/academia`. Produção visitada em navegador normal: https://academia.velarian.workers.dev/ e /admin, reutilizando sessão administrativa autorizada. Nenhum usuário real foi editado, excluído, bloqueado ou teve suas permissões alteradas. Não foram emitidos certificados, publicadas mensagens ou feitas gravações de QA no banco real. Visitas normais podem alimentar a telemetria já existente.

## Correções comprovadas

| Problema | Evidência e correção |
|---|---|
| Central de trabalho, agrupamento de menus e métricas por área ausentes no painel servido | As melhorias estavam em `admin.html`, mas o Worker serve `admin-panel.asset` e bloqueia /admin.html. Sincronizados os documentos, preservando todos os IDs anteriores, e atualizado o cache. Teste impede nova divergência. Não foi removida a proteção do arquivo interno. |
| Opções administrativas inacessíveis no fim da tela | Reprodução no navegador: lateral maior que a janela, sem rolagem própria. Adicionada rolagem vertical; em largura móvel, removida disposição horizontal conflitante dos grupos. A aba Administradores também passa a fechar o menu móvel. |
| Lançamentos financeiros válidos rejeitados | Expressão regular continha barras invertidas duplicadas. Corrigida para aceitar inteiros e até três casas decimais, preservando os limites existentes. |
| Configurações parcialmente publicadas após erro | Um campo era gravado antes de validar o próximo. Agora todos são validados antes do batch atômico. Teste verifica que título anterior fica intacto ao rejeitar finanças inválidas. |
| Novos alunos incluíam contas antigas | Comparação de data SQLite textual com timestamp numérico. Corrigida comparação usando data UTC no mesmo formato. |
| Estatísticas incluíam aulas antigas/ocultas | Contagens, atividade, ranking e distribuição agora usam as chaves do currículo canônico. Nenhum registro histórico foi apagado. |
| Administrador limitado recebia configurações e conteúdo fora da sua alçada | `/api/admin/all` agora filtra os domínios conforme as permissões existentes. Criada consulta das próprias permissões; navegação acompanha esses direitos. Nenhuma concessão ou cargo real foi modificado. |
| Relatórios de administrador com apenas permissão de relatórios mostravam zeros por falta de acesso às listas privadas | Acrescentados totais agregados, sem entregar nomes ou mensagens restritas. Edição financeira permanece dependente da permissão de configurações. |
| Dados financeiros manuais apareciam no payload público | Removidos campos `finance*` da resposta pública. Permanecem disponíveis nas áreas autorizadas. |
| Caminhos codificados podiam expor documentos administrativos internos | Bloqueio aplicado também a aliases codificados de admin-panel.asset e gestao-trilhas.asset. |
| Exclusão de comentário em banco recém-inicializado podia falhar por tabela ausente | Inicialização idempotente da tabela antes da operação. Teste usa apenas banco descartável. |
| CSV de relatório aceitava fórmulas em texto fornecido por alunos | Células textuais iniciadas por operadores de planilha recebem proteção; aspas continuam escapadas. Teste cobre operadores e espaços iniciais. |
| Teste antigo interpretava run_worker_first como lista | Atualizado para aceitar a configuração `true` vigente, sem enfraquecer a execução prioritária do Worker. |

## Resultado dos testes automatizados

As contagens são casos nomeados; alguns verificam vários parâmetros. O executor usa SQLite em memória, fixtures locais e não aponta para produção.

| Suíte | Aprovados | Reprovados finais | Cobertura |
|---|---:|---:|---|
| audit.mjs | 28 | 0 | Cadastro, login, logout, sessão expirada, isolamento, 80%, certificado, PDF, bloqueio e rate limit |
| platform-homologation.mjs | 55 | 0 | Nove permissões individuais, proprietário, CSRF, configurações atômicas, finanças, métricas, trilhas, mudança de senha, conteúdo, avisos, sugestões, patrocínios, documentos internos e CSV |
| student-ui.mjs | 2 | 0 | Elegibilidade 60→80→60% sem recarga e escape de conteúdo |
| student-hub.mjs | 5 | 0 | Certificado, troca de conta, reenvio e integração pública |
| homologacao-final.mjs | 9 | 0 | Currículo canônico, rotas administrativas e PDF imperial |
| calculators-preflight.mjs | 11 | 0 | Oito ferramentas, categorias, separação das trilhas, rotas e cache |
| calculators.mjs | 39 | 0 | Fórmulas, entradas e rotas das calculadoras |
| calculators-audit.mjs | 358 | 0 | Matriz matemática existente, incluindo casos extremos e precisão |
| factory-profit.mjs | 55 | 0 | Projeção contínua, produção, bônus, cenários de referência e inválidos |
| calculator-regression.js | 7 | 0 | Aritmética de edifícios, multiplicador manual e Suprimentos 999 |
| **Total** | **569** | **0** | Não equivale à confirmação oficial das fórmulas do jogo |

Verificação de sintaxe: Worker e 21 scripts públicos, sem falhas. `git diff --check` aprovado. As verificações matemáticas históricas foram executadas uma vez nesta homologação completa; novas execuções locais ficaram limitadas aos testes afetados por correções. O CI existente poderá repeti-las automaticamente.

O primeiro teste amplo encontrou 16 falhas em 47 casos. As correções foram verificadas, a matriz foi ampliada e os 55 casos finais passaram. Falhas de expectativa do próprio teste (como status 201 em rota que retorna 200) foram corrigidas sem alterar a API para satisfazer o teste.

## Interface e funcionalidades

- Produção, somente leitura: home, tópicos, entrada Minha Academia e as 13 abas administrativas previamente existentes inspecionados. O controlador antigo em cache apresentou navegação inconsistente em mudanças rápidas; os documentos corrigidos usam a versão atual do controlador.
- Prévia isolada: todas as 14 abas do painel atualizado acessíveis, com título correto e sem erros de permissão para o proprietário; central de trabalho e diagnóstico executados; gravação financeira decimal testada no formulário local.
- Aluno fictício: conclusão marcada e preservada após recarga; logout confirmado pelo retorno do formulário de entrada. Cadastro, login, alteração de senha e certificados testados no Worker local; não foram modificadas senhas reais em navegador.
- Trilhas: pedido, prevenção de duplicidade, aprovação e isolamento entre dois alunos passaram nas APIs locais. A posição em Minha Academia foi preservada.
- Oito calculadoras: resultado padrão produzido em navegador sem erro. Nenhuma função matemática do motor foi alterada.
- Layout estreito: iframe de QA com 390px externos/375px úteis, menu administrativo aberto/fechado e navegação por teclado; sem overflow horizontal da página. Painel do aluno também medido com largura útil igual à largura de conteúdo. Não é teste em aparelho físico/touch.
- Uploads, exclusões e decisões sobre contas/certificados reais não foram executados em produção. A cobertura não significa que cada botão destrutivo foi acionado contra dados reais.

![Prévia isolada do painel corrigido](desktop.jpg)

O servidor de QA em `tests/preview-worker.mjs` é exclusivamente local: SQLite descartável e identidades fictícias. Adapta cookies Secure e X-Frame-Options apenas no transporte HTTP de QA para permitir a prévia embutida. As respostas do Worker real e suas proteções continuam cobertas pelos testes e inalteradas. O servidor de QA não é entrypoint do deploy nem fica em public/.

## Edifícios: fórmula e pendência comprovada

Modelo existente preservado:

`compra[recurso] = Σ (alvo − atual) × base[recurso] × multiplicador informado`

`manutenção diária[recurso] = Σ alvo × base[recurso] × 0,03`

| Edifício | Moedas | Couro | Ouro | NTE | Petróleo |
|---|---:|---:|---:|---:|---:|
| Escola | 100.000 | 400 | 440 | 300 | 0 |
| Base militar | 120.000 | 300 | 0 | 400 | 400 |
| Estrada | 100.000 | 500 | 0 | 400 | 400 |
| Hospital | 110.000 | 0 | 440 | 500 | 300 |

Exemplo aritmético: hospital 274→279, multiplicador1: 550.000 moedas, 2.200 ouro, 2.500 NTE e 1.500 petróleo. Multiplicador2 dobra somente a compra. Esses resultados comprovam a implementação aritmética, não a tarifa atual do servidor do jogo.

O relato de aumento de10% a cada25 prédios não fornece sozinho: base de contagem (tipo ou total), crescimento aditivo ou composto, tratamento de compras que cruzam faixa, arredondamento e efeito na manutenção. Buscas públicas não retornaram documentação verificável; a antiga wiki redirecionou para a entrada do jogo ou ficou inacessível. Não foi inventada uma regra substituta.

Correção aplicada ao texto público: deixou de apresentar esse relato como confirmação do jogo e esclarece que o multiplicador manual afeta a compra, não a manutenção. Cálculo automático por faixas permanece **Em validação**.

Evidência necessária, sem gastar recursos: capturas de prévias do jogo para1 e várias unidades do mesmo edifício, mostrando quantidade atual, custo em cada recurso, total de prédios considerado e manutenção exibida. Uma prévia que atravesse uma faixa e outra que não atravesse permitem distinguir as hipóteses. Não é necessário construir ou fornecer credenciais.

## Publicação e versão

- O endpoint público `/api/release` retornou `homologacao-20261027-catalog-v3`, baseRevision `bbb5d65...`. Esse marcador estava fixo no código; **não comprova o SHA nem o ID da versão ativa no Cloudflare**. A interface servida é compatível com o asset antigo identificado no repositório, sem prova suficiente para afirmar que o deploy está atrasado.
- Novo marcador preparado: `platform-homologation-20261102-v1`, com a base auditada identificada. Continua sendo marcador da aplicação, não ID do provedor.
- `wrangler 4.156.2 deploy --dry-run` aprovado; bindings originais DB e ASSETS preservados, sem migração ou substituição do D1. O dry-run não publica.
- `wrangler whoami`: não autenticado. Sites não contém projeto correspondente disponível. Não foi criado Worker temporário, duplicado o site ou trocado o banco para contornar a ausência de acesso.
- PR de correções preparado para CI/revisão. Deploy, verificação da versão ativa e testes pós-publicação permanecem pendentes de acesso Cloudflare autorizado ou do pipeline existente confirmado.
- Após CI verde e revisão: publicar o commit aprovado no Worker `academia`; registrar ID da versão ativa; verificar /api/release, /admin, /ferramentas, currículo e Minha Academia em navegador normal. Testes de gravação remota somente com contas QA identificadas. Não alterar permissões ou registros reais. Rollback por reversão do commit, sem restaurar/substituir o banco.

## Dependências do responsável, em prioridade

1. Disponibilizar o caminho de publicação já autorizado no Cloudflare (sessão/conexão segura ou pipeline existente), para publicar e confirmar versão e testes finais. Não enviar tokens/senhas pelo chat.
2. Fornecer as prévias de edifícios descritas acima para validar a regra de faixas e manutenção. A aritmética atual está testada; a mecânica automática ainda não.
3. Se desejar validação integral de sessão/cookies no ambiente real: disponibilizar duas contas QA e uma conta administrativa adicional já configurada, sem elevar privilégios ou usar contas de alunos reais. Esta etapa não foi declarada concluída.

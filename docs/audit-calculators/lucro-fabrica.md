# Lucro de fábrica — equivalência funcional

Base: 856eaf9. Implementação independente, baseada somente em observação de entradas e saídas da ferramenta https://diptools.blogspot.com/p/earn.html. Nenhum código, texto ou desenho da referência foi copiado. A referência não é mencionada na interface pública.

## Alteração

A interface anterior era um demonstrativo contábil do proprietário (unidades × preço menos insumos, salários, custos e imposto). Não havia equivalência semântica com a referência, que projeta ganhos do trabalhador. A interface Lucro de fábrica passa a oferecer horas, EP/HP ou orçamento de diamantes; cinco faixas de saúde; cinco tipos de fábrica; salário ou produção informada; cotação opcional de recursos; acordo de bônus proporcional; conversão opcional por milhão de moedas; atalhos de tempo; detalhamento de resultados e restauração.

O motor contábil anterior continua exportado por compatibilidade; os outros sete motores e seus formulários permanecem preservados. Rendimento do trabalhador continua descartando trabalhos incompletos. Lucro de fábrica usa projeção contínua: essa diferença é explícita no formulário e nos resultados.

## Fórmulas observadas

H = horas; J = trabalhos equivalentes; R = regeneração por ciclo de 6 minutos.

- Horas: J = 6H. EP: J = EP/100. Orçamento D: J = D / ((100 − 10R/6)/5).
- EP = 100J; H = J/6; regeneração = 10HR.
- Diamantes gastos = máximo(0, (EP − regeneração)/5), sem arredondamento intermediário.
- Diamantes ganhos = 20J somente em fábrica de diamantes.
- Recursos = J × produção informada, somente em remuneração por produção.
- Moedas = J × salário OU recursos × cotação opcional, mais EP/faixa × bônus.
- Moedas por trabalho = moedas/J, ou zero se J = 0.
- Conversão estimada = moedas/1.000.000 × cotação fornecida. Sem cotação dos recursos, conversão indisponível no modo produção.

## Observações comparadas

| Cenário | Resultado observado na referência e reproduzido |
|---|---|
| Diamantes, 24h, regeneração 7, salário 50.000, sem bônus | 144 trabalhos; 14.400 EP; 1.680 HP; gasto 2.544; ganho 2.880; saldo +336; moedas 7.200.000 |
| Mesmo cenário, 1h | 6 trabalhos; 70 HP; gasto 106; ganho 120; saldo +14; moedas 300.000 |
| 24h, bônus 10.000/100EP, conversão 5 por milhão | Bônus 1.440.000; moedas 8.640.000; conversão 43,20 |
| Ouro, produção 12/trabalho, cotação 250, 1h, regeneração 3, bônus 5.000.000/1.000EP | 72 recursos; valor 18.000; bônus 3.000.000; total 3.018.000; gasto 114; conversão 15,09 |
| Mesmo cenário por 550EP | 5,5 trabalhos; gasto 104,5; 66 recursos; moedas 2.766.500 |
| Mesmo cenário por orçamento 100 diamantes | 5,26315789 trabalhos; moedas 2.647.368,42105263. Referência exibe trabalhos com uma casa e moedas inteiras; Academia mantém até duas casas na apresentação. |
| Outras fábricas com salário 50.000, 0,25h, regeneração 7 e bônus 5.000.000/1.000EP | 1,5 trabalhos; 150EP; 17,5HP (referência exibe18); gasto26,5; salário75.000; bônus750.000 |

## Validação e segurança

- `node tests/factory-profit.mjs`: 55 casos aprovados; nenhum reprovado. Inclui sete cenários observados, zero, ausência de cotação, campos inativos, 25 combinações saúde/tipo com ida e volta entre horas/orçamento, inválidos e precisão extrema.
- `node --check` nos dois scripts e `git diff --check`: aprovados.
- Comparação estrutural das funções exportadas anteriores: todas idênticas à base. Worker, configuração Workers e student-hub sem diferença. Os 407 testes históricos não foram repetidos nesta execução.
- Navegador na prévia: padrão24h; diamantes1h; produção1h com cotação/bônus; campo vazio; reset e atalho1h aprovados. Sem erro de aplicação observado. Emulação de dispositivo móvel não disponível nesta sessão; CSS responsivo existente preservado.
- O novo cálculo é local, puro e sem rede, persistência, HTML dinâmico inseguro ou acesso a dados reais. Interface usa textContent. Nenhuma migração, alteração de autenticação, D1 ou R2.
- A suíte nova foi adicionada ao workflow existente de CI; o resultado remoto deve ser verificado no PR.

## Limitações e publicação

Equivalência funcional não confirma regras oficiais do Diplomacia. Permanecem por confirmar: 6 trabalhos/hora, 100EP/trabalho, recuperação de5HP por diamante, faixas de regeneração, ganho20 diamantes/trabalho e proporcionalidade do bônus. A projeção não simula HP inicial, armazenamento, pausas ou impostos. Quantidade produzida e preços nunca são inferidos. Não há garantia de conversibilidade de moeda virtual.

Produção não publicada nesta etapa: pedido foi preparar publicação. Aguardar revisão/merge do PR e autorização de deploy. Antes de publicar: CI verde, `wrangler deploy --dry-run` em ambiente com Wrangler instalado, deploy com credenciais já existentes, teste normal de /ferramentas (incluindo acesso estabelecido), teste de Minha Academia e confirmação da versão. Não alterar bindings nem executar migrações. Rollback: reverter o commit desta alteração. Estado público beta da base preservado; nenhum controle de acesso foi ampliado.

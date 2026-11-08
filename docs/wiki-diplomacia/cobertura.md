# Relatório de cobertura e acesso

Consulta: **08/11/2026**, America/Sao_Paulo. Código comparado: [`5aa14c1`](https://github.com/dinastia-velarian/academia/blob/5aa14c13e83100e8943343ee7ecbce50457dbf6b/). Relatórios anteriores: [`757865d`](https://github.com/dinastia-velarian/academia/blob/757865d9e358a5071aa1ff7e7d4d54503bb4c4db/docs/auditorias/).

**Coleta bloqueada e não concluída: zero páginas oficiais lidas nesta execução.** Não há regras atuais oficialmente confirmadas nesta base. Links de investigação e afirmações do repositório não são documentação oficial.

## Contagem honesta

| Indicador | Resultado |
|---|---|
| URL inicial fornecida pelo usuário | 1 |
| Páginas de conteúdo descobertas pela navegação nesta execução | 0 |
| Categorias, subcategorias e traduções enumeradas | Não determinado |
| Total de páginas públicas da wiki | Não determinado |
| Páginas oficiais efetivamente recebidas e lidas | **0** |
| Destinos oficiais tentados nesta execução | **1**, a URL inicial |
| Destinos tentados e não acessíveis | **1**, bloqueado no proxy |
| Pistas históricas de páginas em relatórios locais | 7; não reconsultadas |
| Percentual de cobertura da wiki | **Indeterminável**, pois o universo é desconhecido |

## Registro da tentativa atual

| Campo | Evidência |
|---|---|
| URL solicitada | https://wiki.diplomacia.com.tr/wiki/Main_Page |
| Operação | GET, `curl -sS -L --max-time 20`, proxy e TLS herdados |
| Primeira tentativa no sandbox | código curl 7: `Failed to connect to proxy port 8080 after 0 ms: Could not connect to server` |
| Repetição fora do sandbox, pelo fluxo aprovado | código curl 56: `CONNECT tunnel failed, response 403` |
| Status do túnel | `HTTP/1.1 403 Forbidden` |
| Cabeçalhos do proxy | `server: envoy`; `content-type: text/plain`; `content-length: 16`; `connection: close` |
| Data do cabeçalho | `Sun, 08 Nov 2026 03:31:23 GMT`, equivalente a **08/11/2026 00:31:23** em São Paulo |
| HTML, título e revisão da wiki | Não recebidos |
| URL final após redirecionamentos | Não determinada; nenhum redirecionamento do destino foi recebido |

O 403 é uma recusa do proxy antes do acesso ao servidor da wiki. Não comprova que a wiki esteja fora do ar, exija login ou rejeite o usuário. Não foi possível verificar licença, robots, sitemap, API ou páginas especiais. Não foram tentadas rotas presumidas para contornar a recusa de todo o domínio.

## Configurações do Codex verificadas

A skill `cloud-environment-runtime` e sua referência de rede foram consultadas. O status do ambiente indicou conexão ativa, observações atuais, política **restricted/enforced**, revisão em execução **1** e lista de domínios customizados vazia. O arquivo `/etc/codex/network-policy.json` também não inclui `wiki.diplomacia.com.tr` na lista de saída.

O rascunho de configuração, revisão **5**, já inclui `wiki.diplomacia.com.tr`, `academia.velarian.workers.dev`, `api.github.com` e `api.cloudflare.com`. **Rascunho salvo não equivale a política aplicada.** Não foi necessário adicionar domínios repetidos ou modificar credenciais. A ferramenta de alteração imediata do ambiente não está disponível nesta sessão.

A ação externa necessária é aplicar/salvar a configuração pelo fluxo de configurações do ambiente e verificar novamente o status da instância; publicar a configuração reutilizável, se exigido pelo produto, é diferente de publicar o site. A pesquisa pública da wiki não requer token Cloudflare. Não enviar tokens, cookies ou senhas em chat.

## Pistas de páginas: fora da cobertura lida

Os sete links abaixo provêm do relatório anterior; os títulos são seus rótulos locais, sem tradução oficial validada. Revisões históricas não comprovam a versão corrente. Todos estão **pendentes, sem nova tentativa individual**, porque o túnel para o domínio foi negado.

| Rótulo histórico | URL registrada | Situação |
|---|---|---|
| Perfil | https://wiki.diplomacia.com.tr/index.php?title=Profil_Bilgileri&oldid=361 | Pista não consultada |
| Nível | https://wiki.diplomacia.com.tr/index.php?title=Seviye&oldid=134 | Pista não consultada |
| Unidades e armas | https://wiki.diplomacia.com.tr/index.php?title=Unidades_%26_Armas&oldid=86 | Pista não consultada |
| Trabalho em português | https://wiki.diplomacia.com.tr/index.php?title=Sistema_de_Trabalho&oldid=80 | Pista não consultada |
| Trabalho em turco | https://wiki.diplomacia.com.tr/index.php?title=%C3%87al%C4%B1%C5%9Fma_Sistemi&oldid=363 | Pista não consultada |
| Tipos de fábrica | https://wiki.diplomacia.com.tr/index.php?title=Tipos_de_F%C3%A1brica&oldid=82 | Pista não consultada |
| Criação de fábrica | https://wiki.diplomacia.com.tr/index.php?title=Criar_F%C3%A1brica&oldid=81 | Pista não consultada |

Origem: [inventário anterior](https://github.com/dinastia-velarian/academia/blob/757865d9e358a5071aa1ff7e7d4d54503bb4c4db/docs/auditorias/inventario-wiki-diplomacia.md). Estes oito URLs conhecidos, incluindo o endereço inicial, não constituem inventário de todas as páginas da wiki.

## Retomada

Após a liberação, abrir nova conexão e registrar o novo resultado. Se funcionar, aplicar o [método de enumeração e leitura](metodologia.md). Se permanecer bloqueado, usar [exportação pelo navegador](exportacao-navegador.md). Não marcar esta cobertura como completa até enumerar o universo e contabilizar cada página e idioma.

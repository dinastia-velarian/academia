# Academia Velarian

Portal público de ensino de Diplomacia, com contas opcionais de alunos e administração privada.

## Funcionalidades

- Conteúdos e vídeos públicos, sem cadastro obrigatório.
- Cadastro e login de alunos em `/#minha-academia`, com progresso persistido por conta.
- Administração em `/admin`, com autenticação, papéis e permissões verificadas no servidor.
- Certificação: mínimo de 80% das aulas disponíveis, calculado pelo servidor com arredondamento para cima. Nível 50, habilidades 100 e pagamento em moeda do jogo dependem de conferência administrativa.
- Pedidos pendentes ou aprovados não podem ser duplicados; pedidos rejeitados podem ser reenviados mantendo o registro e código.
- Após aprovação, o PDF personalizado é gerado automaticamente e disponibilizado somente na sessão do aluno correspondente. A verificação pública por código informa apenas certificados aprovados.

## Implantação

Cloudflare Workers + D1. `wrangler.jsonc` publica `public/` e mantém o binding `DB` existente. **Não execute DROP TABLE, não recrie e não substitua o banco de produção.** As rotas `/admin`, `/admin/` e `/admin.html` devem passar pelo Worker antes do atendimento de arquivos estáticos.

A existência de um commit no GitHub não comprova o deploy. Confirme no Cloudflare a revisão implantada, a versão ativa e os logs. Este repositório não possui workflows de GitHub Actions na revisão auditada; uma integração de build no Cloudflare, se houver, deve ser confirmada no painel do provedor.

Não altere credenciais, segredos ou permissões existentes durante homologação sem autorização do responsável.

## Testes locais seguros

Requer Node.js 24, com `node:sqlite`. Sem dependências externas e sem conexão com produção:

```bash
node tests/audit.mjs
node tests/student-ui.mjs
```

Os testes usam SQLite em memória, dados fictícios e contas administrativas criadas apenas nesse banco temporário. Resultados e PDF de teste são gravados no diretório temporário do sistema; `AUDIT_OUTPUT_DIR` permite escolher outro destino.

O adaptador D1 local valida a lógica SQL e as respostas do Worker, mas não substitui testes do runtime Cloudflare, D1 remoto, cookies no navegador ou permissões reais.

## Homologação em produção

Use duas contas de teste identificadas como QA. Verifique cadastro, login, logout, persistência, isolamento, fronteira de 80%, rejeição e reenvio, aprovação e download de PDF. Não utilize dados ou pedidos reais. Faça o teste administrativo com uma sessão existente autorizada, sem criar privilégios adicionais. Registre a revisão e versão ativa do Worker antes e depois do deploy.

# Academia Velarian — portal público com administração privada

## Funcionalidades
- Guias, tópicos e vídeos públicos sem cadastro de alunos.
- Área administrativa restrita a Victor Velarian em `/#login` (link discreto no rodapé).
- Certificados opcionais: solicitação, pagamento em dinheiro do jogo e entrega manual via Telegram [@victoremc](https://t.me/victoremc).
- Edição de conteúdo, imagens, doações e taxa de certificados pelo painel administrativo.
- API `/api/register` bloqueada com HTTP 403.

## Implantação
Cloudflare Workers + D1. `wrangler.jsonc` publica a pasta `public/`. Mantenha o binding `DB` e a base de dados existentes. **Não execute DROP TABLE e não substitua o banco de produção.**

Após confirmar que o login do administrador funciona, remova o segredo `ADMIN_SETUP_TOKEN` das configurações do Worker. O usuário já criado é preservado.

## Diagnóstico do login
Se ocorrer erro 500, examine os logs do Worker. Esta versão registra `ADMIN_LOGIN_HASH_ERROR` ou `ADMIN_LOGIN_SESSION_ERROR` para separar problemas de senha e sessão, sem expor segredos ao visitante.

## Segurança
O sistema não permite mais cadastro de alunos. Para maior segurança, use uma senha administrativa longa e exclusiva.

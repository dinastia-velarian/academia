# Academia Velarian — Worker + D1

## Antes de publicar
- Faça backup da branch `main`.
- Banco D1 existente: `academia-velarian-db` (as tabelas já foram criadas).
- Arquivos do site estão em `public/`. O código de servidor está em `worker.js`.
- `wrangler.jsonc` inclui o binding `DB` e o ID do banco exibido na captura de tela. Confirme que pertence à conta correta.

## Publicar via GitHub / Cloudflare Workers
1. Na branch de desenvolvimento, envie **o conteúdo desta pasta** para a raiz do repositório, incluindo `worker.js`, `wrangler.jsonc`, `schema.sql` e `public/`. Não deixe um `index.html` antigo na raiz.
2. No Cloudflare Workers & Pages > academia > Configurações > Compilações, mantenha comando de build vazio e comando de implantação `npx wrangler deploy`; diretório raiz `/`.
3. A implantação via GitHub deverá usar `wrangler.jsonc`, criar Worker com código e binding D1. Confira logs e faça testes antes de liberar.
4. Verifique `https://academia.velarian.workers.dev/api/public` — deve retornar JSON com `settings` e `content`, não HTML nem erro 500.
5. No painel Cloudflare, Worker > Configurações > Variáveis e segredos, adicione segredo **ADMIN_SETUP_TOKEN** com valor aleatório longo e privado (não o coloque no GitHub).
6. Abra `/setup.html`, informe o token e escolha uma senha forte para o usuário `Victor Velarian`. Não compartilhe senha/token em prints ou chat.
7. **Remova o segredo ADMIN_SETUP_TOKEN** após criar o administrador. Faça login no menu do site.

## Segurança e limitações
- O site não verifica automaticamente se o nome cadastrado pertence à conta do jogo.
- Certificados e cobrança automática não estão implementados; taxa é somente informativa.
- Cadastro sem e-mail não tem recuperação automática de senha.
- Upload de imagens fica no D1, limitado a 2 MB por arquivo.
- Não exponha token de setup, senha ou cookies.
- Teste em branch de prévia quando possível; publicar em `main` pode alterar imediatamente o site público.

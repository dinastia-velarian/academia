# Academia Velarian

Site público e gratuito para ensinar jogadores do Diplomacia.

## Publicar no Cloudflare Pages

1. Envie os arquivos deste projeto para a raiz do repositório `academia-velarian` no GitHub (incluindo a pasta `assets`).
2. No painel Cloudflare, acesse **Workers & Pages** → **Create application** → **Pages** → **Connect to Git** (a nomenclatura pode variar).
3. Autorize o acesso ao GitHub e selecione o repositório `vemc1201-design/academia-velarian`.
4. Configure a implantação de site estático: **Framework preset: None**, **Build command: em branco**, **Build output directory: /** (raiz). Se a interface exigir uma pasta de saída, use `.`.
5. Clique em **Save and Deploy**. O endereço `*.pages.dev` será criado conforme o nome disponível.

## Editar cursos

Os cursos e suas aulas estão no array `courses` em `script.js`. A versão inicial é um catálogo navegável: **os vídeos e o conteúdo detalhado das aulas ainda não estão publicados**. O brasão está em `assets/brasao-referencia.png`.

## Tecnologias

HTML, CSS e JavaScript puro. Não exige build, cadastro ou banco de dados.

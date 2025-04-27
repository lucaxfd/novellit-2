# Novellit - Backend

Backend para a plataforma de novels Novellit, desenvolvido com Node.js, Express e SQLite.

## Funcionalidades

- Autenticação de usuários com JWT
- CRUD de novels e capítulos
- Sistema de visualizações
- Sistema de favoritos
- Sistema de comentários
- Paginação e ordenação de novels
- Rotas protegidas para autores

## Requisitos

- Node.js 14+
- npm ou yarn

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Crie um arquivo `.env` baseado no `.env.example`:
```bash
cp .env.example .env
```

4. Configure as variáveis de ambiente no arquivo `.env`

5. Inicie o servidor:
```bash
npm start
```

Para desenvolvimento:
```bash
npm run dev
```

## Estrutura do Projeto

```
src/
├── index.js          # Ponto de entrada da aplicação
├── database.js       # Configuração do banco de dados
├── middleware/       # Middlewares
│   └── auth.js       # Middleware de autenticação
└── routes/           # Rotas da API
    ├── auth.js       # Rotas de autenticação
    ├── novels.js     # Rotas de novels
    └── chapters.js   # Rotas de capítulos
```

## API Endpoints

### Autenticação

- `POST /auth/register` - Registrar novo usuário
- `POST /auth/login` - Login de usuário

### Novels

- `GET /novels` - Listar novels (com paginação)
- `GET /novels/:id` - Obter detalhes de uma novel
- `POST /novels` - Criar nova novel (protegido)
- `PUT /novels/:id` - Atualizar novel (protegido)
- `DELETE /novels/:id` - Deletar novel (protegido)
- `POST /novels/:id/favorite` - Favoritar/desfavoritar novel
- `GET /novels/:id/comments` - Listar comentários de uma novel
- `POST /novels/:id/comments` - Adicionar comentário a uma novel

### Capítulos

- `GET /chapters/novel/:novelId` - Listar capítulos de uma novel
- `GET /chapters/:id` - Obter detalhes de um capítulo
- `POST /chapters` - Criar novo capítulo (protegido)
- `PUT /chapters/:id` - Atualizar capítulo (protegido)
- `DELETE /chapters/:id` - Deletar capítulo (protegido)

## Segurança

- Todas as rotas protegidas requerem token JWT válido
- Senhas são hasheadas com bcrypt
- Prepared statements para prevenir SQL injection
- Validação de dados com express-validator

## Licença

MIT 
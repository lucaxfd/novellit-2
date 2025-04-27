const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const config = require('./config');
const sequelize = require('./config/database');
const User = require('./models/User');
const subscriptionRoutes = require('./routes/subscription');
const authRoutes = require('./routes/auth');

const app = express();

// Configuração do CORS
app.use(cors({
    origin: 'http://localhost:3001', // URL do seu frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Log de requisições
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Teste de conexão com o banco de dados
sequelize.authenticate()
    .then(() => {
        console.log('Conectado ao banco de dados SQLite');
    })
    .catch(err => {
        console.error('Erro ao conectar ao banco de dados:', err);
    });

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false,
            error: 'Token não fornecido' 
        });
    }

    jwt.verify(token, config.jwtSecret, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false,
                error: 'Token inválido' 
            });
        }
        req.user = user;
        next();
    });
};

// Rotas de autenticação
app.use('/api/auth', authRoutes);

// Rotas de assinatura
app.use('/api/subscription', authenticateToken, subscriptionRoutes);

// Rotas para páginas HTML
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/register.html'));
});

app.get('/publish', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/publish.html'));
});

app.get('/subscription', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/subscription.html'));
});

app.get('/payment', (req, res) => {
    const plan = req.query.plan;
    if (!plan) {
        return res.redirect('/subscription');
    }
    res.sendFile(path.join(__dirname, '../public/payment.html'));
});

app.get('/novels', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/novels.html'));
});

app.get('/novel/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/novel.html'));
});

// Rotas da API

// Criar nova novel
app.post('/api/novels', authenticateToken, (req, res) => {
    const { title, description, cover_url } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Título é obrigatório' });
    }

    sequelize.run(
        'INSERT INTO novels (title, description, cover_url, author_id) VALUES (?, ?, ?, ?)',
        [title, description, cover_url, req.user.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao criar novel' });
            }

            res.status(201).json({ id: this.lastID });
        }
    );
});

// Listar novels
app.get('/api/novels', async (req, res) => {
    try {
        const novels = await sequelize.query(
            `SELECT n.*, u.username as author_name 
             FROM novels n 
             JOIN users u ON n.author_id = u.id 
             ORDER BY n.created_at DESC`,
            { type: sequelize.QueryTypes.SELECT }
        );
        res.json(novels);
    } catch (err) {
        console.error('Erro ao buscar novels:', err);
        res.status(500).json({ error: 'Erro ao buscar novels' });
    }
});

// Buscar novel por ID
app.get('/api/novels/:id', async (req, res) => {
    try {
        const novelId = req.params.id;
        const novel = await sequelize.query(
            `SELECT n.*, u.username as author_name 
             FROM novels n 
             JOIN users u ON n.author_id = u.id 
             WHERE n.id = ?`,
            {
                replacements: [novelId],
                type: sequelize.QueryTypes.SELECT
            }
        );

        if (!novel || novel.length === 0) {
            return res.status(404).json({ error: 'Novel não encontrada' });
        }

        res.json(novel[0]);
    } catch (err) {
        console.error('Erro ao buscar novel:', err);
        res.status(500).json({ error: 'Erro ao buscar novel' });
    }
});

// Adicionar capítulo
app.post('/api/novels/:id/chapters', authenticateToken, (req, res) => {
    const novelId = req.params.id;
    const { title, content, number } = req.body;

    if (!title || !content || !number) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    sequelize.run(
        'INSERT INTO chapters (novel_id, title, content, number) VALUES (?, ?, ?, ?)',
        [novelId, title, content, number],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao adicionar capítulo' });
            }
            res.status(201).json({ id: this.lastID });
        }
    );
});

// Listar capítulos de uma novel
app.get('/api/novels/:id/chapters', (req, res) => {
    const novelId = req.params.id;

    sequelize.all(
        'SELECT * FROM chapters WHERE novel_id = ? ORDER BY number ASC',
        [novelId],
        (err, chapters) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao buscar capítulos' });
            }
            res.json(chapters);
        }
    );
});

// Adicionar comentário
app.post('/api/novels/:id/comments', authenticateToken, (req, res) => {
    const novelId = req.params.id;
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Conteúdo é obrigatório' });
    }

    sequelize.run(
        'INSERT INTO comments (novel_id, user_id, content) VALUES (?, ?, ?)',
        [novelId, req.user.id, content],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao adicionar comentário' });
            }
            res.status(201).json({ id: this.lastID });
        }
    );
});

// Listar comentários de uma novel
app.get('/api/novels/:id/comments', (req, res) => {
    const novelId = req.params.id;

    sequelize.all(
        `SELECT c.*, u.username 
         FROM comments c 
         JOIN users u ON c.user_id = u.id 
         WHERE c.novel_id = ? 
         ORDER BY c.created_at DESC`,
        [novelId],
        (err, comments) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao buscar comentários' });
            }
            res.json(comments);
        }
    );
});

// Adicionar aos favoritos
app.post('/api/novels/:id/favorite', authenticateToken, (req, res) => {
    const novelId = req.params.id;

    sequelize.run(
        'INSERT INTO favorites (user_id, novel_id) VALUES (?, ?)',
        [req.user.id, novelId],
        function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(400).json({ error: 'Novel já está nos favoritos' });
                }
                return res.status(500).json({ error: 'Erro ao adicionar aos favoritos' });
            }
            res.status(201).json({ message: 'Adicionado aos favoritos' });
        }
    );
});

// Remover dos favoritos
app.delete('/api/novels/:id/favorite', authenticateToken, (req, res) => {
    const novelId = req.params.id;

    sequelize.run(
        'DELETE FROM favorites WHERE user_id = ? AND novel_id = ?',
        [req.user.id, novelId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao remover dos favoritos' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Novel não encontrada nos favoritos' });
            }
            res.json({ message: 'Removido dos favoritos' });
        }
    );
});

// Rota básica de teste
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({ 
        success: false,
        error: 'Erro interno do servidor' 
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 
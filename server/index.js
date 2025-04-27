const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, generateToken, hashPassword, verifyPassword } = require('./auth');
const cors = require('cors');

const prisma = new PrismaClient();
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Constantes
const VIEW_VALUE = 0.01; // Valor por visualização em reais

// Rotas públicas
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Verifica se o email já existe
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }
        
        const hashedPassword = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                avatar: name.charAt(0).toUpperCase()
            }
        });

        const token = generateToken(user.id);
        res.json({ user, token });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(400).json({ error: 'Erro ao criar usuário' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const isValidPassword = await verifyPassword(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = generateToken(user.id);
        res.json({ user, token });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(400).json({ error: 'Erro ao fazer login' });
    }
});

// Rotas protegidas
app.get('/api/user', authenticateToken, async (req, res) => {
    res.json(req.user);
});

app.get('/api/novels', async (req, res) => {
    try {
        const novels = await prisma.novel.findMany({
            include: {
                author: {
                    select: {
                        name: true,
                        avatar: true
                    }
                }
            }
        });
        res.json(novels);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar novels' });
    }
});

app.post('/api/novels', authenticateToken, async (req, res) => {
    try {
        const { title, description, coverImage } = req.body;
        const novel = await prisma.novel.create({
            data: {
                title,
                description,
                coverImage,
                authorId: req.user.id
            }
        });
        res.json(novel);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar novel' });
    }
});

app.get('/api/novels/:id', async (req, res) => {
    try {
        const novel = await prisma.novel.findUnique({
            where: { id: req.params.id },
            include: {
                author: {
                    select: {
                        name: true,
                        avatar: true
                    }
                },
                chapters: {
                    orderBy: {
                        order: 'asc'
                    }
                }
            }
        });
        res.json(novel);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar novel' });
    }
});

app.post('/api/novels/:id/chapters', authenticateToken, async (req, res) => {
    try {
        const { title, content, order } = req.body;
        const chapter = await prisma.chapter.create({
            data: {
                title,
                content,
                order,
                novelId: req.params.id
            }
        });
        res.json(chapter);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar capítulo' });
    }
});

app.get('/api/chapters/:id', async (req, res) => {
    try {
        const chapter = await prisma.chapter.findUnique({
            where: { id: req.params.id },
            include: {
                novel: {
                    select: {
                        title: true,
                        author: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });
        res.json(chapter);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar capítulo' });
    }
});

app.post('/api/chapters/:id/view', authenticateToken, async (req, res) => {
    try {
        const view = await prisma.view.create({
            data: {
                userId: req.user.id,
                chapterId: req.params.id,
                novelId: req.body.novelId
            }
        });
        res.json(view);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao registrar visualização' });
    }
});

app.post('/api/novels/:id/reading-list', authenticateToken, async (req, res) => {
    try {
        const readingList = await prisma.readingList.create({
            data: {
                userId: req.user.id,
                novelId: req.params.id
            }
        });
        res.json(readingList);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao adicionar à lista de leitura' });
    }
});

app.get('/api/user/reading-list', authenticateToken, async (req, res) => {
    try {
        const readingList = await prisma.readingList.findMany({
            where: { userId: req.user.id },
            include: {
                novel: {
                    include: {
                        author: {
                            select: {
                                name: true,
                                avatar: true
                            }
                        }
                    }
                }
            }
        });
        res.json(readingList);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar lista de leitura' });
    }
});

app.get('/api/user/novels', authenticateToken, async (req, res) => {
    try {
        const novels = await prisma.novel.findMany({
            where: { authorId: req.user.id },
            include: {
                _count: {
                    select: {
                        views: true
                    }
                }
            }
        });

        const novelsWithEarnings = novels.map(novel => ({
            ...novel,
            earnings: novel._count.views * VIEW_VALUE
        }));

        res.json(novelsWithEarnings);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar novels do usuário' });
    }
});

// Rotas para páginas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/register.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/novel/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/novel.html'));
});

app.get('/chapter/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/chapter.html'));
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
}); 
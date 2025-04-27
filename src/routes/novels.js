const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../database');
const { isAuthor } = require('../middleware/auth');

// Validação de novel
const novelValidation = [
    body('title').notEmpty().withMessage('Título é obrigatório'),
    body('description').notEmpty().withMessage('Descrição é obrigatória'),
    body('cover_image').optional().isURL().withMessage('URL da capa inválida')
];

// Listar novels (público)
router.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const orderBy = req.query.orderBy || 'created_at';
    const order = req.query.order || 'DESC';

    const validOrderBy = ['created_at', 'views', 'rating'].includes(orderBy) ? orderBy : 'created_at';
    const validOrder = ['ASC', 'DESC'].includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

    const query = `
        SELECT n.*, u.username as author_name, 
               COUNT(DISTINCT v.id) as views,
               COUNT(DISTINCT c.id) as chapters_count
        FROM novels n
        LEFT JOIN users u ON n.author_id = u.id
        LEFT JOIN views v ON n.id = v.novel_id
        LEFT JOIN chapters c ON n.id = c.novel_id
        GROUP BY n.id
        ORDER BY ${validOrderBy} ${validOrder}
        LIMIT ? OFFSET ?
    `;

    db.all(query, [limit, offset], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar novels' });
        }

        // Contar total de novels para paginação
        db.get('SELECT COUNT(*) as total FROM novels', (err, count) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao contar novels' });
            }

            res.json({
                novels: rows,
                pagination: {
                    total: count.total,
                    page,
                    limit,
                    totalPages: Math.ceil(count.total / limit)
                }
            });
        });
    });
});

// Obter detalhes de uma novel (público)
router.get('/:id', (req, res) => {
    const novelId = req.params.id;

    // Registrar visualização
    db.run('INSERT INTO views (novel_id, user_id) VALUES (?, ?)', 
        [novelId, req.user?.id || null]);

    // Atualizar contador de visualizações
    db.run('UPDATE novels SET views = views + 1 WHERE id = ?', [novelId]);

    // Buscar detalhes da novel
    const query = `
        SELECT n.*, u.username as author_name,
               COUNT(DISTINCT v.id) as views,
               COUNT(DISTINCT c.id) as chapters_count
        FROM novels n
        LEFT JOIN users u ON n.author_id = u.id
        LEFT JOIN views v ON n.id = v.novel_id
        LEFT JOIN chapters c ON n.id = c.novel_id
        WHERE n.id = ?
        GROUP BY n.id
    `;

    db.get(query, [novelId], (err, novel) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar novel' });
        }

        if (!novel) {
            return res.status(404).json({ error: 'Novel não encontrada' });
        }

        res.json(novel);
    });
});

// Criar nova novel (protegido)
router.post('/', novelValidation, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, cover_image } = req.body;

    db.run(
        'INSERT INTO novels (title, description, cover_image, author_id) VALUES (?, ?, ?, ?)',
        [title, description, cover_image, req.user.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao criar novel' });
            }

            res.status(201).json({
                id: this.lastID,
                title,
                description,
                cover_image,
                author_id: req.user.id
            });
        }
    );
});

// Atualizar novel (protegido)
router.put('/:id', isAuthor, novelValidation, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, cover_image } = req.body;
    const novelId = req.params.id;

    db.run(
        'UPDATE novels SET title = ?, description = ?, cover_image = ? WHERE id = ?',
        [title, description, cover_image, novelId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao atualizar novel' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Novel não encontrada' });
            }

            res.json({
                id: novelId,
                title,
                description,
                cover_image
            });
        }
    );
});

// Deletar novel (protegido)
router.delete('/:id', isAuthor, (req, res) => {
    const novelId = req.params.id;

    db.run('DELETE FROM novels WHERE id = ?', [novelId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Erro ao deletar novel' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Novel não encontrada' });
        }

        res.json({ message: 'Novel deletada com sucesso' });
    });
});

// Favoritar/Desfavoritar novel
router.post('/:id/favorite', (req, res) => {
    const novelId = req.params.id;

    // Verificar se já está favoritado
    db.get('SELECT id FROM favorites WHERE novel_id = ? AND user_id = ?', 
        [novelId, req.user.id], (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao verificar favorito' });
            }

            if (row) {
                // Desfavoritar
                db.run('DELETE FROM favorites WHERE id = ?', [row.id], (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Erro ao desfavoritar' });
                    }
                    res.json({ message: 'Novel desfavoritada' });
                });
            } else {
                // Favoritar
                db.run('INSERT INTO favorites (novel_id, user_id) VALUES (?, ?)',
                    [novelId, req.user.id], (err) => {
                        if (err) {
                            return res.status(500).json({ error: 'Erro ao favoritar' });
                        }
                        res.json({ message: 'Novel favoritada' });
                    });
            }
        });
});

// Comentários de uma novel
router.get('/:id/comments', (req, res) => {
    const novelId = req.params.id;

    const query = `
        SELECT c.*, u.username as author_name
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.novel_id = ?
        ORDER BY c.created_at DESC
    `;

    db.all(query, [novelId], (err, comments) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar comentários' });
        }

        res.json(comments);
    });
});

// Adicionar comentário
router.post('/:id/comments', (req, res) => {
    const novelId = req.params.id;
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Conteúdo do comentário é obrigatório' });
    }

    db.run(
        'INSERT INTO comments (novel_id, user_id, content) VALUES (?, ?, ?)',
        [novelId, req.user.id, content],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao adicionar comentário' });
            }

            res.status(201).json({
                id: this.lastID,
                content,
                author_name: req.user.username
            });
        }
    );
});

module.exports = router; 
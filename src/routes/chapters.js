const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../database');
const { isAuthor } = require('../middleware/auth');

// Validação de capítulo
const chapterValidation = [
    body('title').notEmpty().withMessage('Título é obrigatório'),
    body('content').notEmpty().withMessage('Conteúdo é obrigatório'),
    body('chapter_number').isInt({ min: 1 }).withMessage('Número do capítulo deve ser maior que 0')
];

// Listar capítulos de uma novel (público)
router.get('/novel/:novelId', (req, res) => {
    const novelId = req.params.novelId;

    const query = `
        SELECT c.*, u.username as author_name
        FROM chapters c
        JOIN users u ON c.novel_id = u.id
        WHERE c.novel_id = ?
        ORDER BY c.chapter_number ASC
    `;

    db.all(query, [novelId], (err, chapters) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar capítulos' });
        }

        res.json(chapters);
    });
});

// Obter um capítulo específico (público)
router.get('/:id', (req, res) => {
    const chapterId = req.params.id;

    const query = `
        SELECT c.*, u.username as author_name, n.title as novel_title
        FROM chapters c
        JOIN users u ON c.novel_id = u.id
        JOIN novels n ON c.novel_id = n.id
        WHERE c.id = ?
    `;

    db.get(query, [chapterId], (err, chapter) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar capítulo' });
        }

        if (!chapter) {
            return res.status(404).json({ error: 'Capítulo não encontrado' });
        }

        res.json(chapter);
    });
});

// Criar novo capítulo (protegido)
router.post('/', chapterValidation, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { novel_id, title, content, chapter_number } = req.body;

    // Verificar se o usuário é o autor da novel
    db.get('SELECT author_id FROM novels WHERE id = ?', [novel_id], (err, novel) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao verificar autor' });
        }

        if (!novel) {
            return res.status(404).json({ error: 'Novel não encontrada' });
        }

        if (novel.author_id !== req.user.id) {
            return res.status(403).json({ error: 'Apenas o autor pode adicionar capítulos' });
        }

        // Verificar se o número do capítulo já existe
        db.get('SELECT id FROM chapters WHERE novel_id = ? AND chapter_number = ?',
            [novel_id, chapter_number], (err, existingChapter) => {
                if (err) {
                    return res.status(500).json({ error: 'Erro ao verificar capítulo' });
                }

                if (existingChapter) {
                    return res.status(400).json({ error: 'Já existe um capítulo com este número' });
                }

                // Inserir novo capítulo
                db.run(
                    'INSERT INTO chapters (novel_id, title, content, chapter_number) VALUES (?, ?, ?, ?)',
                    [novel_id, title, content, chapter_number],
                    function(err) {
                        if (err) {
                            return res.status(500).json({ error: 'Erro ao criar capítulo' });
                        }

                        res.status(201).json({
                            id: this.lastID,
                            novel_id,
                            title,
                            content,
                            chapter_number
                        });
                    }
                );
            });
    });
});

// Atualizar capítulo (protegido)
router.put('/:id', isAuthor, chapterValidation, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const chapterId = req.params.id;
    const { title, content, chapter_number } = req.body;

    // Verificar se o número do capítulo já existe (exceto para o próprio capítulo)
    db.get('SELECT id FROM chapters WHERE novel_id = ? AND chapter_number = ? AND id != ?',
        [req.body.novel_id, chapter_number, chapterId], (err, existingChapter) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao verificar capítulo' });
            }

            if (existingChapter) {
                return res.status(400).json({ error: 'Já existe um capítulo com este número' });
            }

            // Atualizar capítulo
            db.run(
                'UPDATE chapters SET title = ?, content = ?, chapter_number = ? WHERE id = ?',
                [title, content, chapter_number, chapterId],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Erro ao atualizar capítulo' });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({ error: 'Capítulo não encontrado' });
                    }

                    res.json({
                        id: chapterId,
                        title,
                        content,
                        chapter_number
                    });
                }
            );
        });
});

// Deletar capítulo (protegido)
router.delete('/:id', isAuthor, (req, res) => {
    const chapterId = req.params.id;

    db.run('DELETE FROM chapters WHERE id = ?', [chapterId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Erro ao deletar capítulo' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Capítulo não encontrado' });
        }

        res.json({ message: 'Capítulo deletado com sucesso' });
    });
});

module.exports = router; 
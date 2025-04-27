const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_aqui';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }

        // Verificar se o usuário ainda existe no banco
        db.get('SELECT id, username, email FROM users WHERE id = ?', [user.id], (err, row) => {
            if (err || !row) {
                return res.status(403).json({ error: 'Usuário não encontrado' });
            }

            req.user = row;
            next();
        });
    });
};

const isAuthor = (req, res, next) => {
    const novelId = req.params.id || req.body.novel_id;
    
    db.get('SELECT author_id FROM novels WHERE id = ?', [novelId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao verificar autor' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Novel não encontrada' });
        }

        if (row.author_id !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado. Apenas o autor pode realizar esta ação' });
        }

        next();
    });
};

module.exports = {
    authenticateToken,
    isAuthor
}; 
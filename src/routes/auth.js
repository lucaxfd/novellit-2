const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_aqui';

// Validação de registro
const registerValidation = [
    body('name').isLength({ min: 3 }).withMessage('Nome deve ter pelo menos 3 caracteres'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres')
];

// Validação de login
const loginValidation = [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória')
];

// Registro de usuário
router.post('/register', registerValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        const { name, email, password } = req.body;

        // Verificar se o usuário já existe
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                error: 'Email já está em uso' 
            });
        }

        // Criar novo usuário
        const user = await User.create({
            name,
            email,
            password // A senha será hasheada automaticamente pelo modelo
        });

        // Gerar token
        const token = jwt.sign({ id: user.id }, JWT_SECRET);

        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao processar registro' 
        });
    }
});

// Login de usuário
router.post('/login', loginValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        const { email, password } = req.body;
        console.log('Tentativa de login para:', email);

        // Buscar usuário
        const user = await User.findOne({ where: { email } });
        if (!user) {
            console.log('Usuário não encontrado:', email);
            return res.status(401).json({ 
                success: false,
                error: 'Email ou senha inválidos' 
            });
        }

        // Verificar senha usando o método do modelo
        const validPassword = user.verifyPassword(password);
        if (!validPassword) {
            console.log('Senha inválida para:', email);
            return res.status(401).json({ 
                success: false,
                error: 'Email ou senha inválidos' 
            });
        }

        // Gerar token
        const token = jwt.sign({ id: user.id }, JWT_SECRET);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                subscriptionStatus: user.subscriptionStatus,
                subscriptionEndDate: user.subscriptionEndDate,
                subscriptionPlan: user.subscriptionPlan
            }
        });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao processar login' 
        });
    }
});

module.exports = router; 
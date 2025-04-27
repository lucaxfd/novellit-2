const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { Op } = require('sequelize');

// Preços das assinaturas
const SUBSCRIPTION_PRICES = {
    weekly: 5.00,
    monthly: 15.00,
    yearly: 150.00
};

// Links do PagBank para cada plano
const PAGBANK_LINKS = {
    weekly: 'https://pag.ae/7_Bg6XFjp',  // Link para plano semanal
    monthly: 'https://pag.ae/7_Bgp6Z7M', // Link para plano mensal
    yearly: 'https://pag.ae/7_Bg6XFjp'   // Link para plano anual
};

// Rota para verificar o status da assinatura
router.get('/status', async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'Usuário não encontrado' 
            });
        }

        res.json({
            success: true,
            isSubscribed: user.subscriptionStatus === 'active',
            subscriptionEndDate: user.subscriptionEndDate,
            subscriptionPlan: user.subscriptionPlan
        });
    } catch (error) {
        console.error('Erro ao verificar status da assinatura:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao verificar status da assinatura' 
        });
    }
});

// Rota para criar uma assinatura
router.post('/subscribe', async (req, res) => {
    try {
        const { plan } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'Usuário não encontrado' 
            });
        }

        // Verificar se o usuário já tem uma assinatura ativa
        if (user.subscriptionStatus === 'active' && new Date(user.subscriptionEndDate) > new Date()) {
            return res.status(400).json({ 
                success: false,
                error: 'Usuário já possui uma assinatura ativa' 
            });
        }

        // Verificar se o link do plano existe
        if (!PAGBANK_LINKS[plan]) {
            return res.status(400).json({ 
                success: false,
                error: 'Link de pagamento não disponível para este plano' 
            });
        }

        res.json({
            success: true,
            paymentLink: PAGBANK_LINKS[plan],
            amount: SUBSCRIPTION_PRICES[plan],
            plan
        });
    } catch (error) {
        console.error('Erro ao criar assinatura:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao criar assinatura' 
        });
    }
});

// Rota para confirmar o pagamento
router.post('/confirm-payment', async (req, res) => {
    try {
        const { paymentId, plan } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'Usuário não encontrado' 
            });
        }

        // Calcular a data de término da assinatura
        const endDate = new Date();
        switch (plan) {
            case 'weekly':
                endDate.setDate(endDate.getDate() + 7);
                break;
            case 'monthly':
                endDate.setMonth(endDate.getMonth() + 1);
                break;
            case 'yearly':
                endDate.setFullYear(endDate.getFullYear() + 1);
                break;
        }

        // Atualizar o status da assinatura
        await user.update({
            subscriptionStatus: 'active',
            subscriptionEndDate: endDate,
            subscriptionPlan: plan,
            paymentId: paymentId
        });

        res.json({
            success: true,
            message: 'Assinatura ativada com sucesso',
            subscriptionEndDate: endDate,
            subscriptionPlan: plan
        });
    } catch (error) {
        console.error('Erro ao confirmar pagamento:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao confirmar pagamento' 
        });
    }
});

// Rota para cancelar uma assinatura
router.post('/cancel', async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'Usuário não encontrado' 
            });
        }

        // Verificar se o usuário tem uma assinatura ativa
        if (user.subscriptionStatus !== 'active' || new Date(user.subscriptionEndDate) <= new Date()) {
            return res.status(400).json({ 
                success: false,
                error: 'Usuário não possui uma assinatura ativa' 
            });
        }

        // Atualizar o usuário para cancelar a assinatura
        await user.update({
            subscriptionStatus: 'cancelled'
        });

        res.json({ 
            success: true,
            message: 'Assinatura cancelada com sucesso' 
        });
    } catch (error) {
        console.error('Erro ao cancelar assinatura:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao cancelar assinatura' 
        });
    }
});

module.exports = router; 
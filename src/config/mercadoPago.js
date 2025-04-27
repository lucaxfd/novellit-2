const mercadopago = require('mercadopago');

// Configuração do Mercado Pago
mercadopago.configure({
    access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
    integrator_id: process.env.MERCADO_PAGO_INTEGRATOR_ID
});

// Criar preferência de pagamento
const createPreference = async (subscriptionData) => {
    try {
        const preference = {
            items: [
                {
                    title: subscriptionData.title,
                    unit_price: subscriptionData.price,
                    quantity: 1,
                    currency_id: 'BRL',
                    description: subscriptionData.description
                }
            ],
            payer: {
                name: subscriptionData.userName,
                email: subscriptionData.userEmail
            },
            payment_methods: {
                excluded_payment_types: [
                    { id: 'ticket' },
                    { id: 'atm' }
                ],
                installments: 12
            },
            back_urls: {
                success: `${process.env.FRONTEND_URL}/payment/success`,
                failure: `${process.env.FRONTEND_URL}/payment/failure`,
                pending: `${process.env.FRONTEND_URL}/payment/pending`
            },
            auto_return: 'approved',
            notification_url: `${process.env.BACKEND_URL}/api/payment/webhook`,
            external_reference: subscriptionData.userId,
            statement_descriptor: 'NOVELIT'
        };

        const response = await mercadopago.preferences.create(preference);
        return response.body;
    } catch (error) {
        console.error('Erro ao criar preferência de pagamento:', error);
        throw error;
    }
};

// Processar notificação de pagamento
const processPaymentNotification = async (paymentId) => {
    try {
        const payment = await mercadopago.payment.findById(paymentId);
        return payment.body;
    } catch (error) {
        console.error('Erro ao processar notificação de pagamento:', error);
        throw error;
    }
};

module.exports = {
    createPreference,
    processPaymentNotification
}; 
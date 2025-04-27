import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;
const MERCADO_PAGO_ACCESS_TOKEN = process.env.REACT_APP_MERCADO_PAGO_ACCESS_TOKEN;

const paymentService = {
    createPaymentPreference: async (preferenceData) => {
        try {
            const response = await axios.post(
                'https://api.mercadopago.com/checkout/preferences',
                preferenceData,
                {
                    headers: {
                        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Erro ao criar preferência de pagamento:', error);
            throw error;
        }
    },

    getPaymentStatus: async (paymentId) => {
        try {
            const response = await axios.get(
                `https://api.mercadopago.com/v1/payments/${paymentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Erro ao verificar status do pagamento:', error);
            throw error;
        }
    }
};

export const { createPaymentPreference, getPaymentStatus } = paymentService; 
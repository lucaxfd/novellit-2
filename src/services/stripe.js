import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export const createCheckoutSession = async (priceId) => {
    try {
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ priceId }),
        });

        if (!response.ok) {
            throw new Error('Erro ao criar sessão de checkout');
        }

        const { sessionId } = await response.json();
        const stripe = await stripePromise;
        
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Erro no checkout:', error);
        throw error;
    }
};

export const getSubscriptionStatus = async () => {
    try {
        const response = await fetch('/api/subscription-status');
        if (!response.ok) {
            throw new Error('Erro ao obter status da assinatura');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro ao verificar status da assinatura:', error);
        throw error;
    }
}; 
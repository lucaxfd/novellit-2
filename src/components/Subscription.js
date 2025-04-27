import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createCheckoutSession, getSubscriptionStatus } from '../services/stripe';
import '../styles/Subscription.css';

const Subscription = () => {
    const { user } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [subscription, setSubscription] = useState(null);

    useEffect(() => {
        const checkSubscription = async () => {
            if (user) {
                try {
                    const status = await getSubscriptionStatus();
                    setSubscription(status);
                } catch (err) {
                    console.error('Erro ao verificar assinatura:', err);
                }
            }
        };

        checkSubscription();
    }, [user]);

    const handleSubscribe = async () => {
        try {
            setIsProcessing(true);
            setError(null);
            
            // ID do preço do plano mensal no Stripe
            const priceId = process.env.REACT_APP_STRIPE_PRICE_ID;
            await createCheckoutSession(priceId);
        } catch (err) {
            setError('Erro ao processar o pagamento. Por favor, tente novamente.');
            setIsProcessing(false);
        }
    };

    if (!user) {
        return (
            <div className="subscription-container">
                <h2>Assinatura</h2>
                <p>Por favor, faça login para assinar nosso serviço.</p>
            </div>
        );
    }

    return (
        <div className="subscription-container">
            <h2>Assinatura</h2>
            
            {subscription?.active ? (
                <div className="subscription-status">
                    <p>Status: <strong>Ativo</strong></p>
                    <p>Início: {new Date(subscription.startDate).toLocaleDateString()}</p>
                    <p>Próximo pagamento: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
                </div>
            ) : (
                <div className="subscription-options">
                    <p>Assine nosso serviço por apenas R$ 9,99/mês</p>
                    <button 
                        className="subscribe-button"
                        onClick={handleSubscribe}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Processando...' : 'Assinar por R$ 9,99/mês'}
                    </button>
                    {error && <div className="error">{error}</div>}
                </div>
            )}
        </div>
    );
};

export default Subscription; 
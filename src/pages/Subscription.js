import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { toast } from 'react-toastify';

const Subscription = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { subscribe } = useSubscription();
    const [loading, setLoading] = useState(false);

    const plans = [
        {
            id: 'weekly',
            name: 'Semanal',
            price: 5.00,
            features: [
                'Acesso completo por 7 dias',
                'Suporte prioritário',
                'Cancelamento a qualquer momento'
            ]
        },
        {
            id: 'monthly',
            name: 'Mensal',
            price: 15.00,
            features: [
                'Acesso completo por 30 dias',
                'Suporte prioritário',
                'Cancelamento a qualquer momento'
            ]
        },
        {
            id: 'yearly',
            name: 'Anual',
            price: 150.00,
            features: [
                'Acesso completo por 365 dias',
                'Suporte prioritário',
                'Cancelamento a qualquer momento',
                'Economia de 17%'
            ]
        }
    ];

    const handleSubscribe = async (plan) => {
        try {
            setLoading(true);
            
            // Redirecionar para a página de pagamento com o plano selecionado
            window.location.href = `/payment?plan=${plan.id}`;
        } catch (error) {
            console.error('Erro ao processar pagamento:', error);
            toast.error('Erro ao processar pagamento. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="subscription-container">
            <h1>Escolha seu Plano</h1>
            <div className="plans-grid">
                {plans.map((plan) => (
                    <div key={plan.id} className="plan-card">
                        <h2>{plan.name}</h2>
                        <p className="price">R$ {plan.price.toFixed(2)}/mês</p>
                        <ul>
                            {plan.features.map((feature, index) => (
                                <li key={index}>{feature}</li>
                            ))}
                        </ul>
                        <button
                            onClick={() => handleSubscribe(plan)}
                            disabled={loading}
                            className="subscribe-button"
                        >
                            {loading ? 'Processando...' : 'Assinar Agora'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Subscription; 
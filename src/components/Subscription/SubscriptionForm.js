import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { createPaymentPreference } from '../../services/paymentService';
import { Button, Form, Alert } from 'react-bootstrap';

const SubscriptionForm = () => {
    const { user } = useAuth();
    const { updateSubscription } = useSubscription();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubscribe = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const preferenceData = {
                items: [{
                    title: 'Assinatura Premium',
                    unit_price: 29.90,
                    quantity: 1,
                    currency_id: 'BRL'
                }],
                payer: {
                    email: user.email
                },
                back_urls: {
                    success: `${window.location.origin}/payment/success`,
                    failure: `${window.location.origin}/payment/failure`,
                    pending: `${window.location.origin}/payment/pending`
                },
                auto_return: 'approved'
            };

            const response = await createPaymentPreference(preferenceData);
            window.location.href = response.init_point;
        } catch (err) {
            setError('Erro ao criar preferência de pagamento. Por favor, tente novamente.');
            console.error('Erro:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <Alert variant="warning">
                Você precisa estar logado para assinar nosso serviço.
            </Alert>
        );
    }

    return (
        <Form onSubmit={handleSubscribe}>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <div className="text-center mb-4">
                <h3>Assinatura Premium</h3>
                <p className="lead">R$ 29,90/mês</p>
                <ul className="list-unstyled">
                    <li>✓ Acesso ilimitado a todos os recursos</li>
                    <li>✓ Suporte prioritário</li>
                    <li>✓ Atualizações exclusivas</li>
                </ul>
            </div>

            <Button 
                variant="primary" 
                type="submit" 
                disabled={loading}
                className="w-100"
            >
                {loading ? 'Processando...' : 'Assinar Agora'}
            </Button>
        </Form>
    );
};

export default SubscriptionForm; 
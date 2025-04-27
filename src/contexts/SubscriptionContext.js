import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getPaymentStatus } from '../services/paymentService';

const SubscriptionContext = createContext();

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};

export const SubscriptionProvider = ({ children }) => {
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const checkSubscriptionStatus = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // Aqui você deve implementar a lógica para verificar o status da assinatura do usuário
                // Por exemplo, buscar do seu backend ou do Mercado Pago
                const paymentStatus = await getPaymentStatus(user.subscriptionId);
                setSubscription(paymentStatus);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        checkSubscriptionStatus();
    }, [user]);

    const value = {
        subscription,
        loading,
        error,
        setSubscription
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
}; 
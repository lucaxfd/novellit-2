import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SubscriptionBadge.css';

const SubscriptionBadge = () => {
    const [subscriptionStatus, setSubscriptionStatus] = useState(null);
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        const checkSubscriptionStatus = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/api/subscription/status', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSubscriptionStatus(response.data);
            } catch (error) {
                console.error('Erro ao verificar status da assinatura:', error);
            }
        };

        checkSubscriptionStatus();
    }, []);

    if (!subscriptionStatus || !subscriptionStatus.isSubscribed) {
        return null;
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="subscription-badge-container">
            <div 
                className="subscription-badge"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                👑
            </div>
            {showTooltip && (
                <div className="subscription-tooltip">
                    <p>Assinatura {subscriptionStatus.subscriptionPlan}</p>
                    <p>Válida até: {formatDate(subscriptionStatus.subscriptionEndDate)}</p>
                </div>
            )}
        </div>
    );
};

export default SubscriptionBadge; 
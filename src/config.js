require('dotenv').config();

const requiredEnvVars = ['JWT_SECRET'];

// Verificar variáveis de ambiente obrigatórias
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`A variável de ambiente ${envVar} é obrigatória`);
    }
}

const config = {
    // Porta do servidor
    port: process.env.PORT || 3000,

    // Chave secreta para JWT
    jwtSecret: process.env.JWT_SECRET,

    // Tempo de expiração do JWT
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

    // Caminho do banco de dados SQLite
    DATABASE_PATH: process.env.DATABASE_PATH || './database.sqlite',

    // Ambiente de execução
    NODE_ENV: process.env.NODE_ENV || 'development',

    stripePublishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'test_key',
    stripePriceId: process.env.REACT_APP_STRIPE_PRICE_ID || 'test_price_id'
};

console.log('Configurações carregadas:', {
    port: config.port,
    hasJwtSecret: !!config.jwtSecret,
    hasStripeKey: !!config.stripePublishableKey,
    hasStripePriceId: !!config.stripePriceId
});

module.exports = config; 
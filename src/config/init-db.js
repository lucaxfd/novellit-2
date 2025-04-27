const { sequelize } = require('./database');
const User = require('../models/User');

async function initializeDatabase() {
    try {
        // Sincronizar todos os modelos
        await sequelize.sync({ force: true });
        console.log('Banco de dados sincronizado com sucesso');

        // Criar usuário de teste
        const testUser = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: 'test123',
            subscriptionStatus: 'inactive'
        });

        console.log('Usuário de teste criado com sucesso:', {
            id: testUser.id,
            name: testUser.name,
            email: testUser.email,
            subscriptionStatus: testUser.subscriptionStatus
        });

        // Verificar se o usuário foi criado
        const foundUser = await User.findOne({ where: { email: 'test@example.com' } });
        if (foundUser) {
            console.log('Usuário encontrado no banco de dados:', {
                id: foundUser.id,
                email: foundUser.email
            });
        } else {
            console.error('Usuário não encontrado após criação!');
        }

    } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
        process.exit(1);
    }
}

initializeDatabase(); 
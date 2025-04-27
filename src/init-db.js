const sequelize = require('./config/database');
const User = require('./models/User');

async function initializeDatabase() {
    try {
        // Sincroniza todos os modelos com o banco de dados
        await sequelize.sync({ force: true }); // force: true recria as tabelas
        console.log('Banco de dados inicializado com sucesso!');
    } catch (error) {
        console.error('Erro ao inicializar o banco de dados:', error);
    } finally {
        await sequelize.close();
    }
}

initializeDatabase(); 
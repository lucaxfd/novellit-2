const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value) {
            const hash = bcrypt.hashSync(value, 10);
            this.setDataValue('password', hash);
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subscriptionStatus: {
        type: DataTypes.ENUM('inactive', 'active', 'cancelled'),
        defaultValue: 'inactive',
        allowNull: false
    },
    subscriptionEndDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    subscriptionPlan: {
        type: DataTypes.ENUM('weekly', 'monthly', 'yearly'),
        allowNull: true
    },
    paymentId: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: true,
    underscored: true
});

// Método para verificar senha
User.prototype.verifyPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = User; 
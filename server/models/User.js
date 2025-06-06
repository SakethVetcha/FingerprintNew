const { DataTypes } = require('sequelize');
const sequelize = require('../config/Database');

const User = sequelize.define('User', {
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  visitorId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

module.exports = User;

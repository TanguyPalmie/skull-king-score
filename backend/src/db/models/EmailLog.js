import { DataTypes } from 'sequelize';

export default function (sequelize) {
  return sequelize.define(
    'EmailLog',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      recipient: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      subject: {
        type: DataTypes.STRING(255),
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'email_logs',
      underscored: true,
      timestamps: true,
      updatedAt: false,
      indexes: [
        { fields: ['type'] },
        { fields: ['created_at'] },
      ],
    },
  );
}

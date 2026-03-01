import { DataTypes } from 'sequelize';

export default function (sequelize) {
  return sequelize.define(
    'PasswordResetCode',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      code: {
        type: DataTypes.STRING(8),
        allowNull: false,
      },
      used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'password_reset_codes',
      underscored: true,
      timestamps: true,
      updatedAt: false,
    },
  );
}

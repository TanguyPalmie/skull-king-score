import { DataTypes } from 'sequelize';

export default function (sequelize) {
  return sequelize.define(
    'RefreshToken',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      token: {
        type: DataTypes.STRING(512),
        unique: true,
        allowNull: false,
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
      tableName: 'refresh_tokens',
      underscored: true,
      timestamps: true,
      updatedAt: false,
    },
  );
}

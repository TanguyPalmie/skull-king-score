import { DataTypes } from 'sequelize';

export default function (sequelize) {
  return sequelize.define(
    'UserKey',
    {
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      public_key: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'user_keys',
      underscored: true,
      timestamps: true,
      updatedAt: false,
    },
  );
}

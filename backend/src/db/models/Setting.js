import { DataTypes } from 'sequelize';

export default function (sequelize) {
  return sequelize.define(
    'Setting',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      data: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'settings',
      underscored: true,
      timestamps: true,
      createdAt: false,
    },
  );
}

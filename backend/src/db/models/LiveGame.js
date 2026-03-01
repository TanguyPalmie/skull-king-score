import { DataTypes } from 'sequelize';

export default function (sequelize) {
  return sequelize.define(
    'LiveGame',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      owner_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      share_code: {
        type: DataTypes.STRING(8),
        unique: true,
        allowNull: false,
      },
      game_slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      state: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'live_games',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['owner_id'] },
        { fields: ['share_code'] },
      ],
    },
  );
}

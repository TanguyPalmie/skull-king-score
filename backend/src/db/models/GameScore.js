import { DataTypes } from 'sequelize';

export default function (sequelize) {
  return sequelize.define(
    'GameScore',
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
      game_slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      rank: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      players_count: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      played_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'game_scores',
      underscored: true,
      timestamps: false,
    },
  );
}

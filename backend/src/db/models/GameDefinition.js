import { DataTypes } from 'sequelize';

export default function (sequelize) {
  return sequelize.define(
    'GameDefinition',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      slug: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      icon: {
        type: DataTypes.STRING(10),
        defaultValue: '\uD83C\uDFB2',
      },
      description: {
        type: DataTypes.TEXT,
      },
      min_players: {
        type: DataTypes.INTEGER,
        defaultValue: 2,
      },
      max_players: {
        type: DataTypes.INTEGER,
        defaultValue: 12,
      },
      default_rounds: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
      },
      scoring_type: {
        type: DataTypes.STRING(20),
        defaultValue: 'simple',
        validate: {
          isIn: [['simple', 'bid_tricks']],
        },
      },
      bonus_values: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      allow_custom_bonus: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      theme_config: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      stepper_type: {
        type: DataTypes.STRING(20),
        defaultValue: 'manche',
      },
      enabled: {
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
      tableName: 'game_definitions',
      underscored: true,
      timestamps: true,
    },
  );
}

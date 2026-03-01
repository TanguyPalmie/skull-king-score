import { DataTypes } from 'sequelize';

export default function (sequelize) {
  return sequelize.define(
    'Friendship',
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
      friend_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      status: {
        type: DataTypes.STRING(10),
        defaultValue: 'pending',
        validate: {
          isIn: [['pending', 'accepted']],
        },
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'friendships',
      underscored: true,
      timestamps: true,
      updatedAt: false,
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'friend_id'],
        },
      ],
    },
  );
}

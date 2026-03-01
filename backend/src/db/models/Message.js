import { DataTypes } from 'sequelize';

export default function (sequelize) {
  return sequelize.define(
    'Message',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      receiver_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      encrypted_content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      nonce: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'messages',
      underscored: true,
      timestamps: true,
      updatedAt: false,
      indexes: [
        { fields: ['sender_id', 'receiver_id', 'created_at'] },
        { fields: ['receiver_id', 'read'] },
      ],
    },
  );
}

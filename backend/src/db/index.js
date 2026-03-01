/**
 * Singleton Sequelize — connexion unique à la base de données PostgreSQL.
 * Exporte l'instance sequelize + des helpers CRUD génériques.
 */
import { Sequelize, Op } from 'sequelize';

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://skullking:skullking_secret@db:5432/skullking',
  {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? (msg) => console.log(`[SQL] ${msg}`) : false,
    pool: { min: 2, max: 10, acquire: 30000, idle: 10000 },
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);

// ═══════════════════════════════════════════════════════════
//  Helpers CRUD génériques
// ═══════════════════════════════════════════════════════════

/** Cherche un enregistrement unique */
export function findOne(Model, where, opts = {}) {
  return Model.findOne({ where, ...opts });
}

/** Liste avec filtres optionnels */
export function findAll(Model, where = {}, opts = {}) {
  return Model.findAll({ where, ...opts });
}

/** Cherche par clé primaire */
export function findById(Model, id, opts = {}) {
  return Model.findByPk(id, opts);
}

/** Crée un enregistrement */
export function createRecord(Model, data, opts = {}) {
  return Model.create(data, opts);
}

/** Met à jour des enregistrements (retourne [count, rows] si returning) */
export function updateRecord(Model, where, data, opts = {}) {
  return Model.update(data, { where, returning: true, ...opts });
}

/** Supprime des enregistrements */
export function deleteRecord(Model, where, opts = {}) {
  return Model.destroy({ where, ...opts });
}

/** Insert ou update (upsert) */
export function upsertRecord(Model, data, opts = {}) {
  return Model.upsert(data, { returning: true, ...opts });
}

/** Pagination helper */
export async function paginate(Model, where = {}, { page = 1, limit = 50, order = [['created_at', 'DESC']], ...opts } = {}) {
  const offset = (page - 1) * limit;
  const { count, rows } = await Model.findAndCountAll({
    where,
    order,
    limit,
    offset,
    ...opts,
  });
  return { total: count, page, limit, data: rows };
}

/** Comptage */
export function count(Model, where = {}) {
  return Model.count({ where });
}

export { Op };
export default sequelize;

/**
 * Simple MySQL
 */
class Db {
    /**
     * @param {} pool mysql2 pool
     * @param {} logger moleculer broker.logger
     */
    constructor(pool, logger) {
        this._pool = pool;
        this._logger = logger;
        this._logger.debug('MySQL:connect');
    }

    /**
     * @returns {*}
     */
    provider() {
        return this._pool;
    }

    /**
     * Emulate query
     * @param {String} sql
     * @param {{}} params
     * @returns {Promise<string>} raw query
     */
    async emu(sql, params = {}) {
        return this._pool.format(sql, params);
    }

    /**
     * Run query
     * @param {String} sql
     * @param {{}} params
     * @returns {Promise<*>}
     */
    async query(sql, params = {}) {
        this._logger.debug('MySQL:', { sql, params });
        try {
            return await this._pool.query(sql, params);
        } catch (e) {
            this._logger.error('MySQL:Error:', e.message);
            throw new Error('MySQL Error: ' + e.message);
        }
    }

    /**
     * Fetch array of objects
     * @param {String} sql
     * @param {{}} params
     * @returns {Promise<Array>} if no results, return empty array []
     */
    async rows(sql, params = {}) {
        const result = await this.query(sql, params);
        if (!result) return [];
        const [rows] = result;
        return rows;
    }

    /**
     * Fetch row
     * @param {String} sql
     * @param {{}} params
     * @returns {Promise<Object>} if no results, return empty object {}
     */
    async row(sql, params = {}) {
        const rows = await this.rows(sql, params);
        if (!rows) return {};
        const [row] = rows;
        return row;
    }

    /**
     * Fetch column (first column of query)
     * @param {String} sql
     * @param {{}} params
     * @returns {Promise<Array>} if no results, return empty array []
     */
    async col(sql, params = {}) {
        const result = await this.query(sql, params);
        if (!result) return [];
        const [rows] = result;
        const [prop] = Object.keys(rows[0]);
        return rows.map(i => i[prop]);
    }

    /**
     * Fetch value
     * @param {String} sql
     * @param {{}} params
     * @returns {Promise<string|number|null>}
     */
    async val(sql, params = {}) {
        const row = await this.row(sql, params);
        if (!row) return null;
        const [prop] = Object.keys(row);
        return row[prop];
    }

    /**
     * Fetch total found results
     * @returns {Promise<number>}
     */
    async total() {
        return +(await this.val('SELECT FOUND_ROWS()'));
    }

    /**
     * Insert
     * @param {String} sql
     * @param {{}} params
     * @returns {Promise<number>} insert id
     */
    async insert(sql, params = {}) {
        const [result] = await this.query(sql, params);
        return result.insertId;
    }

    end() {
        this._pool.end();
        this._logger.debug('MySQL:disconnect');
    }
}

module.exports = {
    created() {
        const {logger} = this.broker;
        const pool = require('mysql2/promise').createPool(process.env.MYSQL_URL);
        this.db = new Db(pool, logger);
    },
    stopped() {
        this.db.end();
    },
};

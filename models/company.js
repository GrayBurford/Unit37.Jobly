"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static createWhereClause (key, index) {
    if (key === "name") {
      return `${key} ILIKE $${index + 1}`;
    }
    if (key === "minEmployees") {
      return `num_employees >= $${index + 1}`;
    }
    if (key === "maxEmployees") {
      return `num_employees <= $${index + 1}`;
    }
  }

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }


  // Find all companies
  // Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
  // Optional incoming query strings to filter search: name, minEmployees, maxEmployees
  // Integerizes incoming numbers (min/max employees)
  // Checks if min < max, or throws error
  // Filters incoming query string keys against valid keys, and throws error if invalid
  static async findAll(queryString = {}) {
    console.log('Query:', queryString);
    let { minEmployees, maxEmployees } = queryString;
    if (minEmployees) minEmployees = +minEmployees;
    if (maxEmployees) maxEmployees = +maxEmployees;

    if (minEmployees && maxEmployees && minEmployees > maxEmployees) {
      const msg = 'maxEmployees must be greater than minEmployees!'
      throw new BadRequestError(msg)
    }

    if (queryString.name) queryString.name = `%${queryString.name}%`;
    let allKeys = Object.keys(queryString);
    let allValues = Object.values(queryString);
    console.log('allKeys:', allKeys);
    console.log('allValues:', allValues);

    const validKeys = ['name', 'minEmployees', 'maxEmployees'];
    const invalidKeys = allKeys.filter(each => validKeys.indexOf(each) === -1);
    if (invalidKeys.length) {
      throw new BadRequestError(`You have (${invalidKeys.length}) invalid keys in your request: ${[...invalidKeys]}`);
    }

    let queryKeys = allKeys.map((key, index) => this.createWhereClause(key, index)).join(" AND ");
    console.log('queryKeys:', queryKeys);

    let WHERE = queryKeys.length ? `WHERE ${queryKeys}` : "";
    console.log('WHERE:', WHERE);

    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ${WHERE}
           ORDER BY name`, 
           [...allValues]);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });

    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;

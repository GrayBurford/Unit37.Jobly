"use strict";

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

// Job class methods
class Job {

  // Create job (from data), update DB, return new job data
  // `data` should be { handle, name, description, numEmployees, logoUrl }
  // Returns { handle, name, description, numEmployees, logoUrl }
  // Throw BadRequestError if company is already in database
  static async create({ title, salary, equity, companyHandle }) {

    // *** Do not need to check for duplicates. OK for one company to have multiple of the same job
    // const duplicateCheck = await db.query(
    //       `SELECT title
    //        FROM jobs
    //        WHERE title = $1`,
    //     [title]);

    // if (duplicateCheck.rows[0])
    //   throw new BadRequestError(`Duplicate job exists: ${title}`);

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING title, salary, equity, company_handle AS "companyHandle"`,
        [
          title, salary, equity, companyHandle
        ]
    );
    const job = result.rows[0];

    return job;
  }


  // Find all companies
  // Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
  // Optional incoming query strings to filter search: name, minEmployees, maxEmployees
  // Integerizes incoming numbers (min/max employees)
  // Checks if min < max, or throws error
  // Filters incoming query string keys against valid keys, and throws error if invalid
  // Find all jobs with/w/o querystring filters: title, minSalary, hasEquity
  // Returns [{ title, salary, equity, companyHandle }, ...]
  // Check for any query string filters, and if exists, push values and relevant sql where expressions to array variables
  // Build db query from generic job query + whereExpressions, queryValues 
  static async findAll(queryString = {}) {
    let { title, minSalary, hasEquity } = queryString;

    let query = `SELECT jobs.id, 
            jobs.title, 
            jobs.salary, 
            jobs.equity, 
            jobs.company_handle AS "companyHandle", 
            companies.name AS "companyName"
        FROM jobs 
        LEFT JOIN companies ON companies.handle = jobs.company_handle`
    
    let queryValues = [];
    let whereExpressions = [];

    if (title) {
        queryValues.push(`%${title}%`);
        whereExpressions.push(`title ILIKE $${queryValues.length}`);
    }
    if (minSalary) {
        queryValues.push(minSalary);
        whereExpressions.push(`salary >= $${queryValues.length}`);
    }
    if (hasEquity) {
        whereExpressions.push(`equity > 0`);
    }

    if (whereExpressions.length) {
        query += " WHERE " + whereExpressions.join(" AND ");
    }

    query += " ORDER BY title";

    const result = await db.query(query, queryValues);
    
    return result.rows;
  }

  
  // Given a job title, return data about that job
  // Returns { title, salary, equity, companyHandle }
  // Throw NotFoundError if job title not found
  static async get(title) {
    const result = await db.query(
          `SELECT title, 
                    salary, 
                    equity, 
                    company_handle AS "companyHandle"
            FROM jobs
            WHERE title = $1`,
        [title]);

    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with title: ${title}`);

    return job;
  }


  // Update job data with `data`
  // This is a "partial update" -- fine if data doesn't contain all  fields; this only changes provided ones.
  // Data can include: { title, salary, equity }
  // Returns { id, title, salary, equity, companyHandle }
  // Throw NotFoundError if job title is not found
  static async update(title, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE title = ${handleVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;

    const result = await db.query(querySql, [...values, title]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with this title: ${title}`);

    return job;
  }


  // Delete job from database: returns undefined
  // Throw NotFoundError if title is not found
  static async remove(title) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE title = $1
           RETURNING title`,
        [title]);

    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with title: ${title}`);
  }

}


module.exports = Job;

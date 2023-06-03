"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");


// User Class Methods
class User {

  // Authenticate user given username and password
  // Returns { username, first_name, last_name, email, is_admin }
  // Throw UnauthorizedError if user not found or password wrong
  static async authenticate(username, password) {
    // try to find the user first
    const result = await db.query(
          `SELECT username,
                  password,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }


  // Register new user with data
  // Returns { username, firstName, lastName, email, isAdmin }
  // Throw BadRequestError if duplicate username
  static async register({username, password, firstName, lastName, email, isAdmin}) {    
    const duplicateCheck = await db.query(
          `SELECT username
           FROM users
           WHERE username = $1`,
        [username],
    );
    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username} already exists!`);
    }
    
    // If not duplicate username, hash user's password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    // Once username is unique and password is hashed, insert new user into database
    const result = await db.query(
          `INSERT INTO users
           (username,
            password,
            first_name,
            last_name,
            email,
            is_admin)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin"`,
        [
          username,
          hashedPassword,
          firstName,
          lastName,
          email,
          isAdmin,
        ],
    );
    // Return user object back
    const user = result.rows[0];
    return user;
  }


  // Find all users
  // Returns array of user objects: [{ username, first_name, last_name, email, is_admin }, ...]
  static async findAll() {
    const result = await db.query(
          `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           ORDER BY username`,
    );
    // Return all results
    return result.rows;
  }


  // Given username, return some data about user
  // Returns { username, first_name, last_name, is_admin, jobs }
  // where jobs is { id, title, company_handle, company_name, state }
  // Throw NotFoundError if username not found
  static async get(username) {
    const userRes = await db.query(
          `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    const userApps = await db.query(
      `SELECT job_id
      FROM applications
      WHERE username = $1`, [username]
    )

    user.jobsApplied = userApps.rows.map(e => e.job_id);

    return user;
  }


  // Update user data with `data`
  // This is partial update; does not need all fields, only provided data
  // Data can include: { firstName, lastName, password, email, isAdmin }
  // Returns { username, firstName, lastName, email, isAdmin }
  // Throw NotFoundError if not found
  // WARNING: this method can set new password or make user an admin
  // Callers of this function MUST be certain they have validated inputs to this or serious security risks are opened
  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          firstName: "first_name",
          lastName: "last_name",
          isAdmin: "is_admin",
        });

    const usernameVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                email,
                                is_admin AS "isAdmin"`;
    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    delete user.password;
    return user;
  }


  // Delete user from database given username. Return undefined
  static async remove(username) {
    let result = await db.query(
          `DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
        [username],
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
  }


  // Allows a user to apply for a job
  // Updates applications table in db with username and jobId
  static async applyToJob (username, jobId) {
    const userQuery = await db.query(
      `SELECT username FROM users WHERE username=$1`, [username]
    )
    const user = userQuery.rows[0];

    if (!user) throw new NotFoundError(`This username not found: ${username}`)

    const jobQuery = await db.query(
      `SELECT id FROM jobs WHERE id=$1`, [jobId]
    )
    const job = jobQuery.rows[0];

    if (!job) throw new NotFoundError(`This job id is not found: ${jobId}`)

    const result = await db.query(
      `INSERT INTO applications
      (username, job_id)
      VALUES ($1, $2)
      RETURNING username, job_id`, [user.username, job.id]
    )

    return result.rows[0];
  }
}


module.exports = User;

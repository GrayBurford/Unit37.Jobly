"use strict";

// Convenience middlware to handle common authorizatino cases in routes
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


// Middlware to authenticate user
// If token was provided, verify it, and, if valid, store token payload on res.locals
// this will include username and isAdmin fields
// *Not an error if no token provided, or if token is not valid
function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}


// Middlewas to check if user is logged in
// If not logged in, raises Unauthorized Error
function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

// Middleware to check if user is an admin
// If not admin, raises Unauthorized Error
// Check if user.isAdmin property is true in payload
function isAdminAndLoggedIn (req, res, next) {
  try {
    if (!res.locals.user || !res.locals.user.isAdmin) {
      throw new UnauthorizedError();
    }
    return next();
  } catch (error) {
    return next(error);
  }
}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  isAdminAndLoggedIn
};

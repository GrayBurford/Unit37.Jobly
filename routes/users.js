"use strict";


// Routes for USERS
const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, isAdminAndLoggedIn, isAdminOrCorrectUser } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();


// POST / { user } => { user, token }
// Adds a new user. This is not the registration endpoint --- instead, this is only for admin users to add new users. The new user being added can be an admin.
// This returns the newly created user and an authentication token for them:
// {user: { username, firstName, lastName, email, isAdmin }, token }
// Authorization required: ADMIN
router.post("/", isAdminAndLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});


// POST /users/:username/jobs/:id
// Returns => { applied : jobId }
// Allows an admin or logged-in user to apply for a job
// Authorization required: ADMIN or Logged in user
router.post('/:username/jobs/:id', 
  isAdminOrCorrectUser, 
  async function (req, res, next) {
    try {
      const { username, id } = req.params;
      await User.applyToJob(username, +id);
      return res.status(201).json({ applied : +id });
    } catch (err) {
      return next(err);
    }
})

// GET / => { users: [ {username, firstName, lastName, email }, ... ] }
// Return list of ALL users
// Authorization required: ADMIN
router.get("/", isAdminAndLoggedIn, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});


// GET /:username => { user }
// Returns { username, firstName, lastName, isAdmin, jobsApplied }
// Authorization required: CORRECT USER OR ADMIN
router.get("/:username", isAdminOrCorrectUser, async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


// PATCH /:username { user } => { user }
// Data can include: { firstName, lastName, password, email }
// Returns { username, firstName, lastName, email, isAdmin }
// Authorization required: CORRECT USER OR ADMIN
router.patch("/:username", isAdminOrCorrectUser, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    return res.status(200).json({ user });
  } catch (err) {
    return next(err);
  }
});


// DELETE /:username => { deleted : username }
// Authorization required: CORRECT USER OR ADMIN
router.delete("/:username", isAdminOrCorrectUser, async function (req, res, next){
  try {
    await User.remove(req.params.username);
    return res.status(202).json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;

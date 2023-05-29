"use strict";

// Routes for companies
const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, isAdminAndLoggedIn } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();


// POST / {company} => {company}
// Company should be: {handle, name, description, numEmployees, logoUrl}
// Returns: {handle, name, description, numEmployees, logoUrl}
// Authorization required: login
router.post("/", isAdminAndLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});


// GET / => { companies : [{handle, name, description, numEmployees, logoUrl}, ...] }
// Can filter on provided search filters: 
// - minEmployees, - maxEmployees, - nameLike (will find case-insensitive, partial matches)
// Authorization required: NONE
// EX FILTER: localhost:3001/companies?minEmployees=300
router.get("/", async function (req, res, next) {
  try {
    // query string values arrive as strings; must coerce to int
    // pass query string to Company model to handle logic
    const companies = await Company.findAll(req.query);
    return res.json({ companies });
  } catch (err) {
    return next(err);
  }
});


// GET /:handle => { company }
// Company is {handle, name, description, numEmployees, logoUrl, jobs }
// ...where jobs is: [{ id, title, salary, equity }, ...]
// Authorization required: NONE
router.get("/:handle", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.handle);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});


// PATCH /:handle { field1, field2, ... } => { company }
// Patches company data
// Fields can be: { name, description, numEmployees, logo_url }
// Returns: { handle, name, description, numEmployees, logo_url }
// Authorization required: login
router.patch("/:handle", isAdminAndLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});


// DELETE /:handle => { deleted : handle }
// Authorization required: login
router.delete("/:handle", isAdminAndLoggedIn, async function (req, res, next) {
  try {
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;

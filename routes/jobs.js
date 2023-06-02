"use strict";

// Routes for Jobs
const jsonschema = require('jsonschema');
const express = require('express');

const { BadRequestError, ForbiddenError } = require('../expressError');
const { ensureLoggedIn, isAdminAndLoggedIn } = require('../middleware/auth');

const Job = require('../models/job');

const jobNewSchema = require('../schemas/jobNew.json');
const jobUpdateSchema = require('../schemas/jobUpdate.json');
const jobSearchSchema = require('../schemas/jobSearchSchema.json')

const router = new express.Router();


// POST / { job }
// Job should be: { title, salary, equity, companyHandle }
// Returns: { title, salary, equity, companyHandle }
// Authorization required: ADMIN
router.post('/', isAdminAndLoggedIn, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});


// GET / => { jobs : [ { title, salary, equity, companyHandle }, ... ] }
// Can filter on these search terms:
// - title (string; can be partial match), 
// - minSalary (integer),
// - hasEquity (Boolean)
// Authorization required: NONE
router.get('/', async function (req, res, next) {
    const q = req.query;
    if (q.minSalary !== undefined) q.minSalary = +q.minSalary;
    q.hasEquity = q.hasEquity === "true";

    try {
        const validator = jsonschema.validate(q, jobSearchSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const jobs = await Job.findAll(q);
        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
});


// GET /:id => { job }
// Job is { title, salary, equity, companyHandle }
// Authorization required: NONE
router.get('/:id', async function (req, res, next) {
    try {
        const job = await Job.get(req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});


// PATCH /:id => { title, salary, equity, companyHandle }
// Possible fields (all optional): title, salary, equity
// Returns { title, salary, equity, companyHandle }
// Authorization required: ADMIN
router.patch('/:id', isAdminAndLoggedIn, async function (req, res, next) {
    try {
        if (req.body.id || req.body.company_handle) {
            throw new ForbiddenError();
        }
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.update(req.params.id, req.body);
        return res.status(200).json({ job });
    } catch (err) {
        return next(err);
    }
});


// DELETE /:id => { deleted : id }
// Authorization required: ADMIN
router.delete('/:id', isAdminAndLoggedIn, async function (req, res, next) {
    try {
        await Job.remove(req.params.id);
        return res.status(202).json({ deleted : +req.params.id })
    } catch (err) {
        return next(err);
    }
});



module.exports = router;


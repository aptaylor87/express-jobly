"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError, ExpressError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job= require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobFilterSchema = require("../schemas/jobFilter.json")
const jobUpdateSchema = require("../schemas/jobUpdate.json");


const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login, isAdmin = true
 */

router.post("/", ensureAdmin, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      const job = await Job.create(req.body);
      return res.status(201).json({ job });
    } catch (err) {
        console.log(err)
      return next(err);
    }
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * - minSalary
 * - hasEquity - if true shows results with non-zero equity. false has no effect.
 * - titleLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.query, jobFilterSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
      let data = req.query
      console.log(data.hasEquity)
      if (data.hasEquity === 'true') {
            data.hasEquity = 0;
      } 
      if (data.hasEquity === 'false') {
        delete data.hasEquity;
      }
      const jobs = await Job.findAll(data);
      return res.json({ jobs });
    } catch (err) {
      return next(err);
    }
});


/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity, companyHandle }
 *  
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
    try {
      const job= await Job.get(req.params.id);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  });


  /** PATCH /[id] { fld1, fld2, ... } => { id }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login, isAdmin = true
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      const job = await Job.update(req.params.id, req.body);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  });

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: login, isAdmin = true
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
    try {
      await Job.remove(req.params.id);
      return res.json({ deleted: req.params.id});
    } catch (err) {
      return next(err);
    }
  });


  module.exports = router;
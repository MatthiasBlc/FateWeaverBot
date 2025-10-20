import { Router } from "express";
import { getAllJobs, getJobById, createJob, updateJob } from "../controllers/jobs";
import { validate } from "../api/middleware/validation.middleware";
import {
  GetJobByIdSchema,
  CreateJobSchema,
  UpdateJobSchema
} from "../api/validators/job.schema";

const router = Router();

router.get("/", getAllJobs);
router.get("/:id", validate(GetJobByIdSchema), getJobById);
router.post("/", validate(CreateJobSchema), createJob);
router.patch("/:id", validate(UpdateJobSchema), updateJob);

export default router;

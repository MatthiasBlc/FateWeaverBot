import { Router } from "express";
import { getAllJobs, getJobById, createJob, updateJob } from "../controllers/jobs";

const router = Router();

router.get("/", getAllJobs);
router.get("/:id", getJobById);
router.post("/", createJob);
router.patch("/:id", updateJob);

export default router;

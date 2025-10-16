import { Router } from "express";
import { objectsController } from "../controllers/objects";

const router = Router();

// Object types routes
router.get("/", objectsController.getAllObjectTypes);
router.get("/:id", objectsController.getObjectTypeById);
router.post("/", objectsController.createObjectType);

export default router;

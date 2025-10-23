import { Router } from "express";
import { objectsController } from "../controllers/objects";
import { validate } from "../api/middleware/validation.middleware";
import {
  GetObjectTypeByIdSchema,
  CreateObjectTypeSchema
} from "../api/validators/object.schema";

const router = Router();

// Object types routes
router.get("/", objectsController.getAllObjectTypes);
router.get("/:id", validate(GetObjectTypeByIdSchema), objectsController.getObjectTypeById);
router.post("/", validate(CreateObjectTypeSchema), objectsController.createObjectType);
router.patch("/:id", objectsController.updateObjectType);
router.delete("/:id", objectsController.deleteObjectType);

export default router;

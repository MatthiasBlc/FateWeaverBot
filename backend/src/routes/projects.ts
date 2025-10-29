import { Router } from 'express';
import {
  createProject,
  getProjectsByCraftType,
  getProjectById,
  contributeToProject,
  getAllProjectsForTown,
  deleteProject,
} from '../controllers/projects';
import { validate } from '../api/middleware/validation.middleware';
import {
  CreateProjectSchema,
  GetAllProjectsForTownSchema,
  GetProjectsByCraftTypeSchema,
  GetProjectByIdSchema,
  ContributeToProjectSchema,
  DeleteProjectSchema,
} from '../api/validators/project.schema';

const router = Router();

router.post('/', validate(CreateProjectSchema), createProject);
router.get('/town/:townId', validate(GetAllProjectsForTownSchema), getAllProjectsForTown);
router.get('/town/:townId/craft-type/:craftType', validate(GetProjectsByCraftTypeSchema), getProjectsByCraftType);
router.get('/:projectId', validate(GetProjectByIdSchema), getProjectById);
router.post('/characters/:characterId/projects/:projectId/contribute', validate(ContributeToProjectSchema), contributeToProject);
router.delete('/:projectId', validate(DeleteProjectSchema), deleteProject);

export default router;

import { Router } from 'express';
import {
  createProject,
  getProjectsByCraftType,
  getProjectById,
  contributeToProject,
  getAllProjectsForTown,
  deleteProject,
  restartBlueprint,
} from '../controllers/projects';

const router = Router();

router.post('/', createProject);
router.get('/town/:townId', getAllProjectsForTown);
router.get('/town/:townId/craft-type/:craftType', getProjectsByCraftType);
router.get('/:projectId', getProjectById);
router.post('/characters/:characterId/projects/:projectId/contribute', contributeToProject);
router.delete('/:projectId', deleteProject);
router.post('/:projectId/restart', restartBlueprint);

export default router;

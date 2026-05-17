import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router: Router = Router();

router.get('/auth/confirm-account',  AuthController.confirmAccount);
router.all('/auth/reset-password',   AuthController.resetPassword);

router.get('/admin/confirm-company', AuthController.confirmCompany);
router.get('/admin/reject-company',  AuthController.rejectCompany);

export default router;

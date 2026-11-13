import { Router } from 'express';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { saldosCategorias } from '../controller/saldosCategorias.js';

const router = Router();

router.post('/categorias/saldo', authenticateToken, saldosCategorias);

export default router;

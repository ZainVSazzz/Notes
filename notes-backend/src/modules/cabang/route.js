import express from 'express';
import { getCabang } from './controller.js';

const router = express.Router();

router.get('/', getCabang);

export default router;
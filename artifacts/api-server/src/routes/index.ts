import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import mediaRouter from "./media";
import uploadRouter from "./upload";
import seedRouter from "./seed";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(mediaRouter);
router.use(uploadRouter);
router.use(seedRouter);

export default router;

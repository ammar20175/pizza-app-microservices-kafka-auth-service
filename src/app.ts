import 'reflect-metadata';
import express, { Request, Response } from 'express';
import authRouter from './routes/auth';
import tenantRouter from './routes/tenant';
import userRouter from './routes/user';
import cookieParser from 'cookie-parser';
import cors, { CorsOptions } from 'cors';
import { Config } from './config';
import { globalErrorHandler } from './middlewares/globalErrorHandler';

const corsOptions: CorsOptions = {
    origin: [Config.CLIENT_URL!],
    credentials: true,
};

const app = express();
app.use(cors(corsOptions));
app.use(express.static('public'));
app.use(cookieParser());
app.use(express.json());

app.get('/', async (req: Request, res: Response) => {
    res.send('hello');
});

app.use('/auth', authRouter);
app.use('/tenants', tenantRouter);
app.use('/users', userRouter);

app.use(globalErrorHandler);

export default app;

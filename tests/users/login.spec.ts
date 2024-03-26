import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import app from '../../src/app';
import request from 'supertest';
import { isJwt } from '../utils';
import bcrypt from 'bcrypt';
import { User } from '../../src/entity/User';
import { Roles } from '../../src/constants';

describe('POST /auth/login', () => {
    let connection: DataSource;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe('Given all fields', () => {
        it('should return the access token and refresh token inside a cookie', async () => {
            const userData = {
                firstName: 'Ammar',
                lastName: 'Ahmad',
                email: 'ammar@gmail.com',
                password: '12345678',
            };

            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const userRepository = connection.getRepository(User);
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            });

            const response = await request(app)
                .post('/auth/login')
                .send({ email: userData.email, password: userData.password });

            interface Headers {
                ['set-cookie']?: string[];
            }

            let accessToken: string | null = null;
            let refreshToken: string | null = null;
            const cookies = (response.headers as Headers)['set-cookie'] || [];

            cookies.forEach((cookie) => {
                if (cookie.startsWith('accessToken=')) {
                    accessToken = cookie.split(';')[0].split('=')[1];
                }

                if (cookie.startsWith('refreshToken=')) {
                    refreshToken = cookie.split(';')[0].split('=')[1];
                }
            });

            expect(accessToken).not.toBeNull();
            expect(refreshToken).not.toBeNull();
            expect(isJwt(accessToken)).toBeTruthy();
            expect(isJwt(refreshToken)).toBeTruthy();
        });

        it('should return 400 status code if email is wrong', async () => {
            const userData = {
                firstName: 'Ammar',
                lastName: 'Ahmad',
                email: 'ammar@gmail.com',
                password: '12345678',
            };

            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const userRepository = connection.getRepository(User);
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            });

            const response = await request(app).post('/auth/login').send({
                email: 'ammarahmad@gmail.com',
                password: userData.password,
            });

            expect(response.statusCode).toBe(400);
        });

        it('should return 400 status code if password is wrong', async () => {
            const userData = {
                firstName: 'Ammar',
                lastName: 'Ahmad',
                email: 'ammar@gmail.com',
                password: '12345678',
            };

            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const userRepository = connection.getRepository(User);
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            });

            const response = await request(app).post('/auth/login').send({
                email: userData.email,
                password: '1234567024',
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe('Fields are missing', () => {
        it('should return 400 status code if email and password are missing', async () => {
            const userData = {
                firstName: 'Ammar',
                lastName: 'Ahmad',
                email: 'ammar@gmail.com',
                password: '12345678',
            };

            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const userRepository = connection.getRepository(User);
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            });

            const response = await request(app).post('/auth/login').send({
                email: '',
                password: '',
            });

            expect(response.statusCode).toBe(400);
        });

        it('should return 400 status code if email is not a valid email', async () => {
            const userData = {
                firstName: 'Ammar',
                lastName: 'Ahmad',
                email: 'ammar@gmail.com',
                password: '12345678',
            };

            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const userRepository = connection.getRepository(User);
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            });

            const response = await request(app).post('/auth/login').send({
                email: '',
                password: userData.password,
            });

            expect(response.statusCode).toBe(400);
        });

        it('should return 400 status code if password is missing', async () => {
            const userData = {
                firstName: 'Ammar',
                lastName: 'Ahmad',
                email: 'ammar@gmail.com',
                password: '12345678',
            };

            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const userRepository = connection.getRepository(User);
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            });

            const response = await request(app).post('/auth/login').send({
                email: userData.email,
                password: '',
            });

            expect(response.statusCode).toBe(400);
        });
    });
});

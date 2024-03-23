import { DataSource } from 'typeorm';
import app from '../../src/app';
import request from 'supertest';
import { AppDataSource } from '../../src/config/data-source';
import { User } from '../../src/entity/User';
import { Roles } from '../../src/constants';

describe('POST /auth/register', () => {
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
        it('should return the 201 status code', async () => {
            const userData = {
                firstName: 'Ammar',
                lastName: 'Ahmad',
                email: 'ammar@gmail.com',
                password: '12345678',
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(response.statusCode).toBe(201);
        });

        it('should return valid json response', async () => {
            const userData = {
                firstName: 'Ammar',
                lastName: 'Ahmad',
                email: 'ammar@gmail.com',
                password: '12345678',
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(
                (response.headers as Record<string, string>)['content-type'],
            ).toEqual(expect.stringContaining('json'));
        });

        it('should persist the user in the database', async () => {
            const userData = {
                firstName: 'Ammar',
                lastName: 'Ahmad',
                email: 'ammar@gmail.com',
                password: '12345678',
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(1);
            expect(users[0].firstName).toBe(userData.firstName);
            expect(users[0].lastName).toBe(userData.lastName);
            expect(users[0].email).toBe(userData.email);
        });

        it('should return an id of the created user', async () => {
            const userData = {
                firstName: 'Ammar',
                lastName: 'Ahmad',
                email: 'ammar@gmail.com',
                password: '12345678',
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(response.body).toHaveProperty('id');
            const repository = connection.getRepository(User);
            const users = await repository.find();
            expect((response.body as Record<string, string>).id).toBe(
                users[0].id,
            );
        });

        it('should assign a customer role', async () => {
            const userData = {
                firstName: 'Ammar',
                lastName: 'Ahmad',
                email: 'ammar@gmail.com',
                password: '12345678',
            };

            await request(app).post('/auth/register').send(userData);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users[0]).toHaveProperty('role');
            expect(users[0].role).toBe(Roles.CUSTOMER);
        });

        it('should store hashed password in database', async () => {
            const userData = {
                firstName: 'Ammar',
                lastName: 'Ahmad',
                email: 'ammar@gmail.com',
                password: '12345678',
            };

            await request(app).post('/auth/register').send(userData);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users[0].password).not.toBe(userData.password);
            expect(users[0].password).toHaveLength(60);
            expect(users[0].password).toMatch(/^\$2[a|b]\$\d+\$/);
        });

        it('should return 400 status code if email is already exists', async () => {
            const userData = {
                firstName: 'Ammar',
                lastName: 'Ahmad',
                email: 'ammar@gmail.com',
                password: '12345678',
            };

            const userRepository = AppDataSource.getRepository(User);
            await userRepository.save({ ...userData, role: Roles.CUSTOMER });

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            const users = await userRepository.find();

            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(1);
        });
    });

    describe('Fields are missing', () => {
        it('should return 400 status code if email is already exists', async () => {
            const userData = {
                firstName: 'Ammar',
                lastName: 'Ahmad',
                email: '',
                password: '1234567',
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(0);
        });

        it('should return 400 status code if firstName is missing', async () => {
            const userData = {
                firstName: '',
                lastName: 'Ahmad',
                email: ' ammar@gmail.com ',
                password: '12345678',
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(0);
        });

        it('should return 400 status code if lastName is missing', async () => {
            const userData = {
                firstName: 'Amnar',
                lastName: '',
                email: ' ammar@gmail.com ',
                password: '12345678',
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(0);
        });

        it('should return 400 status code if password is missing', async () => {
            const userData = {
                firstName: 'Ammar',
                lastName: 'Ahmad',
                email: ' ammar@gmail.com ',
                password: '',
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(0);
        });
    });

    describe('Fields are not in proper format', () => {
        it('should trim the email field', async () => {
            const userData = {
                firstName: 'Ammar',
                lastName: 'Ahmad',
                email: ' ammar@gmail.com ',
                password: '12345678',
            };

            await request(app).post('/auth/register').send(userData);

            const userRepository = AppDataSource.getRepository(User);
            const users = await userRepository.find();
            expect(users[0].email).toBe('ammar@gmail.com');
        });

        it('should return 400 status code if email is not a valid email', async () => {
            const userData = {
                firstName: 'Ammar',
                lastName: 'Ahmad',
                email: ' ammar.com ',
                password: '12345678',
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            const userRepository = AppDataSource.getRepository(User);
            const users = await userRepository.find();
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(0);
        });

        it('should return 400 status code if password length is less than 8 chars', async () => {
            const userData = {
                firstName: 'Ammar',
                lastName: 'Ahmad',
                email: ' ammar@gmail.com ',
                password: '12345',
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(0);
        });

        it('shoud return an array of error messages if email is missing', async () => {
            const userData = {
                firstName: 'Ammar',
                lastName: 'Ahmad',
                email: '',
                password: '1234578',
            };

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(response.body).toHaveProperty('errors');
            expect(
                (response.body as Record<string, string>).errors.length,
            ).toBeGreaterThan(0);
        });
    });
});

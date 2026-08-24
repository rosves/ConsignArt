import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AuthModule } from './auth.module';
import { UsersService } from 'src/users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/Entities';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from 'src/common/config/configurations/jwt.config';
import appConfig from 'src/common/config/configurations/app.config';
import databaseConfig from 'src/common/config/configurations/database.config';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}));

describe('Auth Integration - POST /api/v1/auth/login', () => {
    let app: INestApplication;

    const mockUserRepository = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
    }

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ isGlobal: 
                    true, 
                    load: [jwtConfig, appConfig, databaseConfig] 
                }),
                AuthModule
            ],
        })
        .overrideProvider(getRepositoryToken(User))
        .useValue(mockUserRepository)
        .compile();

        app = module.createNestApplication();
        app.setGlobalPrefix('api/v1');
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should throw an unauthorizedException if the credential are not good', async () => {
        mockUserRepository.findOne.mockResolvedValue(null);

        await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: 'wrong@test.com', password: 'password123' }).expect(401);
    });
    
    it('should throw a ok reponse when credential are good', async () => {
        
        mockUserRepository.findOne.mockResolvedValue({ 
            id: '123',
            email: 'test@test.com', 
            password: 'hashedPassword',
            role: 'collector'
        });

        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: 'wrong@test.com', password: 'password123' }).expect(200).expect((res) => {
            expect(res.headers['set-cookie']).toBeDefined();
        });

    });
});
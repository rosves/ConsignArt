import { AuthService } from "./auth.service";
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from "src/users/users.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { LoginDTO } from "src/users/dto/loginDTO";
import { CreateUserDTO } from "src/users/dto/createUserDTO";
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;

  // Mocks des dépendances  
  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    updateRefreshToken: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register()', () => {
    it('should throw ConflictException if email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: '123', email: 'test@test.com' });

      const dto = {
        email: 'test@test.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'collector',
      };

      // ACT + ASSERT → vérifie que register() lance une ConflictException
      await expect(authService.register(dto as CreateUserDTO)).rejects.toThrow(ConflictException);
    });
  });

  describe('login()',() => {
    it('should throw UnauthorizedException if the password is not corresponding', async () => {

      mockUsersService.findByEmail.mockResolvedValue({ id: '123', email: 'test@test.com', password: 'hashedPassword'});

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const dto = { 
        email: 'test@test.com',
        password: 'password123'
      };

      await expect(authService.login(dto as LoginDTO)).rejects.toThrow(UnauthorizedException);

    });

    it('should throw UnauthorizedException if the user is not found', async () => {

      mockUsersService.findByEmail.mockResolvedValue(null);

      const dto = { 
        email: 'test@test.com',
        password: 'password123'
      };

      await expect(authService.login(dto as LoginDTO)).rejects.toThrow(UnauthorizedException);

    });

    it('should login the user if the credentials are good', async () => {

      mockUsersService.findByEmail.mockResolvedValue({ id: '123', email: 'test@test.com', password: 'password123', role: 'collector'});

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const dto = { 
        email: 'test@test.com',
        password: 'password123'
      };

      mockJwtService.sign.mockReturnValueOnce('accessToken').mockReturnValueOnce('refreshToken');

      mockUsersService.updateRefreshToken = jest.fn();

      const result = await authService.login(dto as LoginDTO);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');

    });
  });
});
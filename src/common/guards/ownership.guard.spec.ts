import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OwnershipGuard } from './ownership.guard';
import { UserRole } from '../enum';

describe('OwnershipGuard', () => {
  let guard: OwnershipGuard;
  let mockDataSource: any;

  beforeEach(() => {
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn(),
      }),
    };
    guard = new OwnershipGuard(mockDataSource as unknown as DataSource);
  });

  const createMockContext = (user: any, params: any): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({ user, params }),
    }),
  } as unknown as ExecutionContext);

  it('should allow ADMIN unconditionally', async () => {
    const context = createMockContext({ id: 'admin-1', role: UserRole.ADMIN }, { id: 'artwork-1' });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow GALLERY if artwork belongs to the user gallery', async () => {
    mockDataSource.getRepository().findOne.mockResolvedValue({
      id: 'artwork-1',
      artist: { galleryId: 'gallery-1' },
    });

    const context = createMockContext({ id: 'gallery-1', role: UserRole.GALLERY }, { id: 'artwork-1' });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException if artwork belongs to another gallery', async () => {
    mockDataSource.getRepository().findOne.mockResolvedValue({
      id: 'artwork-1',
      artist: { galleryId: 'other-gallery' },
    });

    const context = createMockContext({ id: 'gallery-1', role: UserRole.GALLERY }, { id: 'artwork-1' });
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException if artwork does not exist', async () => {
    mockDataSource.getRepository().findOne.mockResolvedValue(null);

    const context = createMockContext({ id: 'gallery-1', role: UserRole.GALLERY }, { id: 'unknown-id' });
    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });
});
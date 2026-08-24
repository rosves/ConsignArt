import { UserRole } from "../enum";
import { RoleGuard } from "./role.guard";

describe('RoleGuard', () => { 

    let guard: RoleGuard;
    let mockReflector: { getAllAndOverride: jest.Mock };

    beforeEach(() => {
        mockReflector = {
        getAllAndOverride: jest.fn(),
        };

        guard = new RoleGuard(mockReflector as any);
    });

    const mockExecutionContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
            getRequest: jest.fn().mockReturnValue({
            user: { id: '123', role: 'admin' }
            }),
        }),
    };

    it('should let through if there is no gaurd on the endpoint', () => {
        mockReflector.getAllAndOverride.mockReturnValue(undefined);

        const result = guard.canActivate(mockExecutionContext as any);

        expect(result).toBe(true);
    });

    it('should let through if the role is corresponding', () => {
        mockReflector.getAllAndOverride.mockReturnValue(UserRole.ADMIN);

        const result = guard.canActivate(mockExecutionContext as any);

        expect(result).toBe(true);
    });

    it('should block if this is the wrong role', () => {
        mockReflector.getAllAndOverride.mockReturnValue(UserRole.COLLECTOR);

        const result = guard.canActivate(mockExecutionContext as any);

        expect(result).toBe(false); 
    });
})
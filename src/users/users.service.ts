import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/Entities';
import { Repository } from 'typeorm';
import { CreateUserInternalDTO } from './dto/createUserInternalDTO';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository : Repository<User>,
  ) {}

  public async findByEmail( email : string ) : Promise<User | null> {
    const user = await this.userRepository.findOne({ where : { email : email}});
    return user;
  }

  public async findById(id : string) : Promise<User | null> {
    const user = await this.userRepository.findOne({ where : { id : id }})
    return user;
  }

  public async create( userInfo : CreateUserInternalDTO ) : Promise<User> { 
    const user = this.userRepository.create(userInfo);
    await this.userRepository.save(user);
    return user;
  }

  public async updateRefreshToken(userId : string, refreshToken : string ) : Promise<void> { 
    await this.userRepository.update(userId, { hashedRefreshToken : refreshToken });
  }

  public async ActiveGalleryAccount(userId : string) : Promise<void> {
    const user = await this.userRepository.update(userId, { isActive : true });
  }

  public async resetRefreshToken(userId : string) : Promise<void> { 
    await this.userRepository.update(userId, { hashedRefreshToken : null });
  }

}

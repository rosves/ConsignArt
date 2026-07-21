import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/Entities';
import { Repository } from 'typeorm';
import { CreateUserDTO } from './dto/createUserDTO';

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

  public async create( userInfo : CreateUserDTO ) : Promise<User> { 
    const user = this.userRepository.create(userInfo);
    await this.userRepository.save(user);
    return user;
  }

  public async updateRefresToken(userId : string, refreshToken : string ) : Promise<void> { 
    await this.userRepository.update(userId, { hashedRefreshToken : refreshToken })
  }

}

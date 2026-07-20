import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/Entities';

@Module({
  imports : [TypeOrmModule.forFeature([User])], // permets de mettre à disposition le repositotry User pour le module 
  controllers: [UsersController],
  providers: [UsersService],
  exports : [UsersService]
})

export class UsersModule {}

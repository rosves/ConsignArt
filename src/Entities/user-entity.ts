import { UserRole } from "src/common/enum";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity('users')
export class User { 
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  email!: string;

  @Column()
  password!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({
    type : 'enum',
    enum : UserRole,
    default : UserRole.ARTIST
  })
  role!: UserRole;

  @Column({ default : false})
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({
    type : 'varchar',
    nullable : true
  })
  hashedRefreshToken!: string | null;
}


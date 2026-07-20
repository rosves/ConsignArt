import { ArtistStatus } from "src/common/enum";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity('artists')
export class Artist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  firstName!: string;
  
  @Column()
  lastName!: string;
  
  @Column({ type: 'varchar', nullable: true })
  biography!: string | null;
  
  @Column({ type: 'varchar', nullable: true })
  portfolioURL!: string | null;
  
  @Column({ type: 'varchar', nullable: true })
  nationality!: string | null;
  
  @Column({ type: 'date', nullable : true})
  enterAt!: Date;
  
  @Column({
    type : 'enum',
    enum : ArtistStatus,
    default : ArtistStatus.INACTIVE
  })
  status!: ArtistStatus;
  
  @Column({ type: 'uuid', nullable : true })
  galleryId!: string | null;
  
  @Column({ type: 'uuid' })
  userAccountId!: string
  
  @CreateDateColumn()
  createdAt!: Date;
  
  @UpdateDateColumn()
  updatedAt!: Date;
}

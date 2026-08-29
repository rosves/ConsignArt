import { ArtistStatus } from "src/common/enum";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from "./user-entity";
import { Artwork } from "./artwork-entity";

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
  
  @Column({ type: 'uuid', nullable : true })
  userAccountId!: string | null;
  
  @CreateDateColumn()
  createdAt!: Date;
  
  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  
  @JoinColumn({ name: 'galleryId' })
  gallery?: User | null;

  @OneToOne(() => User, { nullable: true, onDelete: 'SET NULL' })

  @JoinColumn({ name: 'userAccountId' })
  userAccount?: User | null;

  @OneToMany(() => Artwork, (artwork) => artwork.artist)
  artworks!: Artwork[];
}

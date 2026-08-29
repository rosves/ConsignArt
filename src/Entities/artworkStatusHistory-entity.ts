import { ArtworkStatus } from 'src/common/enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Artwork } from './artwork-entity';
import { User } from './user-entity';

@Entity('artwork_status_histories')
export class ArtworkStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  artworkId!: string;

  @ManyToOne(() => Artwork, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'artworkId' })
  artwork!: Artwork;

  @Column({
    type: 'enum',
    enum: ArtworkStatus,
    nullable: true,
  })
  fromStatus!: ArtworkStatus | null;

  @Column({
    type: 'enum',
    enum: ArtworkStatus,
  })
  toStatus!: ArtworkStatus;

  @Column({ type: 'varchar', nullable: true })
  reason!: string | null;

  @Column({ type: 'uuid', nullable: true })
  changedById!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changedById' })
  changedBy?: User | null;

  @CreateDateColumn()
  createdAt!: Date;
}

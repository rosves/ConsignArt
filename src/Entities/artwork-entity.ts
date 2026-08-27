import { ArtworkStatus, ArtworkTechnics } from '../common/enum';
import { Dimensions } from '../common/value-object';
import { Artist } from './artist-entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

@Entity('artworks')
export class Artwork {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'int' })
  creationYear!: number;

  @Column({ type: 'enum', enum: ArtworkTechnics })
  technic!: ArtworkTechnics;

  @Column({ type: 'jsonb', nullable: true })
  dimensions!: Dimensions | null;

  @Column({ type: 'int', comment: 'Price in cents' })
  sellPrice!: number;

  @Column({ type: 'int', comment: 'Reserve price in cents' })
  reservePrice!: number;

  @Index('idx_artworks_status')
  @Column({
    type: 'enum',
    enum: ArtworkStatus,
    default: ArtworkStatus.AVAILABLE,
  })
  status!: ArtworkStatus;

  @Column({ type: 'varchar', nullable: true })
  imageURL!: string | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  consignedAt!: Date;

  @Column({ type: 'uuid' })
  artistId!: string;

  @ManyToOne(() => Artist, (artist) => artist.artworks, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'artistId' })
  artist!: Artist;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

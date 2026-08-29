import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Artwork } from './artwork-entity';
import { User } from './user-entity';
import { Exhibition } from './exhibition-entity';

@Entity('loans')
export class Loan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  artworkId!: string;

  @ManyToOne(() => Artwork, (artwork) => artwork.loans, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'artworkId' })
  artwork!: Artwork;

  @Column({ type: 'uuid' })
  lenderGalleryId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'lenderGalleryId' })
  lenderGallery!: User;

  @Column({ type: 'uuid' })
  borrowerGalleryId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'borrowerGalleryId' })
  borrowerGallery!: User;

  @Column({ type: 'uuid', nullable: true })
  exhibitionId?: string | null;

  @ManyToOne(() => Exhibition, (exhibition) => exhibition.loans, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'exhibitionId' })
  exhibition?: Exhibition | null;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date' })
  endDate!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  returnedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  conditions!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
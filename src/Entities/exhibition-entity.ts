import { ExhibitionType } from 'src/common/enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { User } from './user-entity';
import { Artwork } from './artwork-entity';
import { Loan } from './loan-entity';

@Entity('exhibitions')
export class Exhibition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date' })
  endDate!: Date;

  @Column({ type: 'varchar', nullable: true })
  location!: string | null;

  @Column({
    type: 'enum',
    enum: ExhibitionType,
  })
  type!: ExhibitionType;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'uuid' })
  galleryId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'galleryId' })
  gallery!: User;

  @ManyToMany(() => Artwork, (artwork) => artwork.exhibitions)
  @JoinTable({
    name: 'exhibition_artworks',
    joinColumn: { name: 'exhibitionId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'artworkId', referencedColumnName: 'id' },
  })
  artworks!: Artwork[];

  @OneToMany(() => Loan, (loan) => loan.exhibition)
  loans!: Loan[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
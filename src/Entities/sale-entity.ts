import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user-entity";
import { Artwork } from "./artwork-entity";
@Entity('sales')
export class Sale {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    artworkId!: string;

    @Column()
    buyerId!: string;

    @Column()
    salePrice!: number;

    @Column('decimal')
    commissionRate!: number;

    @Column()
    commissionAmount!: number;

    @Column()
    artistAmount!: number;

    @Column({ type: 'timestamptz' })
    soldAt!: Date;

    @Column({ type: 'varchar', nullable: true })
    invoiceRef!: string | null;


    @Column({ type: 'varchar', nullable: true })
    artistStatementRef!: string | null;

    @CreateDateColumn()
    createdAt!: Date;

    // @ManyToOne(() => Artwork)
    // @JoinColumn({ name: 'artworkId' })
    // artwork!: Artwork;

    // @ManyToOne(() => User)
    // @JoinColumn({ name: 'buyerId' })
    // buyer!: User;
}

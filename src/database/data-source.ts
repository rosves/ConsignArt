import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import {
  User,
  Artist,
  Artwork,
  ArtworkStatusHistory,
  Sale,
  Exhibition,
  Loan,
} from '../Entities';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, Artist, Artwork, ArtworkStatusHistory, Sale, Exhibition, Loan],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
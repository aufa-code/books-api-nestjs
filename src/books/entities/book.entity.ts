import { Check, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('books')
@Check('"stock" >= 0')
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 100 })
  author: string;

  @Column({ unique: true, length: 20 })
  isbn: string;

  @Column({ type: 'int', default: 0 })
  stock: number;
}
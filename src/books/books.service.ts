import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { Book } from './entities/book.entity';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book) private readonly repo: Repository<Book>,
    private readonly dataSource: DataSource,
  ) {}

  create(dto: CreateBookDto) {
    return this.repo.save(this.repo.create(dto));
  }

  findAll() {
    return this.repo.find();
  }

  async findOne(id: number) {
    const book = await this.repo.findOne({ where: { id } });
    if (!book) throw new NotFoundException(`Book ${id} not found`);
    return book;
  }

  async update(id: number, dto: UpdateBookDto) {
    const book = await this.findOne(id);
    Object.assign(book, dto);
    return this.repo.save(book);
  }

  async remove(id: number) {
    const book = await this.findOne(id);
    await this.repo.remove(book);
  }

  // TRANSAKSI: pindah stok antar buku, semua berhasil atau semua batal
  transferStock({ fromId, toId, qty }: TransferStockDto) {
    return this.dataSource.transaction(async (m) => {
      const from = await m.findOne(Book, {
        where: { id: fromId },
        lock: { mode: 'pessimistic_write' },
      });
      const to = await m.findOne(Book, {
        where: { id: toId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!from || !to) throw new NotFoundException('Book not found');
      if (from.stock < qty) throw new BadRequestException('Insufficient stock');
      from.stock -= qty;
      to.stock += qty;
      await m.save([from, to]);
      return { from, to };
    });
  }
}
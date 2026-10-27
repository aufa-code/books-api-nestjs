import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ProblemJsonFilter } from '../src/common/problem-json.filter';

describe('Books API - failure tests (e2e)', () => {
  let app: INestApplication;
  const uniq = () => `9${Date.now()}${Math.floor(Math.random() * 100)}`.slice(0, 18);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    app.useGlobalFilters(new ProblemJsonFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const createBook = (isbn: string, stock = 5) =>
    request(app.getHttpServer())
      .post('/books')
      .send({ title: 'Test', author: 'Tester', isbn, stock });

  it('400: title kosong dan stok negatif ditolak', async () => {
    const res = await request(app.getHttpServer())
      .post('/books')
      .send({ title: '', author: 'X', isbn: '123', stock: -1 })
      .expect(400);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('404: buku dengan id tidak ada', async () => {
    const res = await request(app.getHttpServer()).get('/books/999999').expect(404);
    expect(res.body.status).toBe(404);
  });

  it('409: ISBN duplikat ditolak database', async () => {
    const isbn = uniq();
    await createBook(isbn).expect(201);
    const res = await createBook(isbn).expect(409);
    expect(res.body.title).toBe('Conflict');
  });

  it('400: transfer stok melebihi saldo, transaksi di-rollback', async () => {
    const a = await createBook(uniq(), 5).expect(201);
    const b = await createBook(uniq(), 5).expect(201);

    await request(app.getHttpServer())
      .post('/books/transfer')
      .send({ fromId: a.body.id, toId: b.body.id, qty: 999 })
      .expect(400);

    const after = await request(app.getHttpServer())
      .get(`/books/${a.body.id}`)
      .expect(200);
    expect(after.body.stock).toBe(5);
  });
});
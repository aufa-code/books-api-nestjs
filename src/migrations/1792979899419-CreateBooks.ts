import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBooks1792979899419 implements MigrationInterface {
    name = 'CreateBooks1792979899419'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "books" ("id" SERIAL NOT NULL, "title" character varying(200) NOT NULL, "author" character varying(100) NOT NULL, "isbn" character varying(20) NOT NULL, "stock" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_54337dc30d9bb2c3fadebc69094" UNIQUE ("isbn"), CONSTRAINT "CHK_0eeb9122aeb75fd3ebbf465e47" CHECK ("stock" >= 0), CONSTRAINT "PK_f3f2f25a099d24e12545b70b022" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "books"`);
    }

}

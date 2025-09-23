import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPartialIndex implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_mobile_soft_delete" 
      ON "user" ("mobile") 
      WHERE "is_deleted" = false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_mobile_soft_delete";
    `);
  }
}


//
/* 
  run this SQL query in pgdmin to setup the migrations for the partial index for users 

  CREATE UNIQUE INDEX idx_user_mobile_not_deleted
ON "user" (mobile)
WHERE "isDeleted" = false;


  --- then check that the migration is correctly applied or not
  --- for that run the below command
  SELECT * FROM pg_indexes WHERE tablename = 'user';

*/
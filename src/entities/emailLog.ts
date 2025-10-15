// src/entities/EmailLog.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class EmailLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  to: string;

  @Column({ nullable: true })
  cc?: string;

  @Column({ nullable: true })
  bcc?: string;

  @Column()
  subject: string;

  @Column({ type: "text", nullable: true })
  body?: string;

  @Column({ default: false })
  sent: boolean;

  @Column({ type: "text", nullable: true })
  error?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

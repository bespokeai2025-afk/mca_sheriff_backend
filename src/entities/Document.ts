import {
  Entity,
  Column,
  ManyToOne,
  CreateDateColumn,
  PrimaryGeneratedColumn
} from "typeorm";
import { Lead } from "./Lead";

@Entity()
export class Document {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Lead, (lead) => lead.documents, { onDelete: "CASCADE" })
  lead: Lead;

  @Column({ type: "varchar", length: 100 })
  documentType: string; // bank_statement

  @Column({ type: "varchar", length: 255 })
  fileName: string;

  @Column({ type: "text" })
  s3Key: string;

  @Column({ type: "varchar" })
  uploadedVia: "portal" | "email";

  @CreateDateColumn()
  createdAt: Date;
}
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Admin } from "./Admin";

@Entity({ name: "password_reset" })
export class PasswordReset {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Admin)
  @JoinColumn({ name: "admin_id" })
  admin: Admin;

  @Column({ type: "varchar", length: 255 })
  token: string;

  @Column({ type: "timestamp" })
  expiresAt: Date;

  @Column({ type: "boolean", default: false })
  used: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

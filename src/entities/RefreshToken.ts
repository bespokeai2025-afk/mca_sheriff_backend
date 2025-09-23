import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Common } from "./Common";
import { Admin } from "./Admin";

// RefreshToken entity representing refresh tokens for user sessions
@Entity()
export class RefreshToken extends Common {

    // The actual refresh token string
    @Column()
    token: string;

    // Relationship with User entity (nullable)
    @ManyToOne(() => User, (user) => user.id, { nullable: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user_id: User;

    // Relationship with Admin entity (nullable)
    @ManyToOne(() => Admin, (admin) => admin.id, { nullable: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "admin_id" })
    admin_id: Admin;
}
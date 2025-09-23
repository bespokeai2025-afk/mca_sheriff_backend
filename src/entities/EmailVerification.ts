import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Common } from "./Common";

@Entity("email_verification_tokens")
export class EmailVerification extends Common {

    @ManyToOne(() => User, (user) => user.id, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user_id: User;

    @Column({ unique: true })
    token: string;

    @Column({ type: "timestamp" })
    expires_at: Date;

    @Column({ type: "int", default: 0 })
    daily_count: number

}

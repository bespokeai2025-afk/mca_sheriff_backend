import { Entity, Column, OneToOne, JoinColumn, ManyToMany, ManyToOne } from "typeorm";
import { User } from "./User";
import { Common } from "./Common";

@Entity()
export class Feedback extends Common {

    @ManyToOne(() => User, user => user.id)
    @JoinColumn({ name: 'user_id' })
    user_id: User; // One-to-one relationship with User entity

    @Column("text")
    feedback: string;

    @Column({ type: "float", default: 0, nullable: true })
    rating: number;

}

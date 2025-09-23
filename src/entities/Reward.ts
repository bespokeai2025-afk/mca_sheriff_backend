import { Entity, Column } from 'typeorm';
import { Common } from './Common';

// Reward entity representing rewards that can be earned
@Entity()
export class Reward extends Common {

    // Name of the reward
    @Column({type: 'text', unique: true, nullable: true})
    name: string;

    // Number of coins associated with the reward
    @Column({ type: 'int' })
    coins: number;

    // Expiry date for the reward
    @Column({ type: 'date' })
    expiry: Date;

    // Total number of times the reward has been redeemed
    @Column({ type: 'int' })
    total_redeem_count: number;
}
import { Entity, Column, ManyToOne, Check, JoinColumn } from 'typeorm';
import { User } from './User';
import { MainCategory } from './MainCategory';
import { Common } from './Common';
import { Skill } from './Skills';

// Answer entity representing user-selected skills in a main category
@Entity('answers')
export class Answer extends Common {

    // Relationship with User entity
    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user_id: User; // The user who selected the skills

    // Relationship with MainCategory entity
    @ManyToOne(() => MainCategory, (mainCategory) => mainCategory.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'main_category_id' })
    main_category_id: MainCategory; // The main category selected by the user

    // Array of skill IDs selected by the user
    @Column({ type: 'text', array: true })
    skill_ids: string[];
}
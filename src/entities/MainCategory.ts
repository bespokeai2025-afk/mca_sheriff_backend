/**
 * MainCategory entity representing the main categories in the system
 * Defines the structure and relationships for main categories
 */

import { Entity, Column, Check, OneToMany, JoinColumn } from 'typeorm';
import { Common } from './Common';
import { Skill } from './Skills';
import { Answer } from './Answer';

// MainCategory entity representing main categories
@Entity({ name: 'main_categories' })
@Check('priority >= 0') // Ensure priority is non-negative
export class MainCategory extends Common {

    // Name of the main category
    @Column({ type: 'text' })
    name: string;

    // Description of the main category
    @Column({ type: 'text' })
    description: string;

    // URL or path to the category image (nullable)
    @Column({ type: 'text', nullable: true })
    image: string | null;

    // URL or path to the category logo (nullable)
    @Column({ type: 'text', nullable: true })
    logo: string | null;

    // Priority for sorting/display order
    @Column({ type: 'int', default: 0 })
    priority: number;

    // Array of tags associated with the category
    @Column({ type: 'text', array: true, default: () => 'ARRAY[]::TEXT[]' })
    tags: string[];

    // Additional metadata in JSON format
    @Column({ type: 'jsonb', default : () => "'{}'::jsonb" })
    additional_info: Record<string, any>;

    // Relationship with Skill entity (cascade delete)
    @OneToMany(() => Skill, (skill) => skill.id, { nullable: true, onDelete: "CASCADE" })
    skill_ids: Skill[];

    // Relationship with Answer entity (cascade delete)
    @OneToMany(() => Answer, (answer) => answer.id, { nullable: true, onDelete: "CASCADE" })
    answer_id: Answer[];
}
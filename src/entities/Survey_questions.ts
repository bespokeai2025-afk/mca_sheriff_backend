/**
 * MainCategory entity representing the main categories in the system
 * Defines the structure and relationships for main categories
 */

import { Entity, Column, OneToMany } from 'typeorm';
import { Common } from './Common';
import { Survey_answers } from './Survey_answers';

// MainCategory entity representing survey questions
@Entity({ name: 'survey' })
export class Survey_questions extends Common {

    @Column({ type: 'text' })
    question_text: string;

    @Column({ type: 'text', array: true, default: () => 'ARRAY[]::TEXT[]' })
    category: string[];

    @Column({ type: 'int', default: 1 })
    serialNumber: number;

    // Relation: One Question can have multiple Answers
    @OneToMany(() => Survey_answers, (answer) => answer.question)
    answers: Survey_answers[];
}

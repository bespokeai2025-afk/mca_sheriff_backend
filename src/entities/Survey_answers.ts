import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Common } from './Common';
import { Survey_questions } from './Survey_questions';

@Entity({ name: 'Survey_answers' })
export class Survey_answers extends Common {

    @Column({ type: 'text' })
    answer_text: string;

    @ManyToOne(() => Survey_questions, (question) => question.id, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'question_id' })
    question: Survey_questions;
    

    @ManyToOne(() => Survey_questions, (nextQuestion) => nextQuestion.id, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'next_id' })
    nextQuestion: Survey_questions;

}

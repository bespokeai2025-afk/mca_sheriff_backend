import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Survey_questions } from './Survey_questions';
import { Survey_answers } from './Survey_answers';
import { Common } from './Common';

@Entity({ name: 'User_Survey_Answers' })
export class UserSurveyAnswers extends Common {
   

    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Survey_questions, (question) => question.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'question_id' })
    question: Survey_questions;

    @ManyToOne(() => Survey_answers, (answer) => answer.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'answer_id' })
    answer: Survey_answers;
}



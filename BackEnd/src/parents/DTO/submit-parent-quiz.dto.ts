export class SubmitParentQuizAnswerDTO {
  questionId: string;
  selectedOptionId?: string;
  essayAnswer?: string;
}

export class SubmitParentQuizDTO {
  answers: SubmitParentQuizAnswerDTO[];
}

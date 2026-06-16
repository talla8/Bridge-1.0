export class SubmitParentQuizAnswerDTO {
  questionId: string;
  selectedOptionId?: string;
  essayAnswer?: string;
  essayAttachmentFieldKey?: string;
}

export class SubmitParentQuizDTO {
  answers: SubmitParentQuizAnswerDTO[];
}

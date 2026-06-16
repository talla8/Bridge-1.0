import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

const uploadDirectory = join(process.cwd(), 'uploads', 'quiz-attachments');

function ensureUploadDirectory() {
  mkdirSync(uploadDirectory, { recursive: true });
}

export const quizAttachmentMulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, callback) => {
      ensureUploadDirectory();
      callback(null, uploadDirectory);
    },
    filename: (_req, file, callback) => {
      const safeExtension = extname(file.originalname || '').slice(0, 12);
      callback(
        null,
        `${Date.now()}_${randomUUID()}${safeExtension || ''}`,
      );
    },
  }),
  limits: {
    files: 20,
    fileSize: 10 * 1024 * 1024,
  },
};

export function uploadedQuizFilesByField(
  files?: Express.Multer.File[],
): Map<string, string[]> {
  const attachmentsByField = new Map<string, string[]>();

  (files ?? []).forEach((file) => {
    const existing = attachmentsByField.get(file.fieldname) ?? [];
    existing.push(`/uploads/quiz-attachments/${file.filename}`);
    attachmentsByField.set(file.fieldname, existing);
  });

  return attachmentsByField;
}

import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

const uploadDirectory = join(
  process.cwd(),
  'uploads',
  'institution-attachments',
);

function ensureUploadDirectory() {
  mkdirSync(uploadDirectory, { recursive: true });
}

export const institutionAttachmentMulterOptions = {
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
    files: 10,
    fileSize: 10 * 1024 * 1024,
  },
};

export function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function uploadedFilesToAttachments(
  files?: Express.Multer.File[],
): string[] {
  return (files ?? []).map(
    (file) => `/uploads/institution-attachments/${file.filename}`,
  );
}

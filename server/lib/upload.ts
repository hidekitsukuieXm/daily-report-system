/**
 * ファイルアップロード設定
 */

import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// アップロードファイルの保存先
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// 許可されるファイル形式
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
];

// 許可される拡張子
const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.jpg',
  '.jpeg',
  '.png',
];

// ファイルサイズ上限（10MB）
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ストレージ設定
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // UUIDを使用してユニークなファイル名を生成
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// ファイルフィルター
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  if (ALLOWED_EXTENSIONS.includes(ext) && ALLOWED_MIME_TYPES.includes(mimeType)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// multerインスタンス
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

/**
 * ファイル形式が許可されているか確認
 */
export function isAllowedFileType(mimeType: string, filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext) && ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * ファイルサイズが許可範囲内か確認
 */
export function isAllowedFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

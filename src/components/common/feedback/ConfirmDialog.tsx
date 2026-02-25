/**
 * 確認ダイアログコンポーネント
 */

import { Modal } from './Modal';
import { Button } from '../form/Button';
import './ConfirmDialog.css';

export type ConfirmDialogProps = {
  /** 表示状態 */
  open: boolean;
  /** タイトル */
  title?: string;
  /** メッセージ */
  message: string;
  /** 確認ボタンのテキスト */
  confirmText?: string;
  /** キャンセルボタンのテキスト */
  cancelText?: string;
  /** 危険なアクションか */
  danger?: boolean;
  /** 確認ローディング状態 */
  loading?: boolean;
  /** 確認ハンドラー */
  onConfirm: () => void;
  /** キャンセルハンドラー */
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title = '確認',
  message,
  confirmText = 'OK',
  cancelText = 'キャンセル',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="small"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
      footer={
        <div className="confirm-dialog-actions">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <p className="confirm-dialog-message">{message}</p>
    </Modal>
  );
}

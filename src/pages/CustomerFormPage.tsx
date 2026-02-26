/**
 * 顧客マスタ登録・編集ページ
 */

import { useParams } from 'react-router-dom';

export function CustomerFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        {isEdit ? '顧客編集' : '顧客登録'}
      </h1>
      <p className="text-muted-foreground">
        顧客マスタ{isEdit ? '編集' : '登録'}画面は別途実装予定です。
      </p>
    </div>
  );
}

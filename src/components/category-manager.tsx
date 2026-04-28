"use client";

import { useState, useTransition } from "react";
import { Button, Input, Label, Modal, Table, TextField } from "@heroui/react";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  createArticleCategoryAction,
  deleteArticleCategoryAction,
  updateArticleCategoryAction,
} from "@/app/admin/articles/actions";

export interface ArticleCategory {
  id: number;
  name: string;
  created_at: string;
}

interface CategoryManagerProps {
  initialCategories: ArticleCategory[];
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState<ArticleCategory[]>(initialCategories);
  const [isPending, startTransition] = useTransition();
  const [editingCategory, setEditingCategory] = useState<ArticleCategory | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingCategory, setDeletingCategory] = useState<ArticleCategory | null>(null);

  const handleCreate = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createArticleCategoryAction(formData);

      if (!result.success || !result.category) {
        alert(result.error ?? "Không thể tạo danh mục.");
        return;
      }

      setCategories((prev) => [result.category!, ...prev]);
      const form = document.getElementById("create-category-form") as HTMLFormElement | null;
      form?.reset();
    });
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateArticleCategoryAction(formData);

      if (!result.success || !result.category) {
        alert(result.error ?? "Không thể cập nhật danh mục.");
        return;
      }

      setCategories((prev) =>
        prev.map((category) =>
          category.id === result.category!.id ? result.category! : category
        )
      );
      setEditingCategory(null);
    });
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;

    const formData = new FormData();
    formData.set("id", String(deletingCategory.id));

    startTransition(async () => {
      const result = await deleteArticleCategoryAction(formData);

      if (!result.success) {
        alert(result.error ?? "Không thể xóa danh mục.");
        return;
      }

      setCategories((prev) => prev.filter((category) => category.id !== deletingCategory.id));
      setDeletingCategory(null);
    });
  };

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold">Tạo danh mục bài viết</h2>
        <p className="mt-1 text-sm text-default-500">
          Admin có thể thêm danh mục mới bằng cách chèn dữ liệu vào bảng `article_categories`.
        </p>
        <form
          id="create-category-form"
          action={handleCreate}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <TextField isRequired className="w-full sm:max-w-md">
            <Label>Tên danh mục</Label>
            <Input
              name="name"
              maxLength={120}
              placeholder="Ví dụ: Tin môi trường"
            />
          </TextField>
          <Button type="submit" variant="primary" isPending={isPending} className="self-start sm:self-end">
            Tạo danh mục
          </Button>
        </form>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Danh mục hiện có</h2>
          <span className="rounded-full bg-default-100 px-2 py-1 text-xs font-semibold text-default-600">
            {categories.length} danh mục
          </span>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-default-200">
          <Table className="min-w-full">
            <Table.ScrollContainer>
              <Table.Content aria-label="Bảng danh mục bài viết">
                <Table.Header>
                  <Table.Column isRowHeader>TÊN DANH MỤC</Table.Column>
                  <Table.Column>NGÀY TẠO</Table.Column>
                  <Table.Column>HÀNH ĐỘNG</Table.Column>
                </Table.Header>
                <Table.Body
                  items={categories}
                  renderEmptyState={() => (
                    <div className="p-8 text-center text-default-500">Chưa có danh mục nào.</div>
                  )}
                >
                  {(category) => (
                    <Table.Row key={category.id}>
                      <Table.Cell>
                        <span className="text-sm font-medium">{category.name}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-default-500">
                          {new Date(category.created_at).toLocaleString("vi-VN")}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onPress={() => {
                              setEditingCategory(category);
                              setEditingName(category.name);
                            }}
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                            Sửa
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-danger hover:bg-danger/10"
                            onPress={() => setDeletingCategory(category)}
                          >
                            <TrashIcon className="h-4 w-4" />
                            Xóa
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </div>
      </div>

      <Modal
        isOpen={Boolean(editingCategory)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setEditingCategory(null);
            setEditingName("");
          }
        }}
      >
        <Modal.Backdrop>
          <Modal.Container placement="center" size="md">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Chỉnh sửa danh mục</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="p-4">
                {editingCategory ? (
                  <form id="edit-category-form" onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                    <input type="hidden" name="id" value={editingCategory.id} />
                    <TextField isRequired>
                      <Label>Tên danh mục</Label>
                      <Input
                        name="name"
                        value={editingName}
                        maxLength={120}
                        onChange={(event) => setEditingName(event.target.value)}
                      />
                    </TextField>
                  </form>
                ) : null}
              </Modal.Body>
              <Modal.Footer className="gap-2 border-t border-default-200 p-4">
                <Button
                  variant="ghost"
                  onPress={() => {
                    setEditingCategory(null);
                    setEditingName("");
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit" form="edit-category-form" variant="primary" isPending={isPending}>
                  Lưu thay đổi
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal
        isOpen={Boolean(deletingCategory)}
        onOpenChange={(isOpen) => !isOpen && setDeletingCategory(null)}
      >
        <Modal.Backdrop>
          <Modal.Container placement="center" size="sm">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Xác nhận xóa danh mục</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="p-4 text-sm text-default-600">
                {deletingCategory ? (
                  <p>
                    Bạn có chắc chắn muốn xóa danh mục <strong>{deletingCategory.name}</strong> không?
                  </p>
                ) : null}
              </Modal.Body>
              <Modal.Footer className="gap-2 border-t border-default-200 p-4">
                <Button variant="ghost" onPress={() => setDeletingCategory(null)}>
                  Hủy
                </Button>
                <Button variant="danger" isPending={isPending} onPress={confirmDelete}>
                  Xóa danh mục
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}

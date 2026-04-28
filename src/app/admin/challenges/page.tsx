"use client";

import { useEffect, useState, useTransition } from "react";
import { Surface, Table, Button, Modal, TextField, Label, Input } from "@heroui/react";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/client";
import { AdminNavbar } from "@/components/admin-navbar";
import { createChallengeAction, deleteChallengeAction } from "./actions";

interface Challenge {
  id: string;
  name: string;
  started_at: string;
  ends_at: string;
  points: number;
  created_at: string;
}

export default function ChallengesAdminPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchChallenges();
  }, []);

  async function fetchChallenges() {
    setIsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching challenges:", error);
    } else {
      setChallenges(data || []);
    }
    setIsLoading(false);
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thử thách này?")) return;
    
    startTransition(async () => {
      const res = await deleteChallengeAction(id);
      if (res.success) {
        setChallenges((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert(res.error);
      }
    });
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const res = await createChallengeAction(formData);
      if (res.success) {
        setIsCreateModalOpen(false);
        fetchChallenges();
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <Surface variant="default" className="min-h-screen w-full bg-default-50">
      <AdminNavbar activePage="challenges" subtitle="Quản trị viên" title="Trang quản trị" />

      <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Quản lý Thử thách</h1>
            <p className="text-sm text-default-500 mt-1">
              Thêm, sửa, xóa các thử thách cộng đồng.
            </p>
          </div>

          <Button 
            variant="primary" 
            className="shrink-0"
            onPress={() => setIsCreateModalOpen(true)}
          >
            <PlusIcon className="w-5 h-5 mr-1" />
            Tạo thử thách mới
          </Button>
        </div>

        <Surface variant="secondary" className="rounded-2xl border border-default-200 overflow-hidden shadow-sm">
          <Table className="min-w-full">
            <Table.ScrollContainer>
              <Table.Content aria-label="Bảng quản lý thử thách">
                <Table.Header>
                  <Table.Column>TÊN THỬ THÁCH</Table.Column>
                  <Table.Column>ĐIỂM THƯỞNG</Table.Column>
                  <Table.Column>BẮT ĐẦU</Table.Column>
                  <Table.Column>KẾT THÚC</Table.Column>
                  <Table.Column>HÀNH ĐỘNG</Table.Column>
                </Table.Header>
                <Table.Body
                  items={challenges}
                  renderEmptyState={() => (
                    <div className="p-8 text-center text-default-500">
                      {isLoading ? "Đang tải dữ liệu..." : "Chưa có thử thách nào được tạo."}
                    </div>
                  )}
                >
                  {(challenge) => (
                    <Table.Row key={challenge.id}>
                      <Table.Cell>
                        <div className="font-semibold">{challenge.name}</div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-1 text-xs font-semibold text-warning-700">
                          +{challenge.points} điểm
                        </span>
                      </Table.Cell>
                      <Table.Cell>{new Date(challenge.started_at).toLocaleDateString("vi-VN")}</Table.Cell>
                      <Table.Cell>{new Date(challenge.ends_at).toLocaleDateString("vi-VN")}</Table.Cell>
                      <Table.Cell>
                        <div className="flex justify-end gap-2">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            className="text-danger hover:bg-danger/10"
                            aria-label="Xóa"
                            isDisabled={isPending}
                            onPress={() => handleDelete(challenge.id)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Surface>
      </main>

      <Modal isOpen={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <Modal.Backdrop>
          <Modal.Container placement="center" size="md">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Tạo Thử thách mới</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="p-4">
                <form id="create-challenge-form" onSubmit={handleCreate} className="flex flex-col gap-4">
                  <TextField isRequired>
                    <Label>Tên thử thách</Label>
                    <Input name="name" placeholder="Ví dụ: Ngày không sử dụng nhựa" />
                  </TextField>
                  
                  <TextField isRequired>
                    <Label>Điểm thưởng</Label>
                    <Input name="points" type="number" min="0" placeholder="100" />
                  </TextField>

                  <div className="grid grid-cols-2 gap-4">
                    <TextField isRequired>
                      <Label>Ngày bắt đầu</Label>
                      <Input name="started_at" type="datetime-local" />
                    </TextField>
                    
                    <TextField isRequired>
                      <Label>Ngày kết thúc</Label>
                      <Input name="ends_at" type="datetime-local" />
                    </TextField>
                  </div>
                </form>
              </Modal.Body>
              <Modal.Footer className="p-4 border-t border-default-200 gap-2">
                <Button variant="ghost" onPress={() => setIsCreateModalOpen(false)}>
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  form="create-challenge-form" 
                  variant="primary"
                  isPending={isPending}
                >
                  Tạo mới
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Surface>
  );
}

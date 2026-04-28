import { JSX } from "react";
import { redirect } from "next/navigation";
import { Button, Card, Form, Input, Label, Separator, Surface, TextField } from "@heroui/react";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import { createPinTypeAction } from "@/app/admin/pins/actions";
import { AdminNavbar } from "@/components/admin-navbar";

export default async function PinManagementPage(): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.admin !== true) {
    redirect("/community");
  }

  return (
    <Surface variant="default" className="min-h-screen w-full">
      <AdminNavbar activePage="pins" subtitle="Quản lý marker" title="Quản lý điểm đánh dấu bản đồ" />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-6">
        <Card variant="secondary" className="rounded-xl border border-default-200 p-6">
          <Card.Header className="flex items-start gap-3 p-0">
            <div className="rounded-lg bg-accent/10 p-2 text-accent">
              <MapPinIcon className="h-5 w-5" />
            </div>
            <div>
              <Card.Title className="text-xl font-semibold">Quản lý điểm đánh dấu bản đồ</Card.Title>
              <Card.Description className="mt-2 text-sm text-default-500">
                Chỉ quản trị viên mới có thể truy cập trang này.
              </Card.Description>
            </div>
          </Card.Header>
        </Card>

        <Card variant="secondary" className="rounded-xl border border-default-200 p-6">
          <Card.Header className="p-0">
            <Card.Title className="text-lg font-semibold">Tạo marker type mới</Card.Title>
            <Card.Description className="mt-2 text-sm text-default-500">
              Tạo một loại marker mới để dùng cho các điểm trên bản đồ.
            </Card.Description>
          </Card.Header>

          <Separator className="my-4" />

          <Card.Content className="p-0">
            <Form action={createPinTypeAction} className="flex flex-col gap-4">
              <TextField isRequired className="gap-1">
                <Label htmlFor="name" className="text-sm font-medium">Tên marker type</Label>
                <Input id="name" name="name" placeholder="Ví dụ: Điểm thu gom rác" />
              </TextField>

              <TextField isRequired className="gap-1">
                <Label htmlFor="icons" className="text-sm font-medium">Icon</Label>
                <Input id="icons" name="icons" placeholder="Ví dụ: trash" />
              </TextField>

              <Card.Footer className="p-0">
                <Button type="submit" variant="primary" className="w-full">
                  Tạo marker type
                </Button>
              </Card.Footer>
            </Form>
          </Card.Content>
        </Card>
      </main>
    </Surface>
  );
}
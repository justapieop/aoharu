import { JSX } from "react";
import { redirect } from "next/navigation";
import { Button, Card, Form, Input, Label, Separator, Surface, TextField } from "@heroui/react";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import { createPinAction, createPinTypeAction } from "@/app/admin/pins/actions";
import { AdminNavbar } from "@/components/admin-navbar";
import { PinTypeRow } from "../../../components/pin-type-row";
import { WysiwygEditor } from "@/components/wysiwyg-editor";

const openingDayOptions = [
  { label: "T2", value: "0" },
  { label: "T3", value: "1" },
  { label: "T4", value: "2" },
  { label: "T5", value: "3" },
  { label: "T6", value: "4" },
  { label: "T7", value: "5" },
  { label: "CN", value: "6" },
];

interface PinTypeRow {
  id: string;
  created_at: string;
  name: string;
  created_by: string | null;
  icon: string;
}

interface PinRow {
  id: string;
  created_at: string;
  name: string;
  pin_type_id: string;
  lat: number;
  long: number;
  address: string | null;
  description: string | null;
  opening_days: string | null;
  sponsored: boolean;
  pin_types: {
    name: string;
    icon: string;
  }[];
}

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

  const { data: pinTypes } = await supabase
    .from("pin_types")
    .select("id, created_at, name, created_by, icon")
    .order("created_at", { ascending: false });

  const { data: pins } = await supabase
    .from("pins")
    .select("id, created_at, name, pin_type_id, lat, long, address, description, opening_days, sponsored, pin_types(name, icon)")
    .order("created_at", { ascending: false });

  const pinsByTypeId = (pins ?? []).reduce<Record<string, PinRow[]>>((accumulator, pin) => {
    const key = pin.pin_type_id;
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(pin as PinRow);
    return accumulator;
  }, {});

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
                <Label htmlFor="icon" className="text-sm font-medium">Icon</Label>
                <Input id="icon" name="icon" placeholder="Ví dụ: trash" />
              </TextField>

              <Card.Footer className="p-0">
                <Button type="submit" variant="primary" className="w-full">
                  Tạo marker type
                </Button>
              </Card.Footer>
            </Form>
          </Card.Content>
        </Card>

        {pinTypes && pinTypes.length > 0 ? (
          <Card variant="secondary" className="rounded-xl border border-default-200 p-6">
            <Card.Header className="p-0">
              <Card.Title className="text-lg font-semibold">Tạo pin mới</Card.Title>
              <Card.Description className="mt-2 text-sm text-default-500">
                Chọn marker type đã tạo, nhập vị trí, tải ảnh lên và đánh dấu các ngày mở cửa bằng 7 bit tương ứng 7 ngày trong tuần.
              </Card.Description>
            </Card.Header>

            <Separator className="my-4" />

            <Card.Content className="p-0">
              <Form action={createPinAction} className="flex flex-col gap-4">
                <TextField isRequired className="gap-1">
                  <Label htmlFor="pin-name" className="text-sm font-medium">
                    Tên pin
                  </Label>
                  <Input id="pin-name" name="name" placeholder="Ví dụ: Trạm thu gom trung tâm" />
                </TextField>

                <div className="grid gap-4 md:grid-cols-2">
                  <TextField isRequired className="gap-1">
                    <Label htmlFor="pin-type" className="text-sm font-medium">
                      Marker type
                    </Label>
                    <select
                      id="pin-type"
                      name="pin_type_id"
                      className="h-12 rounded-medium border border-default-200 bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Chọn marker type
                      </option>
                      {pinTypes.map((pinType) => (
                        <option key={pinType.id} value={pinType.id}>
                          {pinType.name} ({pinType.icon})
                        </option>
                      ))}
                    </select>
                  </TextField>

                  <div className="flex flex-col gap-1">
                    <Label htmlFor="pin-image" className="text-sm font-medium">
                      Ảnh địa điểm
                    </Label>
                    <input
                      id="pin-image"
                      name="image"
                      type="file"
                      accept="image/*"
                      className="h-12 rounded-medium border border-default-200 bg-background px-3 text-sm outline-none transition-colors file:mr-3 file:rounded-md file:border-0 file:bg-default-100 file:px-3 file:py-1 file:text-sm file:font-medium focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <TextField isRequired className="gap-1">
                    <Label htmlFor="pin-lat" className="text-sm font-medium">
                      Vĩ độ
                    </Label>
                    <Input id="pin-lat" name="lat" type="number" step="any" placeholder="Ví dụ: 10.7769" />
                  </TextField>

                  <TextField isRequired className="gap-1">
                    <Label htmlFor="pin-long" className="text-sm font-medium">
                      Kinh độ
                    </Label>
                    <Input id="pin-long" name="long" type="number" step="any" placeholder="Ví dụ: 106.7009" />
                  </TextField>
                </div>

                <TextField className="gap-1">
                  <Label htmlFor="pin-address" className="text-sm font-medium">
                    Địa chỉ
                  </Label>
                  <Input id="pin-address" name="address" placeholder="Nhập địa chỉ của pin" />
                </TextField>

                <WysiwygEditor
                  name="description"
                  label="Mô tả"
                  placeholder="Mô tả chi tiết địa điểm (hỗ trợ định dạng rich text, không hỗ trợ upload media)."
                />

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Opening days</p>
                    <p className="mt-1 text-sm text-default-500">Chọn các ngày mở cửa, hệ thống sẽ lưu thành 7 bit theo thứ tự T2 đến CN.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {openingDayOptions.map((day) => (
                      <label
                        key={day.value}
                        className="flex items-center gap-2 rounded-xl border border-default-200 px-3 py-2 text-sm text-foreground"
                      >
                        <input type="checkbox" name="opening_days" value={day.value} className="h-4 w-4 rounded border-default-300" />
                        <span>{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-default-200 px-3 py-3 text-sm text-foreground">
                  <input type="checkbox" name="sponsored" className="h-4 w-4 rounded border-default-300" />
                  <span>Đánh dấu là sponsored</span>
                </label>

                <Card.Footer className="p-0">
                  <Button type="submit" variant="primary" className="w-full">
                    Tạo pin
                  </Button>
                </Card.Footer>
              </Form>
            </Card.Content>
          </Card>
        ) : null}

        <Card variant="secondary" className="rounded-xl border border-default-200 p-6">
          <Card.Header className="p-0">
            <Card.Title className="text-lg font-semibold">Marker types và pins</Card.Title>
            <Card.Description className="mt-2 text-sm text-default-500">
              Mở rộng từng marker type để xem các pins liên kết.
            </Card.Description>
          </Card.Header>

          <Separator className="my-4" />

          <Card.Content className="p-0">
            {pinTypes && pinTypes.length > 0 ? (
              <div className="flex flex-col gap-3">
                {pinTypes.map((pinType: PinTypeRow) => (
                  <PinTypeRow
                    key={pinType.id}
                    id={pinType.id}
                    created_at={pinType.created_at}
                    name={pinType.name}
                    icon={pinType.icon}
                    pinTypes={pinTypes.map((item) => ({ id: item.id, name: item.name, icon: item.icon }))}
                    pins={(pinsByTypeId[pinType.id] ?? []).map((pin) => ({
                      id: pin.id,
                      name: pin.name,
                      pin_type_id: pin.pin_type_id,
                      lat: pin.lat,
                      long: pin.long,
                      address: pin.address,
                      description: pin.description,
                      opening_days: pin.opening_days,
                      sponsored: pin.sponsored,
                    }))}
                  />
                ))}
              </div>
            ) : (
              <Card variant="transparent" className="border border-dashed border-default-200 p-4 shadow-none">
                <Card.Content className="p-0 text-sm text-default-500">
                  Chưa có marker type nào.
                </Card.Content>
              </Card>
            )}
          </Card.Content>
        </Card>
      </main>
    </Surface>
  );
}
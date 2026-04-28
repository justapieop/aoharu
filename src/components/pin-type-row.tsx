"use client";

import { useState } from "react";
import { Button, Card, Form, Input, Label, Modal, TextField } from "@heroui/react";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { deletePinAction, deletePinTypeAction, updatePinAction, updatePinTypeAction } from "@/app/admin/pins/actions";
import { WysiwygEditor } from "@/components/wysiwyg-editor";

interface PinItem {
  id: string;
  name: string;
  pin_type_id: string;
  lat: number;
  long: number;
  address: string | null;
  description: string | null;
  opening_days: string | null;
  sponsored: boolean;
}

interface PinTypeOption {
  id: string;
  name: string;
  icon: string;
}

interface PinTypeRowProps {
  id: string;
  created_at: string;
  name: string;
  icon: string;
  pinTypes: PinTypeOption[];
  pins: PinItem[];
}

const openingDayOptions = [
  { label: "T2", value: "0" },
  { label: "T3", value: "1" },
  { label: "T4", value: "2" },
  { label: "T5", value: "3" },
  { label: "T6", value: "4" },
  { label: "T7", value: "5" },
  { label: "CN", value: "6" },
];

function extractOpeningDaySet(openingDays: string | null): Set<string> {
  if (!openingDays) {
    return new Set();
  }

  let value = 0;
  if (openingDays.startsWith("\\x")) {
    value = parseInt(openingDays.slice(2), 16);
  } else {
    try {
      const decoded = atob(openingDays);
      value = decoded.length > 0 ? decoded.charCodeAt(0) : 0;
    } catch {
      value = 0;
    }
  }

  const selectedDays = new Set<string>();
  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    if ((value & (1 << dayIndex)) !== 0) {
      selectedDays.add(String(dayIndex));
    }
  }
  return selectedDays;
}

function PinCard({ pin, pinTypes }: { pin: PinItem; pinTypes: PinTypeOption[] }) {
  const [isPinEditOpen, setIsPinEditOpen] = useState(false);
  const [editedPinName, setEditedPinName] = useState(pin.name);
  const [editedPinTypeId, setEditedPinTypeId] = useState(pin.pin_type_id);
  const [editedPinLat, setEditedPinLat] = useState(String(pin.lat));
  const [editedPinLong, setEditedPinLong] = useState(String(pin.long));
  const [editedPinAddress, setEditedPinAddress] = useState(pin.address ?? "");
  const [editedOpeningDays, setEditedOpeningDays] = useState<Set<string>>(extractOpeningDaySet(pin.opening_days));
  const [editedPinSponsored, setEditedPinSponsored] = useState(pin.sponsored);

  const toggleOpeningDay = (dayValue: string) => {
    setEditedOpeningDays((current) => {
      const next = new Set(current);
      if (next.has(dayValue)) {
        next.delete(dayValue);
      } else {
        next.add(dayValue);
      }
      return next;
    });
  };

  return (
    <Card variant="transparent" className="border border-default-200 p-3 shadow-none">
      <Card.Header className="flex items-start justify-between gap-3 p-0">
        <div className="min-w-0">
          <Card.Title className="truncate text-sm font-semibold">{pin.name}</Card.Title>
          <Card.Description className="mt-1 text-xs text-default-500">
            Tọa độ: {pin.lat}, {pin.long}
          </Card.Description>
        </div>
        {pin.sponsored ? (
          <span className="rounded-full bg-warning-soft-hover px-2 py-1 text-[11px] font-semibold text-warning">
            Sponsored
          </span>
        ) : null}
      </Card.Header>

      <Card.Content className="mt-2 p-0 text-xs text-default-600">
        <p className="truncate">{pin.address || "Chưa có địa chỉ"}</p>
      </Card.Content>

      <Card.Footer className="mt-3 flex flex-wrap items-center justify-end gap-2 p-0">
        <Modal isOpen={isPinEditOpen} onOpenChange={setIsPinEditOpen}>
          <Modal.Trigger>
            <Button size="sm" variant="secondary">
              Sửa pin
            </Button>
          </Modal.Trigger>

          <Modal.Backdrop>
            <Modal.Container placement="center" size="md">
              <Modal.Dialog>
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>Chỉnh sửa pin</Modal.Heading>
                  <Card.Description className="mt-1 text-sm text-default-500">
                    Cập nhật thông tin pin này.
                  </Card.Description>
                </Modal.Header>

                <Modal.Body>
                  <Form
                    action={updatePinAction}
                    onSubmit={() => setIsPinEditOpen(false)}
                    className="flex flex-col gap-4"
                  >
                    <input type="hidden" name="id" value={pin.id} />

                    <TextField isRequired className="gap-1">
                      <Label htmlFor={`pin-name-${pin.id}`} className="text-sm font-medium">
                        Tên pin
                      </Label>
                      <Input
                        id={`pin-name-${pin.id}`}
                        name="name"
                        value={editedPinName}
                        onChange={(event) => setEditedPinName(event.target.value)}
                      />
                    </TextField>

                      <TextField isRequired className="gap-1">
                        <Label htmlFor={`pin-type-${pin.id}`} className="text-sm font-medium">
                          Marker type
                        </Label>
                        <select
                          id={`pin-type-${pin.id}`}
                          name="pin_type_id"
                          className="h-12 rounded-medium border border-default-200 bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
                          value={editedPinTypeId}
                          onChange={(event) => setEditedPinTypeId(event.target.value)}
                        >
                          {pinTypes.map((pinType) => (
                            <option key={pinType.id} value={pinType.id}>
                              {pinType.name} ({pinType.icon})
                            </option>
                          ))}
                        </select>
                      </TextField>

                    <div className="grid grid-cols-2 gap-3">
                      <TextField isRequired className="gap-1">
                        <Label htmlFor={`pin-lat-${pin.id}`} className="text-sm font-medium">
                          Vĩ độ
                        </Label>
                        <Input
                          id={`pin-lat-${pin.id}`}
                          name="lat"
                          type="number"
                          step="any"
                          value={editedPinLat}
                          onChange={(event) => setEditedPinLat(event.target.value)}
                        />
                      </TextField>

                      <TextField isRequired className="gap-1">
                        <Label htmlFor={`pin-long-${pin.id}`} className="text-sm font-medium">
                          Kinh độ
                        </Label>
                        <Input
                          id={`pin-long-${pin.id}`}
                          name="long"
                          type="number"
                          step="any"
                          value={editedPinLong}
                          onChange={(event) => setEditedPinLong(event.target.value)}
                        />
                      </TextField>
                    </div>

                    <TextField className="gap-1">
                      <Label htmlFor={`pin-address-${pin.id}`} className="text-sm font-medium">
                        Địa chỉ
                      </Label>
                      <Input
                        id={`pin-address-${pin.id}`}
                        name="address"
                        value={editedPinAddress}
                        onChange={(event) => setEditedPinAddress(event.target.value)}
                      />
                    </TextField>

                    <WysiwygEditor
                      key={isPinEditOpen ? "open" : "closed"}
                      name="description"
                      label="Mô tả"
                      placeholder="Mô tả chi tiết địa điểm (hỗ trợ định dạng rich text, không hỗ trợ upload media)."
                      initialValue={pin.description ?? ""}
                    />

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Opening days</p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {openingDayOptions.map((day) => (
                          <label
                            key={`${pin.id}-${day.value}`}
                            className="flex items-center gap-2 rounded-xl border border-default-200 px-3 py-2 text-sm text-foreground"
                          >
                            <input
                              type="checkbox"
                              name="opening_days"
                              value={day.value}
                              className="h-4 w-4 rounded border-default-300"
                              checked={editedOpeningDays.has(day.value)}
                              onChange={() => toggleOpeningDay(day.value)}
                            />
                            <span>{day.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`pin-image-${pin.id}`} className="text-sm font-medium">
                        Thay ảnh pin (tuỳ chọn)
                      </Label>
                      <input
                        id={`pin-image-${pin.id}`}
                        name="image"
                        type="file"
                        accept="image/*"
                        className="h-12 rounded-medium border border-default-200 bg-background px-3 text-sm outline-none transition-colors file:mr-3 file:rounded-md file:border-0 file:bg-default-100 file:px-3 file:py-1 file:text-sm file:font-medium focus:border-primary"
                      />
                    </div>

                    <label className="flex items-center gap-3 rounded-xl border border-default-200 px-3 py-3 text-sm text-foreground">
                      <input
                        type="checkbox"
                        name="sponsored"
                        className="h-4 w-4 rounded border-default-300"
                        checked={editedPinSponsored}
                        onChange={(event) => setEditedPinSponsored(event.target.checked)}
                      />
                      <span>Đánh dấu là sponsored</span>
                    </label>

                    <Card.Footer className="p-0">
                      <Button type="submit" variant="primary" className="w-full">
                        Lưu thay đổi pin
                      </Button>
                    </Card.Footer>
                  </Form>
                </Modal.Body>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>

        <Form action={deletePinAction} onSubmit={(e) => { if (!window.confirm("Bạn có chắc chắn muốn xóa pin này?")) e.preventDefault(); }}>
          <input type="hidden" name="id" value={pin.id} />
          <Button type="submit" variant="danger" size="sm">
            Xóa pin
          </Button>
        </Form>
      </Card.Footer>
    </Card>
  );
}

export function PinTypeRow({ id, created_at, name, icon, pinTypes, pins }: PinTypeRowProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [editedIcon, setEditedIcon] = useState(icon);

  return (
    <Card variant="default" className="border border-default-200 shadow-none">
      <Card.Content className="flex flex-col gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <MapPinIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <Card.Title className="truncate text-base font-semibold">{name}</Card.Title>
            <Card.Description className="truncate text-sm text-default-500">
              icon: {icon} • {pins.length} pin{pins.length > 1 ? "s" : ""}
            </Card.Description>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="tertiary"
            onPress={() => setIsExpanded((current) => !current)}
          >
            {isExpanded ? "Thu gọn pins" : "Mở rộng pins"}
          </Button>

          <span className="rounded-full bg-default-100 px-3 py-1 text-xs font-medium text-default-500">
            {new Date(created_at).toLocaleDateString("vi-VN")}
          </span>

          <Modal isOpen={isEditOpen} onOpenChange={setIsEditOpen}>
            <Modal.Trigger>
              <Button size="sm" variant="secondary">
                Chỉnh sửa
              </Button>
            </Modal.Trigger>

            <Modal.Backdrop>
              <Modal.Container placement="center" size="md">
                <Modal.Dialog>
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Heading>Chỉnh sửa marker type</Modal.Heading>
                    <Card.Description className="mt-1 text-sm text-default-500">
                      Cập nhật tên và icon của marker type này.
                    </Card.Description>
                  </Modal.Header>

                  <Modal.Body>
                    <Form
                      action={updatePinTypeAction}
                      onSubmit={() => setIsEditOpen(false)}
                      className="flex flex-col gap-4"
                    >
                      <input type="hidden" name="id" value={id} />

                      <TextField isRequired className="gap-1">
                        <Label htmlFor={`name-${id}`} className="text-sm font-medium">
                          Tên marker type
                        </Label>
                        <Input
                          id={`name-${id}`}
                          name="name"
                          value={editedName}
                          onChange={(event) => setEditedName(event.target.value)}
                          placeholder="Ví dụ: Điểm thu gom rác"
                        />
                      </TextField>

                      <TextField isRequired className="gap-1">
                        <Label htmlFor={`icon-${id}`} className="text-sm font-medium">
                          Icon
                        </Label>
                        <Input
                          id={`icon-${id}`}
                          name="icon"
                          value={editedIcon}
                          onChange={(event) => setEditedIcon(event.target.value)}
                          placeholder="Ví dụ: trash"
                        />
                      </TextField>

                      <Card.Footer className="p-0">
                        <Button type="submit" variant="primary" className="w-full">
                          Lưu thay đổi
                        </Button>
                      </Card.Footer>
                    </Form>
                  </Modal.Body>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>

          <Form action={deletePinTypeAction} onSubmit={(e) => { if (!window.confirm("Bạn có chắc chắn muốn xóa marker type này?")) e.preventDefault(); }}>
            <input type="hidden" name="id" value={id} />
            <Button type="submit" variant="danger" size="sm">
              Xóa
            </Button>
          </Form>
        </div>

        {isExpanded ? (
          pins.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 border-t border-default-200 pt-3 lg:grid-cols-2">
              {pins.map((pin) => <PinCard key={pin.id} pin={pin} pinTypes={pinTypes} />)}
            </div>
          ) : (
            <Card variant="transparent" className="border border-dashed border-default-200 p-3 shadow-none">
              <Card.Content className="p-0 text-sm text-default-500">
                Marker type này chưa có pin nào.
              </Card.Content>
            </Card>
          )
        ) : null}
      </Card.Content>
    </Card>
  );
}
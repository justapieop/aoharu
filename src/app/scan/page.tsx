"use client";

import { useState, useRef } from "react";
import { Surface, Button, Card, Spinner, ToggleButtonGroup, ToggleButton, Chip, CloseButton, Alert } from "@heroui/react";
import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  SparklesIcon,
  TrashIcon,
  LightBulbIcon,
  CakeIcon,
  FireIcon,
  CameraIcon,
  ArrowUpTrayIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const MODES = [
  {
    id: "trash",
    icon: TrashIcon,
    label: "Phân loại rác",
    description: "Chụp ảnh rác để biết cách xử lý đúng",
    prompt:
      "Bạn là chuyên gia phân loại rác thải. Hãy phân tích hình ảnh và xác định loại rác (hữu cơ, vô cơ, tái chế, nguy hại), sau đó hướng dẫn cách xử lý đúng. Trả lời hoàn toàn bằng tiếng Việt.",
  },
  {
    id: "diy",
    icon: LightBulbIcon,
    label: "Ý tưởng DIY",
    description: "Gợi ý tái chế sáng tạo từ đồ cũ",
    prompt:
      "Bạn là chuyên gia tái chế sáng tạo. Hãy phân tích hình ảnh đồ vật và gợi ý ít nhất 3 ý tưởng DIY thú vị, kèm hướng dẫn thực hiện ngắn gọn. Trả lời hoàn toàn bằng tiếng Việt.",
  },
  {
    id: "food",
    icon: CakeIcon,
    label: "Gợi ý món ăn",
    description: "Nhận diện nguyên liệu và gợi ý công thức",
    prompt:
      "Bạn là đầu bếp chuyên nghiệp. Hãy nhận diện các nguyên liệu trong hình ảnh và gợi ý ít nhất 2 món ăn có thể chế biến, kèm công thức ngắn gọn. Trả lời hoàn toàn bằng tiếng Việt.",
  },
  {
    id: "calories",
    icon: FireIcon,
    label: "Đo lượng Calo",
    description: "Ước tính calo từ ảnh món ăn của bạn",
    prompt:
      "Bạn là chuyên gia dinh dưỡng. Hãy nhận diện món ăn trong hình ảnh, ước tính lượng calo, và cung cấp thông tin dinh dưỡng cơ bản (protein, chất béo, carb). Trả lời hoàn toàn bằng tiếng Việt.",
  },
] as const;

type ModeId = typeof MODES[number]["id"];

export default function ScanPage() {
  const [selectedMode, setSelectedMode] = useState<ModeId>("trash");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const active = MODES.find((m) => m.id === selectedMode)!;
  const ActiveIcon = active.icon;

  const handleFileSelect = (file: File) => {
    setError(null);
    setResult(null);

    if (file.size > MAX_FILE_SIZE) {
      setError("Tệp không được vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFileSelect(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      const chunkSize = 8192;
      let binary = "";
      for (let i = 0; i < uint8.length; i += chunkSize) {
        binary += String.fromCharCode(...uint8.slice(i, i + chunkSize));
      }
      const base64 = btoa(binary);

      const supabase = createClient();
      const { data, error: fnError } = await supabase.functions.invoke("gemini-fetch", {
        body: {
          model: "gemini-2.5-flash",
          text: active.prompt,
          images: [
            {
              data: base64,
              mimeType: selectedFile.type,
            },
          ],
        },
      });

      if (fnError) throw fnError;

      setResult(data?.output ?? JSON.stringify(data));
    } catch (err: any) {
      setError(err.message ?? "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Surface variant="default" className="flex flex-col md:flex-row h-screen w-full">
      <Sidebar />

      <div className="flex-1 h-full overflow-y-auto flex flex-col lg:flex-row text-foreground">
        <main className={`flex-1 flex flex-col items-center px-3 py-6 pb-20 sm:pb-6 md:px-4 md:py-16 ${result ? "justify-start" : "justify-center"}`}>
          <Chip variant="primary" color="success" className="mb-3 sm:mb-5 shadow-lg shadow-green-900/40">
            <SparklesIcon className="w-4 h-4" />
            <Chip.Label>Công cụ AI</Chip.Label>
          </Chip>

          <h1 className="text-center text-2xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Trợ lý thông minh
          </h1>
          <p className="mt-2 sm:mt-3 text-center text-sm sm:text-base text-default-500">
            Chụp ảnh và để AI giúp bạn
          </p>

          <div className="mt-4 md:mt-8 w-full max-w-lg overflow-x-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            <ToggleButtonGroup
              selectionMode="single"
              disallowEmptySelection
              defaultSelectedKeys={["trash"]}
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0] as ModeId;
                if (key) { setSelectedMode(key); clearFile(); }
              }}
              className="bg-default-100 border border-default-200 rounded-full p-1 w-max mx-auto"
            >
              {MODES.map((mode, idx) => {
                const Icon = mode.icon;
                return (
                  <ToggleButton
                    key={mode.id}
                    id={mode.id}
                    className="flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-default-500 transition-all whitespace-nowrap data-selected:bg-primary/10 data-selected:text-primary"
                  >
                    {idx > 0 && <ToggleButtonGroup.Separator />}
                    <Icon className="w-4 h-4" />
                    {mode.label}
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
          </div>

          <div className="mt-5 md:mt-8 flex flex-col items-center gap-1">
            <Chip variant="secondary" color="accent">
              <ActiveIcon className="w-4 h-4" />
              <Chip.Label>{active.label}</Chip.Label>
            </Chip>
            <p className="mt-1 text-sm text-default-400">{active.description}</p>
          </div>

          <div className="mt-4 md:mt-6 w-full max-w-lg">
            {previewUrl ? (
              <Card variant="default" className="border-2 border-primary/30">
                <Card.Content className="flex flex-col items-center gap-4 p-4">
                  <div className="relative w-full">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full max-h-72 object-contain rounded-xl"
                    />
                    <CloseButton
                      onPress={clearFile}
                      aria-label="Xóa ảnh"
                      className="absolute top-2 right-2 bg-default-900/70 text-white hover:bg-default-900"
                    />
                  </div>

                  <p className="text-sm text-default-500 truncate max-w-full px-2">
                    {selectedFile?.name} &mdash; {((selectedFile?.size ?? 0) / 1024 / 1024).toFixed(2)} MB
                  </p>

                  <Button
                    variant="primary"
                    fullWidth
                    isPending={isLoading}
                    onPress={handleSubmit}
                  >
                    {isLoading ? (
                      <>
                        <Spinner size="sm" color="current" />
                        Đang phân tích...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-4 h-4" />
                        Phân tích với AI
                      </>
                    )}
                  </Button>
                </Card.Content>
              </Card>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-default-200 rounded-2xl transition-all hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="flex flex-col items-center gap-4 py-6 px-3 sm:gap-5 sm:py-10 sm:px-4">
                  <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                    <PhotoIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold">Nhấn để tải ảnh lên</p>
                    <p className="mt-1 text-sm text-default-400">
                      {active.description} &mdash; tối đa 10MB
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={(e) => { e.continuePropagation(); fileInputRef.current?.click(); }}
                    >
                      <CameraIcon className="w-4 h-4" />
                      Chụp ảnh
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={(e) => { e.continuePropagation(); fileInputRef.current?.click(); }}
                    >
                      <ArrowUpTrayIcon className="w-4 h-4" />
                      Tải lên
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <Alert status="danger" className="mt-4 w-full max-w-lg">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />
        </main>

        {result && (
          <aside className="w-full lg:w-120 lg:min-w-100 h-auto lg:h-full overflow-y-auto border-t lg:border-t-0 lg:border-l border-default-200 bg-default-50 p-4 sm:p-6">
            <Card variant="secondary">
              <Card.Header className="pb-2">
                <Card.Title className="flex items-center gap-2 text-base">
                  <SparklesIcon className="w-4 h-4 text-primary" />
                  Kết quả phân tích
                </Card.Title>
              </Card.Header>
              <Card.Content className="pt-0">
                <div className="text-sm text-default-700 leading-relaxed prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result}
                  </ReactMarkdown>
                </div>
              </Card.Content>
            </Card>
          </aside>
        )}
      </div>
    </Surface>
  );
}

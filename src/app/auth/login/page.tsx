"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, TextField, Label, Input, Button, Alert } from "@heroui/react"
import { login } from "../actions"

function LoginForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <Card className="w-full max-w-sm shrink-0">
      <Card.Header className="flex-col items-start px-6 pb-0 pt-6">
        <Card.Title className="text-2xl font-bold text-foreground">Đăng nhập</Card.Title>
        <Card.Description className="text-default-500 text-sm">Nhập thông tin để tiếp tục</Card.Description>
      </Card.Header>
      <Card.Content className="gap-4 px-6 py-6">
        {error && (
          <Alert status="danger" className="mb-4">
            <Alert.Content>
              <Alert.Title>{error}</Alert.Title>
            </Alert.Content>
          </Alert>
        )}
        
        <form className="flex flex-col gap-4" action={login}>
          <TextField isRequired className="gap-1">
            <Label htmlFor="email" className="font-medium text-sm">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Nhập email của bạn"
            />
          </TextField>
          <TextField isRequired className="gap-1">
            <Label htmlFor="password" className="font-medium text-sm">Mật khẩu</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Nhập mật khẩu của bạn"
            />
          </TextField>

          <Button
            variant="primary"
            type="submit"
            className="w-full font-medium mt-2"
          >
            Đăng nhập
          </Button>

          <div className="text-center text-sm font-medium mt-4">
            <span className="text-default-500">Chưa có tài khoản? </span>
            <Link href="/auth/register" className="text-accent hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </form>
      </Card.Content>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <Suspense fallback={<div className="text-default-500">Đang tải...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}

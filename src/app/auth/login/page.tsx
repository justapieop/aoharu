"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { TextField, Label, Input, Button, Alert } from "@heroui/react"
import { SparklesIcon } from "@heroicons/react/24/outline"
import { login } from "../actions"

function LoginForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col items-start">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Đăng nhập</h1>
        <p className="mt-2 text-default-500">Nhập thông tin của bạn để tiếp tục</p>
      </div>

      {error && (
        <Alert status="danger" className="mb-6">
          <Alert.Content>
            <Alert.Title>{error}</Alert.Title>
          </Alert.Content>
        </Alert>
      )}
      
      <form className="flex flex-col gap-5" action={login}>
        <TextField isRequired className="gap-1.5">
          <Label htmlFor="email" className="font-medium text-sm">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Nhập email của bạn"
            className="h-12 bg-default-50"
          />
        </TextField>
        <TextField isRequired className="gap-1.5">
          <Label htmlFor="password" className="font-medium text-sm">Mật khẩu</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Nhập mật khẩu của bạn"
            className="h-12 bg-default-50"
          />
        </TextField>

        <Button
          variant="primary"
          type="submit"
          className="mt-2 h-12 w-full text-base font-semibold shadow-md shadow-accent/20"
        >
          Đăng nhập
        </Button>

        <div className="mt-6 text-center text-sm">
          <span className="text-default-500">Chưa có tài khoản? </span>
          <Link href="/auth/register" className="font-semibold text-accent hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="flex w-full flex-col justify-center px-6 sm:px-12 lg:w-1/2 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-12 flex items-center gap-2 text-accent">
            <SparklesIcon className="h-8 w-8" />
            <span className="text-2xl font-bold tracking-tight">Bản đồ xanh</span>
          </div>
          <Suspense fallback={<div className="text-default-500">Đang tải...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-zinc-900">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/80 to-emerald-900/90 z-10 mix-blend-multiply" />
        <img 
          src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=2000&auto=format&fit=crop" 
          alt="Nature background" 
          className="absolute inset-0 w-full h-full object-cover opacity-60" 
        />
        <div className="relative z-20 flex flex-col justify-center h-full p-24 text-white">
          <h2 className="text-5xl font-extrabold tracking-tight mb-6">Kết nối cộng đồng<br/>Bảo vệ môi trường</h2>
          <p className="text-lg text-emerald-50/80 max-w-md leading-relaxed">
            Tham gia cùng hàng ngàn người khác trên Bản đồ xanh để cùng nhau xây dựng một môi trường xanh, sạch và đẹp hơn cho tương lai.
          </p>
        </div>
      </div>
    </div>
  )
}

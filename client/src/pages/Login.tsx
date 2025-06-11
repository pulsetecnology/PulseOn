import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { z } from "zod";
import Logo from "@/components/Logo";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória")
});

type LoginData = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setToken } = useSimpleAuth();
  const queryClient = useQueryClient();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      return apiRequest("/api/auth/login", "POST", data);
    },
    onSuccess: (response) => {
      localStorage.setItem("authToken", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      setToken(response.token);
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta"
      });
      
      // Redirecionar imediatamente
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Erro no login",
        description: error.message || "Email ou senha incorretos",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const handleRegisterClick = () => {
    setLocation("/setup");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo className="text-2xl" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Bem-vindo de volta!</h1>
          <p className="text-muted-foreground">Entre na sua conta para continuar</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar na conta</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Sua senha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground mb-4">Ainda não tem uma conta?</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleRegisterClick}
              >
                Criar nova conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
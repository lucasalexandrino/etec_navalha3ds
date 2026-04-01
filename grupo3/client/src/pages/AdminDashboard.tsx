import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Edit2, Trash2, LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"overview" | "services" | "barbers">(
    "overview"
  );

  const servicesQuery = trpc.services.list.useQuery();
  const barbersQuery = trpc.barbers.list.useQuery();
  const appointmentsQuery = trpc.appointments.listByClient.useQuery();

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  if (user?.role !== "admin") {
    navigate("/");
    return null;
  }

  const totalAppointments = appointmentsQuery.data?.length || 0;
  const totalServices = servicesQuery.data?.length || 0;
  const totalBarbers = barbersQuery.data?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
          <div className="flex items-center gap-4">
            <span className="text-slate-300">{user?.name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-800">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="barbers">Profissionais</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-slate-800 border-slate-700 p-6">
                <p className="text-slate-400 text-sm mb-2">Total de Agendamentos</p>
                <p className="text-3xl font-bold text-amber-600">{totalAppointments}</p>
              </Card>
              <Card className="bg-slate-800 border-slate-700 p-6">
                <p className="text-slate-400 text-sm mb-2">Serviços Ativos</p>
                <p className="text-3xl font-bold text-blue-600">{totalServices}</p>
              </Card>
              <Card className="bg-slate-800 border-slate-700 p-6">
                <p className="text-slate-400 text-sm mb-2">Profissionais</p>
                <p className="text-3xl font-bold text-green-600">{totalBarbers}</p>
              </Card>
              <Card className="bg-slate-800 border-slate-700 p-6">
                <p className="text-slate-400 text-sm mb-2">Taxa de Ocupação</p>
                <p className="text-3xl font-bold text-purple-600">
                  {totalBarbers > 0 ? Math.round((totalAppointments / totalBarbers) * 10) : 0}%
                </p>
              </Card>
            </div>

            {/* Recent Appointments */}
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Agendamentos Recentes
              </h3>
              {appointmentsQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                </div>
              ) : (
                <div className="space-y-3">
                  {appointmentsQuery.data?.slice(0, 5).map((apt) => (
                    <div
                      key={apt.id}
                      className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg"
                    >
                      <div>
                        <p className="text-white font-medium">
                          Agendamento #{apt.id}
                        </p>
                        <p className="text-sm text-slate-400">
                          {new Date(apt.startTime).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          apt.status === "scheduled"
                            ? "text-blue-400"
                            : apt.status === "completed"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {apt.status === "scheduled"
                          ? "Agendado"
                          : apt.status === "completed"
                          ? "Concluído"
                          : "Cancelado"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Gerenciar Serviços</h3>
              <Button 
                onClick={() => navigate("/admin/services")}
                className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Gerenciar Serviços
              </Button>
            </div>

            {servicesQuery.isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {servicesQuery.data?.map((service) => (
                  <Card
                    key={service.id}
                    className="bg-slate-800 border-slate-700 p-6 hover:border-amber-600 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-white mb-2">
                          {service.name}
                        </h4>
                        <p className="text-slate-400 text-sm mb-4">
                          {service.description}
                        </p>
                        <div className="flex gap-6">
                          <div>
                            <p className="text-xs text-slate-500">Preço</p>
                            <p className="text-amber-600 font-bold">
                              R$ {service.price}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Duração</p>
                            <p className="text-white font-medium">
                              {service.durationMinutes} min
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast.info("Editar serviço")}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => toast.success("Serviço removido")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Barbers Tab */}
          <TabsContent value="barbers" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Gerenciar Profissionais</h3>
              <Button className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Novo Profissional
              </Button>
            </div>

            {barbersQuery.isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {barbersQuery.data?.map((barber) => (
                  <Card
                    key={barber.id}
                    className="bg-slate-800 border-slate-700 p-6 hover:border-amber-600 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-white mb-2">
                          Profissional #{barber.id}
                        </h4>
                        <p className="text-slate-400 text-sm mb-4">
                          {barber.specialty || "Especialista em cortes"}
                        </p>
                        <div className="flex gap-6">
                          <div>
                            <p className="text-xs text-slate-500">Status</p>
                            <p
                              className={`font-medium ${
                                barber.isActive ? "text-green-400" : "text-red-400"
                              }`}
                            >
                              {barber.isActive ? "Ativo" : "Inativo"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast.info("Editar profissional")}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => toast.success("Profissional removido")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

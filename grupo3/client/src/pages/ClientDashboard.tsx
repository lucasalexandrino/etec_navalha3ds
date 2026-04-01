import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Calendar, Clock, User, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function ClientDashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<"upcoming" | "history">("upcoming");

  const appointmentsQuery = trpc.appointments.listByClient.useQuery();

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  if (user?.role !== "user") {
    navigate("/");
    return null;
  }

  const upcomingAppointments = appointmentsQuery.data?.filter(
    (apt) => apt.status === "scheduled" && new Date(apt.startTime) > new Date()
  ) || [];

  const pastAppointments = appointmentsQuery.data?.filter(
    (apt) => apt.status === "completed" || new Date(apt.startTime) <= new Date()
  ) || [];

  const displayedAppointments =
    filter === "upcoming" ? upcomingAppointments : pastAppointments;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Meus Agendamentos</h1>
          <div className="flex items-center gap-4">
            <span className="text-slate-300">{user?.name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <p className="text-slate-400 text-sm mb-2">Próximos Agendamentos</p>
            <p className="text-3xl font-bold text-amber-600">
              {upcomingAppointments.length}
            </p>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <p className="text-slate-400 text-sm mb-2">Agendamentos Concluídos</p>
            <p className="text-3xl font-bold text-green-600">
              {pastAppointments.filter((a) => a.status === "completed").length}
            </p>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <p className="text-slate-400 text-sm mb-2">Cancelados</p>
            <p className="text-3xl font-bold text-red-600">
              {appointmentsQuery.data?.filter((a) => a.status === "cancelled").length || 0}
            </p>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <Button
              onClick={() => navigate("/booking")}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              Novo Agendamento
            </Button>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={filter === "upcoming" ? "default" : "outline"}
            onClick={() => setFilter("upcoming")}
            className={
              filter === "upcoming"
                ? "bg-amber-600 hover:bg-amber-700"
                : ""
            }
          >
            Próximos
          </Button>
          <Button
            variant={filter === "history" ? "default" : "outline"}
            onClick={() => setFilter("history")}
            className={
              filter === "history"
                ? "bg-amber-600 hover:bg-amber-700"
                : ""
            }
          >
            Histórico
          </Button>
        </div>

        {/* Appointments List */}
        {appointmentsQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : displayedAppointments.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700 p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">
              {filter === "upcoming"
                ? "Você não tem agendamentos próximos"
                : "Você não tem histórico de agendamentos"}
            </p>
            {filter === "upcoming" && (
              <Button
                onClick={() => navigate("/booking")}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Agendar Agora
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {displayedAppointments.map((appointment) => (
              <Card
                key={appointment.id}
                className="bg-slate-800 border-slate-700 p-6 hover:border-amber-600 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-amber-600/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Agendamento #{appointment.id}
                        </h3>
                        <p className="text-sm text-slate-400">
                          Profissional #{appointment.barberId}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Data</p>
                        <p className="text-white font-medium">
                          {new Date(appointment.startTime).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Horário</p>
                        <p className="text-white font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(appointment.startTime).toLocaleTimeString(
                            "pt-BR",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Status</p>
                        <p
                          className={`font-medium ${
                            appointment.status === "scheduled"
                              ? "text-blue-400"
                              : appointment.status === "completed"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {appointment.status === "scheduled"
                            ? "Agendado"
                            : appointment.status === "completed"
                            ? "Concluído"
                            : "Cancelado"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Serviço</p>
                        <p className="text-white font-medium">
                          Serviço #{appointment.serviceId}
                        </p>
                      </div>
                    </div>

                    {appointment.notes && (
                      <p className="text-sm text-slate-400 italic">
                        Observações: {appointment.notes}
                      </p>
                    )}
                  </div>

                  {appointment.status === "scheduled" &&
                    new Date(appointment.startTime) > new Date() && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="ml-4"
                        onClick={() => {
                          toast.success("Agendamento cancelado com sucesso");
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

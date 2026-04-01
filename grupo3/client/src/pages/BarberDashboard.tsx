import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Calendar, Clock, User, LogOut } from "lucide-react";
import { useState } from "react";

export default function BarberDashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [viewMode, setViewMode] = useState<"day" | "week">("day");

  const appointmentsQuery = trpc.appointments.listByBarber.useQuery();

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  if (user?.role !== "barber") {
    navigate("/");
    return null;
  }

  const selectedDateObj = new Date(selectedDate);
  const dayAppointments = appointmentsQuery.data?.filter((apt) => {
    const aptDate = new Date(apt.startTime);
    return (
      aptDate.toDateString() === selectedDateObj.toDateString() &&
      apt.status === "scheduled"
    );
  }) || [];

  const weekStart = new Date(selectedDateObj);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const weekAppointments = appointmentsQuery.data?.filter((apt) => {
    const aptDate = new Date(apt.startTime);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return aptDate >= weekStart && aptDate <= weekEnd && apt.status === "scheduled";
  }) || [];

  const displayedAppointments = viewMode === "day" ? dayAppointments : weekAppointments;

  const nextAppointment = appointmentsQuery.data
    ?.filter((apt) => apt.status === "scheduled" && new Date(apt.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Minha Agenda</h1>
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <p className="text-slate-400 text-sm mb-2">Atendimentos Hoje</p>
            <p className="text-3xl font-bold text-amber-600">{dayAppointments.length}</p>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <p className="text-slate-400 text-sm mb-2">Atendimentos Esta Semana</p>
            <p className="text-3xl font-bold text-blue-600">{weekAppointments.length}</p>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <p className="text-slate-400 text-sm mb-2">Próximo Atendimento</p>
            <p className="text-sm text-amber-600 font-semibold">
              {nextAppointment
                ? new Date(nextAppointment.startTime).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Nenhum"}
            </p>
          </Card>
        </div>

        {/* View Controls */}
        <div className="flex gap-4 mb-6 items-center">
          <div className="flex gap-2">
            <Button
              variant={viewMode === "day" ? "default" : "outline"}
              onClick={() => setViewMode("day")}
              className={viewMode === "day" ? "bg-amber-600 hover:bg-amber-700" : ""}
            >
              Dia
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              onClick={() => setViewMode("week")}
              className={viewMode === "week" ? "bg-amber-600 hover:bg-amber-700" : ""}
            >
              Semana
            </Button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
          />
        </div>

        {/* Appointments List */}
        {appointmentsQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : displayedAppointments.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700 p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">
              {viewMode === "day"
                ? "Nenhum atendimento agendado para hoje"
                : "Nenhum atendimento agendado para esta semana"}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {displayedAppointments
              .sort(
                (a, b) =>
                  new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
              )
              .map((appointment) => (
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
                            Cliente #{appointment.clientId}
                          </h3>
                          <p className="text-sm text-slate-400">
                            Serviço #{appointment.serviceId}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
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
                          <p className="text-xs text-slate-500 mb-1">Duração</p>
                          <p className="text-white font-medium">
                            {Math.round(
                              (new Date(appointment.endTime).getTime() -
                                new Date(appointment.startTime).getTime()) /
                                60000
                            )}{" "}
                            min
                          </p>
                        </div>
                      </div>

                      {appointment.notes && (
                        <p className="text-sm text-slate-400 italic mt-4">
                          Observações: {appointment.notes}
                        </p>
                      )}
                    </div>

                    <Button
                      className="ml-4 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        // TODO: Mark as completed
                      }}
                    >
                      Concluir
                    </Button>
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

type BookingStep = "service" | "barber" | "datetime" | "confirm";

export default function Booking() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<BookingStep>("service");
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  const servicesQuery = trpc.services.list.useQuery();
  const barbersQuery = trpc.barbers.list.useQuery();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Faça login para agendar</h2>
          <p className="text-slate-600 mb-6">
            Você precisa estar logado para fazer um agendamento.
          </p>
          <Button onClick={() => navigate("/login")} className="w-full">
            Ir para Login
          </Button>
        </Card>
      </div>
    );
  }

  const handleNext = () => {
    if (step === "service" && !selectedService) {
      toast.error("Selecione um serviço");
      return;
    }
    if (step === "barber" && !selectedBarber) {
      toast.error("Selecione um profissional");
      return;
    }
    if (step === "datetime" && (!selectedDate || !selectedTime)) {
      toast.error("Selecione data e horário");
      return;
    }

    const steps: BookingStep[] = ["service", "barber", "datetime", "confirm"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: BookingStep[] = ["service", "barber", "datetime", "confirm"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            <div
              className={`flex-1 h-2 rounded-full mr-2 ${
                ["service", "barber", "datetime", "confirm"].indexOf(step) >= 0
                  ? "bg-amber-600"
                  : "bg-slate-700"
              }`}
            />
            <div
              className={`flex-1 h-2 rounded-full mr-2 ${
                ["barber", "datetime", "confirm"].indexOf(step) >= 0
                  ? "bg-amber-600"
                  : "bg-slate-700"
              }`}
            />
            <div
              className={`flex-1 h-2 rounded-full mr-2 ${
                ["datetime", "confirm"].indexOf(step) >= 0
                  ? "bg-amber-600"
                  : "bg-slate-700"
              }`}
            />
            <div
              className={`flex-1 h-2 rounded-full ${
                step === "confirm" ? "bg-amber-600" : "bg-slate-700"
              }`}
            />
          </div>
          <p className="text-slate-400 text-sm">
            Passo {["service", "barber", "datetime", "confirm"].indexOf(step) + 1} de 4
          </p>
        </div>

        <Card className="bg-slate-800 border-slate-700 p-8">
          {/* Step 1: Service Selection */}
          {step === "service" && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Escolha o Serviço</h2>
              {servicesQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                </div>
              ) : (
                <div className="space-y-3">
                  {servicesQuery.data?.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service.id)}
                      className={`w-full p-4 text-left rounded-lg border-2 transition ${
                        selectedService === service.id
                          ? "border-amber-600 bg-amber-600/10"
                          : "border-slate-600 bg-slate-700/50 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-white">{service.name}</p>
                          <p className="text-sm text-slate-400">{service.description}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {service.durationMinutes} minutos
                          </p>
                        </div>
                        <p className="text-amber-600 font-bold">R$ {service.price}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Barber Selection */}
          {step === "barber" && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Escolha o Profissional</h2>
              {barbersQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                </div>
              ) : (
                <div className="space-y-3">
                  {barbersQuery.data?.map((barber) => (
                    <button
                      key={barber.id}
                      onClick={() => setSelectedBarber(barber.id)}
                      className={`w-full p-4 text-left rounded-lg border-2 transition ${
                        selectedBarber === barber.id
                          ? "border-amber-600 bg-amber-600/10"
                          : "border-slate-600 bg-slate-700/50 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-amber-600/20 flex items-center justify-center">
                          <span className="text-amber-600 font-bold">
                            {barber.userId}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-white">Profissional #{barber.id}</p>
                          <p className="text-sm text-slate-400">
                            {barber.specialty || "Especialista em cortes"}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Date and Time Selection */}
          {step === "datetime" && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Escolha Data e Horário</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Horário
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
                  >
                    <option value="">Selecione um horário</option>
                    {[
                      "09:00",
                      "09:30",
                      "10:00",
                      "10:30",
                      "11:00",
                      "14:00",
                      "14:30",
                      "15:00",
                      "15:30",
                      "16:00",
                      "16:30",
                      "17:00",
                      "17:30",
                      "18:00",
                    ].map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === "confirm" && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Confirme seu Agendamento</h2>
              <div className="bg-slate-700/50 rounded-lg p-6 space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-400">Serviço:</span>
                  <span className="text-white font-semibold">
                    {
                      servicesQuery.data?.find((s) => s.id === selectedService)
                        ?.name
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Profissional:</span>
                  <span className="text-white font-semibold">
                    Profissional #{selectedBarber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Data:</span>
                  <span className="text-white font-semibold">{selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Horário:</span>
                  <span className="text-white font-semibold">{selectedTime}</span>
                </div>
                <div className="border-t border-slate-600 pt-4 flex justify-between">
                  <span className="text-slate-400">Valor:</span>
                  <span className="text-amber-600 font-bold text-lg">
                    R${" "}
                    {servicesQuery.data
                      ?.find((s) => s.id === selectedService)
                      ?.price.toString()}
                  </span>
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-6">
                Ao confirmar, você receberá uma confirmação por email com os detalhes do seu agendamento.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === "service"}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 bg-amber-600 hover:bg-amber-700 flex items-center justify-center gap-2"
            >
              {step === "confirm" ? "Confirmar Agendamento" : "Próximo"}
              {step !== "confirm" && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Scissors, Clock, Users, Star } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Scissors className="w-8 h-8 text-amber-600" />
            <h1 className="text-2xl font-bold text-white">Navalha Barbearia</h1>
          </div>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-slate-300 text-sm">{user?.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (user?.role === "admin") navigate("/admin");
                    else if (user?.role === "barber") navigate("/barber");
                    else navigate("/dashboard");
                  }}
                >
                  Meu Painel
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => navigate("/login")}>
                Entrar
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold text-white mb-6">
          Agendamentos Simples e Rápidos
        </h2>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Marque seu horário na Navalha Barbearia com facilidade. Escolha o serviço, o profissional e o horário que melhor se adequa à sua agenda.
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => navigate("/booking")}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Agendar Agora
          </Button>
          <Button size="lg" variant="outline" className="text-white border-slate-400">
            Saiba Mais
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
            <Clock className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Disponibilidade 24/7</h3>
            <p className="text-slate-400">
              Agende seu horário a qualquer momento, mesmo fora do horário de funcionamento.
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
            <Users className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Profissionais Experientes</h3>
            <p className="text-slate-400">
              Escolha entre nossos melhores barbeiros, cada um com sua especialidade.
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
            <Star className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Qualidade Premium</h3>
            <p className="text-slate-400">
              Serviços de alta qualidade com atenção aos detalhes e satisfação garantida.
            </p>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Nossos Serviços</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: "Corte", price: "R$ 50,00" },
            { name: "Barba", price: "R$ 40,00" },
            { name: "Sobrancelha", price: "R$ 20,00" },
            { name: "Combo", price: "R$ 80,00" },
          ].map((service) => (
            <div
              key={service.name}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-center hover:border-amber-600 transition"
            >
              <h3 className="text-lg font-semibold text-white mb-2">{service.name}</h3>
              <p className="text-amber-600 font-bold text-xl">{service.price}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 mt-20 py-12">
        <div className="container mx-auto px-4 text-center text-slate-400">
          <p>&copy; 2024 Navalha Barbearia. Todos os direitos reservados.</p>
          <p className="mt-2 text-sm">Rua Principal, 123 - São Paulo, SP | (11) 9999-9999</p>
        </div>
      </footer>
    </div>
  );
}

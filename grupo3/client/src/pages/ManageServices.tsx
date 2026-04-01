import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Edit2, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export default function ManageServices() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    durationMinutes: "",
  });

  const servicesQuery = trpc.services.list.useQuery();
  const createMutation = trpc.services.create.useMutation();
  const updateMutation = trpc.services.update.useMutation();
  const deleteMutation = trpc.services.delete.useMutation();

  if (!isAuthenticated || user?.role !== "admin") {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.durationMinutes) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          name: formData.name,
          description: formData.description,
          price: formData.price,
          durationMinutes: parseInt(formData.durationMinutes),
        });
        toast.success("Serviço atualizado com sucesso");
      } else {
        await createMutation.mutateAsync({
          name: formData.name,
          description: formData.description,
          price: formData.price,
          durationMinutes: parseInt(formData.durationMinutes),
        });
        toast.success("Serviço criado com sucesso");
      }

      setFormData({ name: "", description: "", price: "", durationMinutes: "" });
      setEditingId(null);
      setShowForm(false);
      servicesQuery.refetch();
    } catch (error) {
      toast.error("Erro ao salvar serviço");
    }
  };

  const handleEdit = (service: any) => {
    setFormData({
      name: service.name,
      description: service.description || "",
      price: service.price,
      durationMinutes: service.durationMinutes.toString(),
    });
    setEditingId(service.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja remover este serviço?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("Serviço removido com sucesso");
        servicesQuery.refetch();
      } catch (error) {
        toast.error("Erro ao remover serviço");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Gerenciar Serviços</h1>
          <Button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) {
                setEditingId(null);
                setFormData({ name: "", description: "", price: "", durationMinutes: "" });
              }
            }}
            className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Serviço
          </Button>
        </div>

        {showForm && (
          <Card className="bg-slate-800 border-slate-700 p-6 mb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
                  placeholder="Ex: Corte de Cabelo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
                  placeholder="Descrição do serviço"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
                    placeholder="50.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Duração (minutos) *
                  </label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 flex items-center justify-center gap-2"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ name: "", description: "", price: "", durationMinutes: "" });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}

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
                    <h3 className="text-lg font-semibold text-white mb-2">{service.name}</h3>
                    {service.description && (
                      <p className="text-slate-400 text-sm mb-4">{service.description}</p>
                    )}
                    <div className="flex gap-6">
                      <div>
                        <p className="text-xs text-slate-500">Preço</p>
                        <p className="text-amber-600 font-bold">R$ {service.price}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Duração</p>
                        <p className="text-white font-medium">{service.durationMinutes} min</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(service)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

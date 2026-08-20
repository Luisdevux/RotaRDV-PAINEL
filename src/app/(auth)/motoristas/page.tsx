// src/app/(auth)/motoristas/page.tsx

"use client";

import React, { useState } from "react";
import { useMotoristas } from "@/hooks/useMotoristas";
import { useVeiculos } from "@/hooks/useVeiculos";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { formatCPF, formatPlaca } from "@/lib/formatters";
import { 
  UserPlus, 
  Search, 
  Truck, 
  Trash2, 
  Edit3,
  Mail, 
  Phone, 
  Loader2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Usuario } from "@/types";

const motoristaSchema = z.object({
  nome: z.string().min(2, "Nome do motorista é obrigatório"),
  email: z.string().email("E-mail válido é obrigatório"),
  senha: z.string().min(6, "Mínimo 6 caracteres para acesso inicial").optional().or(z.literal("")),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  cargo: z.string().optional(),
  veiculo_id: z.string().optional(),
});

type MotoristaFormValues = z.infer<typeof motoristaSchema>;

const editMotoristaSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  cargo: z.string().optional(),
  veiculo_id: z.string().optional(),
});

type EditMotoristaFormValues = z.infer<typeof editMotoristaSchema>;

export default function MotoristasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVeiculoId, setSelectedVeiculoId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limite, setLimite] = useState(10);

  // Modais de Edição e Confirmação
  const [editingMotorista, setEditingMotorista] = useState<Usuario | null>(null);
  const [editVeiculoId, setEditVeiculoId] = useState<string>("nenhum");
  const [deletingMotorista, setDeletingMotorista] = useState<Usuario | null>(null);

  const { 
    data: motoristasData, 
    isLoading, 
    cadastrarMotorista, 
    isCadastrando, 
    atualizarMotorista, 
    isAtualizando, 
    desvincularMotorista, 
    isDesvinculando 
  } = useMotoristas(undefined, { page, limite });
  
  const { data: veiculosData } = useVeiculos({ limite: 100 });

  const motoristasList: Usuario[] = motoristasData?.docs || motoristasData?.items || (Array.isArray(motoristasData) ? motoristasData : []);
  const totalDocs = motoristasData?.totalDocs ?? motoristasData?.total ?? motoristasData?.count ?? motoristasList.length;
  const totalPages = motoristasData?.totalPages ?? motoristasData?.paginas ?? Math.max(1, Math.ceil(totalDocs / limite));
  const veiculosList = veiculosData?.docs || veiculosData?.items || (Array.isArray(veiculosData) ? veiculosData : []);

  const filteredMotoristas = motoristasList.filter((m) => {
    const term = searchTerm.toLowerCase();
    return (
      m.nome?.toLowerCase().includes(term) ||
      m.email?.toLowerCase().includes(term) ||
      m.cpf?.includes(term)
    );
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MotoristaFormValues>({
    resolver: zodResolver(motoristaSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    setValue: setValueEdit,
    formState: { errors: editErrors },
  } = useForm<EditMotoristaFormValues>({
    resolver: zodResolver(editMotoristaSchema),
  });

  const onSubmitCreate = async (data: MotoristaFormValues) => {
    await cadastrarMotorista({
      nome: data.nome,
      email: data.email,
      senha: data.senha || undefined,
      cpf: data.cpf ? data.cpf.replace(/\D/g, "") : undefined,
      telefone: data.telefone,
      cargo: data.cargo || "Motorista Rodoviário",
      veiculo_id: selectedVeiculoId || undefined,
    });
    reset();
    setSelectedVeiculoId("");
    setModalOpen(false);
  };

  const handleOpenEdit = (motorista: Usuario) => {
    setEditingMotorista(motorista);
    setValueEdit("nome", motorista.nome);
    setValueEdit("cpf", motorista.cpf || "");
    setValueEdit("telefone", motorista.telefone || "");
    setValueEdit("cargo", motorista.empresa?.cargo || "Motorista");
    const veicId = typeof motorista.veiculo_id === "object" ? motorista.veiculo_id?._id : motorista.veiculo_id;
    setEditVeiculoId(veicId || "nenhum");
  };

  const onSubmitEdit = async (data: EditMotoristaFormValues) => {
    if (!editingMotorista) return;
    await atualizarMotorista({
      id: editingMotorista._id,
      data: {
        nome: data.nome,
        cpf: data.cpf ? data.cpf.replace(/\D/g, "") : undefined,
        telefone: data.telefone,
        cargo: data.cargo,
        veiculo_id: editVeiculoId === "nenhum" ? null : editVeiculoId || undefined,
      },
    });
    setEditingMotorista(null);
  };

  const handleConfirmDesvincular = async () => {
    if (!deletingMotorista) return;
    await desvincularMotorista(deletingMotorista._id);
    setDeletingMotorista(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button variant="default" className="rounded-xl font-bold gap-2 shadow-md">
              <UserPlus className="h-4 w-4" />
              Cadastrar Motorista
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md">
            <form onSubmit={handleSubmit(onSubmitCreate)}>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">Cadastrar Novo Motorista</DialogTitle>
                <DialogDescription className="text-xs">
                  O condutor receberá instruções para acessar o aplicativo móvel RotaRDV.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 py-4">
                <div className="space-y-1">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: João Ferreira da Silva"
                    className="rounded-xl"
                    {...register("nome")}
                  />
                  {errors.nome && (
                    <p className="text-xs text-destructive">{errors.nome.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="joao.motorista@email.com"
                    className="rounded-xl"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="cpf">CPF (Opcional)</Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      className="rounded-xl"
                      {...register("cpf")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                    <Input
                      id="telefone"
                      placeholder="(11) 98888-7777"
                      className="rounded-xl"
                      {...register("telefone")}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="veiculo">Caminhão Vinculado (Opcional)</Label>
                  <Select
                    value={selectedVeiculoId}
                    onValueChange={setSelectedVeiculoId}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecione um veículo da frota" />
                    </SelectTrigger>
                    <SelectContent>
                      {veiculosList.map((v: any) => (
                        <SelectItem key={v._id} value={v._id}>
                          {formatPlaca(v.placa)} — {v.modelo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="senha">Senha Inicial (Opcional)</Label>
                  <Input
                    id="senha"
                    type="password"
                    placeholder="Deixe vazio para gerar e enviar por e-mail"
                    className="rounded-xl"
                    {...register("senha")}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="default" disabled={isCadastrando} className="font-bold">
                  {isCadastrando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    "Confirmar Cadastro"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Motoristas Table */}
      <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Motorista</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Veículo Vinculado</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                  Carregando motoristas...
                </TableCell>
              </TableRow>
            ) : filteredMotoristas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                  Nenhum motorista encontrado. Clique em &quot;Cadastrar Motorista&quot; para adicionar condutores à frota.
                </TableCell>
              </TableRow>
            ) : (
              filteredMotoristas.map((motorista) => {
                const veiculoInfo = typeof motorista.veiculo_id === "object" ? motorista.veiculo_id : null;

                return (
                  <TableRow key={motorista._id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border/80 shadow-sm shrink-0">
                          <AvatarImage 
                            src={motorista.foto_perfil || (motorista as any).foto || ""} 
                            alt={motorista.nome} 
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-primary/15 text-primary border border-primary/30 font-bold text-xs">
                            {motorista.nome ? motorista.nome.slice(0, 2).toUpperCase() : "MO"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-foreground text-sm leading-tight">{motorista.nome}</p>
                          <p className="text-xs text-muted-foreground">{motorista.empresa?.cargo || "Motorista"}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        <p className="flex items-center gap-1.5 text-foreground font-medium">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {motorista.email}
                        </p>
                        {motorista.telefone && (
                          <p className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            {motorista.telefone}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-foreground">
                      {formatCPF(motorista.cpf)}
                    </TableCell>

                    <TableCell>
                      {veiculoInfo ? (
                        <Badge variant="outline" className="gap-1.5 font-medium border-border">
                          <Truck className="h-3.5 w-3.5 text-primary" />
                          {formatPlaca(veiculoInfo.placa)} — {veiculoInfo.modelo}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Nenhum</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {motorista.status === "ativo" ? (
                        <Badge variant="success">Ativo</Badge>
                      ) : (
                        <Badge variant="destructive">Inativo</Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-xl"
                          onClick={() => handleOpenEdit(motorista)}
                          title="Editar motorista"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                          onClick={() => setDeletingMotorista(motorista)}
                          title="Desvincular motorista"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Controles de Paginação */}
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalDocs}
          itemsPerPage={limite}
          onPageChange={(newPage) => setPage(newPage)}
          onItemsPerPageChange={(newLimit) => {
            setLimite(newLimit);
            setPage(1);
          }}
          isLoading={isLoading}
        />
      </Card>

      {/* Modal de Edição do Motorista */}
      <Dialog open={Boolean(editingMotorista)} onOpenChange={(open) => !open && setEditingMotorista(null)}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmitEdit(onSubmitEdit)}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Editar Dados do Motorista</DialogTitle>
              <DialogDescription className="text-xs">
                Atualize o cadastro, telefone e veículo vinculado do condutor.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-4">
              <div className="space-y-1">
                <Label htmlFor="edit-nome">Nome Completo</Label>
                <Input
                  id="edit-nome"
                  className="rounded-xl"
                  {...registerEdit("nome")}
                />
                {editErrors.nome && (
                  <p className="text-xs text-destructive">{editErrors.nome.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-cpf">CPF</Label>
                  <Input
                    id="edit-cpf"
                    placeholder="000.000.000-00"
                    className="rounded-xl"
                    {...registerEdit("cpf")}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-telefone">Telefone</Label>
                  <Input
                    id="edit-telefone"
                    placeholder="(11) 98888-7777"
                    className="rounded-xl"
                    {...registerEdit("telefone")}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-cargo">Cargo / Função</Label>
                <Input
                  id="edit-cargo"
                  placeholder="Ex: Motorista Carreteiro"
                  className="rounded-xl"
                  {...registerEdit("cargo")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-veiculo">Caminhão Vinculado</Label>
                <Select
                  value={editVeiculoId}
                  onValueChange={setEditVeiculoId}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione um veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Nenhum veículo vinculado</SelectItem>
                    {veiculosList.map((v: any) => (
                      <SelectItem key={v._id} value={v._id}>
                        {formatPlaca(v.placa)} — {v.modelo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingMotorista(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="default" disabled={isAtualizando} className="font-bold">
                {isAtualizando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Elegante de Confirmação de Desvinculação */}
      <ConfirmDialog
        open={Boolean(deletingMotorista)}
        onOpenChange={(open) => !open && setDeletingMotorista(null)}
        title="Desvincular Motorista da Transportadora"
        description={`Tem certeza que deseja desvincular o motorista "${deletingMotorista?.nome}"? O condutor perderá o acesso às viagens e dados vinculados a esta empresa.`}
        confirmText="Sim, Desvincular"
        cancelText="Cancelar"
        variant="destructive"
        isLoading={isDesvinculando}
        onConfirm={handleConfirmDesvincular}
      />
    </div>
  );
}

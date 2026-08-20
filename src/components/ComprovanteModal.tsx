// src/components/ComprovanteModal.tsx

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Despesa } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Download, ExternalLink, ZoomIn, ZoomOut, RotateCw, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ComprovanteModalProps {
  despesa: Despesa | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComprovanteModal({ despesa, open, onOpenChange }: ComprovanteModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageError, setImageError] = useState(false);

  if (!despesa) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const resetTransform = () => {
    setZoom(1);
    setRotation(0);
    setImageError(false);
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(val) => {
        if (!val) resetTransform();
        onOpenChange(val);
      }}
    >
      <DialogContent className="max-w-3xl p-6">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                Comprovante da Nota Fiscal
                <Badge variant="outline" className="text-xs text-primary border-primary/30">
                  {despesa.tipo}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                {despesa.local ? `${despesa.local} • ` : ""}
                {formatDateTime(despesa.data)}
              </DialogDescription>
            </div>
            <p className="text-2xl font-black text-primary">
              {formatCurrency(despesa.valor_total)}
            </p>
          </div>
        </DialogHeader>

        {/* Image Container with Controls */}
        <div className="relative mt-2 flex flex-col items-center justify-center rounded-2xl border border-border/80 bg-black/40 overflow-hidden min-h-[380px] max-h-[500px]">
          {despesa.foto_anexo && !imageError ? (
            <div className="relative w-full h-[450px] flex items-center justify-center overflow-auto p-4">
              <div
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: "transform 0.2s ease",
                }}
                className="relative max-w-full max-h-full"
              >
                <img
                  src={despesa.foto_anexo}
                  alt="Comprovante de Despesa"
                  className="max-h-[420px] w-auto object-contain rounded-lg shadow-2xl"
                  onError={() => setImageError(true)}
                />
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground space-y-2">
              <ImageOff className="h-10 w-10 mx-auto opacity-40 text-muted-foreground" />
              <p className="font-semibold text-sm">
                {imageError ? "Comprovante não encontrado no storage ou link corrompido." : "Nenhum comprovante anexado a esta despesa."}
              </p>
            </div>
          )}

          {/* Floating Controls Bar */}
          {despesa.foto_anexo && !imageError && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-border shadow-lg">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handleZoomIn}
                title="Aumentar zoom"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handleZoomOut}
                title="Diminuir zoom"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handleRotate}
                title="Girar 90 graus"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <div className="h-4 w-px bg-border mx-1" />
              <a
                href={despesa.foto_anexo}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-foreground transition-colors"
                title="Abrir imagem original"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>

        {/* Despesa Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          {despesa.litros && (
            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
              <span className="text-muted-foreground block font-medium">Litragem</span>
              <span className="font-bold text-foreground">{despesa.litros} L</span>
            </div>
          )}
          {despesa.valor_litro && (
            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
              <span className="text-muted-foreground block font-medium">Valor / Litro</span>
              <span className="font-bold text-foreground">{formatCurrency(despesa.valor_litro)}</span>
            </div>
          )}
          {despesa.tipo_combustivel && (
            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
              <span className="text-muted-foreground block font-medium">Combustível</span>
              <span className="font-bold text-foreground">{despesa.tipo_combustivel}</span>
            </div>
          )}
          {despesa.km_atual && (
            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50">
              <span className="text-muted-foreground block font-medium">Odômetro</span>
              <span className="font-bold text-foreground">{despesa.km_atual} km</span>
            </div>
          )}
        </div>

        {despesa.descricao && (
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-xs">
            <span className="text-muted-foreground font-semibold block mb-1">Descrição / Observações:</span>
            <p className="text-foreground">{despesa.descricao}</p>
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {despesa.foto_anexo && (
            <Button
              variant="default"
              onClick={() => window.open(despesa.foto_anexo, "_blank")}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download da Foto
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

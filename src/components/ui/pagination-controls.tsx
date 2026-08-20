// src/components/ui/pagination-controls.tsx

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (limit: number) => void;
  isLoading?: boolean;
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  isLoading = false,
  className = "",
}: PaginationControlsProps) {
  // If no items, do not render pagination controls
  if (totalItems === 0) return null;

  const validTotalPages = Math.max(1, totalPages || Math.ceil(totalItems / itemsPerPage) || 1);
  const startItem = Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1);
  const endItem = Math.min(totalItems, currentPage * itemsPerPage);

  // Generate visible page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (validTotalPages <= maxVisible) {
      for (let i = 1; i <= validTotalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", validTotalPages);
      } else if (currentPage >= validTotalPages - 2) {
        pages.push(1, "...", validTotalPages - 3, validTotalPages - 2, validTotalPages - 1, validTotalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", validTotalPages);
      }
    }

    return pages;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border/80 bg-card/50 rounded-b-2xl ${className}`}>
      {/* Items Range and Total Counter */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          Mostrando <strong className="font-semibold text-foreground">{startItem}</strong> a{" "}
          <strong className="font-semibold text-foreground">{endItem}</strong> de{" "}
          <strong className="font-semibold text-foreground">{totalItems}</strong> registros
        </span>

        {/* Rows Per Page Selector */}
        {onItemsPerPageChange && (
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-border">
            <span>Exibir</span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(val) => onItemsPerPageChange(Number(val))}
              disabled={isLoading}
            >
              <SelectTrigger className="h-8 w-18 text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>por página</span>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1 || isLoading}
          title="Primeira Página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous Page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
          title="Página Anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page Number Buttons */}
        <div className="hidden sm:flex items-center gap-1 mx-1">
          {getPageNumbers().map((pageItem, index) => {
            if (pageItem === "...") {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-xs text-muted-foreground font-mono">
                  ...
                </span>
              );
            }

            const pageNum = Number(pageItem);
            const isCurrent = pageNum === currentPage;

            return (
              <Button
                key={`page-${pageNum}`}
                variant={isCurrent ? "default" : "outline"}
                size="sm"
                className={`h-8 w-8 p-0 text-xs font-semibold rounded-lg ${
                  isCurrent ? "pointer-events-none shadow-sm" : "hover:bg-muted"
                }`}
                onClick={() => onPageChange(pageNum)}
                disabled={isLoading}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        {/* Mobile Current Page Indicator */}
        <span className="sm:hidden px-2 text-xs font-semibold text-foreground">
          Pág. {currentPage} de {validTotalPages}
        </span>

        {/* Next Page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= validTotalPages || isLoading}
          title="Próxima Página"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last Page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onPageChange(validTotalPages)}
          disabled={currentPage >= validTotalPages || isLoading}
          title="Última Página"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

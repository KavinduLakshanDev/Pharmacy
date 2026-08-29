import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface Batch {
    batch_no: string;
    balance: number;
    unit_sales_price?: number;
    expiry_date?: string;
}

interface BatchSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    onSelect: (batch: Batch) => void;
}

export function BatchSelectionModal({ isOpen, onClose, product, onSelect }: BatchSelectionModalProps) {
    const { t } = useTranslation();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const batches = product?.batches || [];

    useEffect(() => {
        if (isOpen) {
            setSelectedIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % batches.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + batches.length) % batches.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (batches[selectedIndex]) {
                    onSelect(batches[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, batches, onSelect, onClose]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] rounded-[2rem] p-8 border-none shadow-2xl">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">{t('Select Batch')}</DialogTitle>
                    <DialogDescription className="text-sm text-gray-500 leading-relaxed">
                        {t('Multiple batches found for')}{' '}
                        <span className="font-black text-primary">{product?.name}</span>{' '}
                        <span className="text-gray-400 font-medium">({product?.sku || product?.barcode})</span>
                        
                        <div className="flex items-center gap-2 mt-4 bg-gray-50 w-fit px-3 py-1.5 rounded-lg border border-gray-100">
                            <div className="flex gap-1.5">
                                <span className="bg-white border border-gray-200 rounded px-1 text-[10px] font-bold text-gray-400">↑↓</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('Navigate')}</span>
                            </div>
                            <div className="w-px h-3 bg-gray-200"></div>
                            <div className="flex gap-1.5">
                                <span className="bg-white border border-gray-200 rounded px-1 text-[10px] font-bold text-gray-400">Enter</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('Select')}</span>
                            </div>
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-6 border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="border-b border-gray-100 hover:bg-transparent">
                                <TableHead className="font-bold text-gray-500 text-[11px] uppercase tracking-wider py-4 px-6">{t('Batch No')}</TableHead>
                                <TableHead className="font-bold text-gray-500 text-[11px] uppercase tracking-wider text-center">{t('Expiry')}</TableHead>
                                <TableHead className="font-bold text-gray-500 text-[11px] uppercase tracking-wider text-center">{t('Stock')}</TableHead>
                                <TableHead className="font-bold text-gray-500 text-[11px] uppercase tracking-wider text-right">{t('Retail Price')}</TableHead>
                                <TableHead className="font-bold text-gray-500 text-[11px] uppercase tracking-wider text-center">{t('Action')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {batches.map((batch: Batch, index: number) => (
                                <TableRow 
                                    key={batch.batch_no} 
                                    className={`group cursor-pointer transition-all border-b border-gray-50 last:border-0 ${selectedIndex === index ? 'bg-primary/10' : 'hover:bg-primary/5'}`}
                                    onClick={() => onSelect(batch)}
                                >
                                    <TableCell className="py-4 px-6">
                                        <div className={`font-bold transition-colors ${selectedIndex === index ? 'text-primary' : 'text-gray-700'}`}>
                                            {batch.batch_no}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-orange-600">
                                        {batch.expiry_date ? batch.expiry_date.split('T')[0] : '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${selectedIndex === index ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-600'}`}>
                                            {batch.balance}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="font-bold text-gray-900">
                                            Rs. {Number(batch.unit_sales_price || product?.price).toFixed(2)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button 
                                            size="sm" 
                                            className={`rounded-xl px-6 h-9 font-bold transition-all ${
                                                selectedIndex === index 
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-primary hover:text-white hover:border-primary'
                                            }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelect(batch);
                                            }}
                                        >
                                            {t('Select')}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <DialogFooter className="mt-8 flex justify-end">
                    <Button 
                        variant="ghost" 
                        onClick={onClose} 
                        className="rounded-xl px-10 h-11 font-bold text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                    >
                        {t('Cancel')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

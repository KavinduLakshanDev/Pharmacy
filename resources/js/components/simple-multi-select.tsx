// components/simple-multi-select.tsx
import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Option = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  inline?: boolean;
};

export function SimpleMultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options",
  className,
  inline = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle selection
  const handleSelect = (value: string) => {
    if (!selected.includes(value)) {
      onChange([...selected, value]);
    }
    setSearchTerm('');
    // Keep focus on the input
    setTimeout(() => {
      const input = containerRef.current?.querySelector('input');
      if (input) input.focus();
    }, 10);
  };
  
  // Handle removal
  const handleRemove = (value: string) => {
    onChange(selected.filter(item => item !== value));
  };
  
  // Filter options based on search term
  const filteredOptions = options.filter(option => 
    // Allow showing already selected options when searching
    (searchTerm || !selected.includes(option.value)) && 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Inline mode: search input + always-visible list below
  if (inline) {
    const allFiltered = options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className={`${className}`}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary mb-1"
        />
        {allFiltered.length > 0 && (
          <div className="border rounded-md max-h-[180px] overflow-y-auto">
            {allFiltered.map(option => {
              const isSelected = selected.includes(option.value);
              return (
                <div
                  key={option.value}
                  className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-gray-50 ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                  onClick={() => {
                    if (isSelected) {
                      onChange(selected.filter(v => v !== option.value));
                    } else {
                      onChange([...selected, option.value]);
                    }
                  }}
                >
                  <span>{option.label}</span>
                  {isSelected && <span className="text-xs text-blue-500">✓</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div 
        className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[38px] cursor-text"
        onClick={() => setIsOpen(true)}
      >
        {selected.map(value => {
          const option = options.find(o => o.value === value);
          return (
            <Badge key={value} variant="secondary" className="rounded-sm px-1 font-normal">
              {option?.label || value}
              <button
                type="button"
                className="ml-1 rounded-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(value);
                }}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          );
        })}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={selected.length === 0 ? placeholder : ''}
          className="flex-1 outline-none bg-transparent min-w-[50px]"
        />
      </div>
      
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
          {filteredOptions.map(option => (
            <div
              key={option.value}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => {
                handleSelect(option.value);
                setIsOpen(true); // Keep dropdown open after selection
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
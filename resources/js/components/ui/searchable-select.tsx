import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface SearchableSelectOption {
  value: string
  label: string
  sublabel?: string
}

interface SearchableSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  noOptionsText?: string
  className?: string
  searchable?: boolean
}

export default function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder,
  noOptionsText = "No results found",
  className,
  searchable = true,
}: SearchableSelectProps) {
  const [query, setQuery] = React.useState("")
  const normalizedQuery = query.trim().toLowerCase()
  const filteredOptions = React.useMemo(
    () =>
      searchable && normalizedQuery.length > 0
        ? options.filter((option) =>
            option.label.toLowerCase().includes(normalizedQuery) ||
            (option.sublabel && option.sublabel.toLowerCase().includes(normalizedQuery)),
          )
        : options,
    [normalizedQuery, options, searchable],
  )

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {searchable ? (
          <div className="px-3 pb-2 pt-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search..."
              className="w-full"
              onPointerDown={(event) => event.stopPropagation()}
            />
          </div>
        ) : null}
        {filteredOptions.length === 0 ? (
          <div className="px-8 py-2 text-sm text-muted-foreground">
            {noOptionsText}
          </div>
        ) : (
          filteredOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="flex flex-col">
                <span>{option.label}</span>
                {option.sublabel ? (
                  <span className="text-xs text-muted-foreground">{option.sublabel}</span>
                ) : null}
              </span>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}

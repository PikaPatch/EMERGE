import { useState,useEffect } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { API_BASE } from "@/components/utils/API_BASE";


interface CellMultiSelectProps {
  SM: string;
  TP: number;
  HighligtCells : string[];
  setHighligtCells;
  setActiveLin;
  setActiveFate;
  setLinCellInput;
  disabled?: boolean;
  setExpressionEnabled?: (enabled: boolean) => void;
}


export function CellMultiSelect({
  SM,
  TP,
  HighligtCells,
  setHighligtCells,
  setActiveLin,
  setActiveFate,
  setLinCellInput,
  disabled,
  setExpressionEnabled,
}: CellMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [cCellNames, setcCellNames] = useState([]);

  useEffect(() => {
      if (!TP || !SM) {
        console.log("require TP or SM or SMType");
        return;
      }
      const fetchData = async () => {
        try {
          //setLoading(true);
          const url = `${API_BASE}/CellDats/EmbCellListTP?SM=${SM}&TP=${TP}`;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const cArray = await response.json();
          setcCellNames(cArray);
        } catch (err) {
          setcCellNames([]);
        }
      };
      fetchData();
    }, [SM, TP]);

  const handleRemove = (cellName: string) => {
    setHighligtCells((prev) => prev.filter((x) => x !== cellName));
    setActiveFate('none');
    setActiveLin('none')
  };


  const handleClearAll = () => {
    setHighligtCells(() => [])
    setActiveFate('none');
    setActiveLin('none');
    setLinCellInput('');
    setExpressionEnabled(false);
  };


  // Multi-select: toggle cell in selection
  const toggleCell = (CellName) => {
    setHighligtCells(prev =>
      prev.includes(CellName)
        ? prev.filter(x => x !== CellName)      // just remove CellName
        : [...prev.filter(x => x !== 'All'), CellName]  // remove 'All' when adding
    );
    setExpressionEnabled(false);
    setActiveFate('none');
    setActiveLin('none');
    setLinCellInput('');
  };

  // Single select: replace selection and close popover
  const selectSingleCell = (CellName) => {
    setHighligtCells([CellName]);
    setActiveFate('none');
    setActiveLin('none');
    setLinCellInput('');
    setOpen(false);
    setExpressionEnabled(false);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {
            HighligtCells.length === 0 || HighligtCells.includes('All')
              ? "Select cells..."
              : `${HighligtCells.length} cell${HighligtCells.length > 1 ? 's' : ''} selected`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command
  filter={(value, search) => {
    if (!search) return 1;
    return value.toLowerCase().startsWith(search.toLowerCase()) ? 1 : 0;
  }}
>
            <CommandInput placeholder="Search cells..." />
            <CommandEmpty>No cell found.</CommandEmpty>
            <CommandList>
              <ScrollArea className="h-[300px]">
                <CommandGroup>
                  {cCellNames.map((cellName) => (
                    <CommandItem
                      key={cellName}
                      value={cellName}
                      onSelect={() => {}}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      {/* Checkbox area - multi-select */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCell(cellName);
                        }}
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary cursor-pointer flex-shrink-0",
                          HighligtCells.includes(cellName)
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </div>

                      {/* Cell name area - single select and close */}
                      <span
                        onClick={() => selectSingleCell(cellName)}
                        className="flex-1 cursor-pointer px-2 py-1 rounded"
                      >
                        {cellName}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>


      {HighligtCells.length > 0 && !HighligtCells.includes('All') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Selected ({HighligtCells.length})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-auto p-1 text-xs"
            >
              Clear all
            </Button>
          </div>
          <ScrollArea className="max-h-[120px] w-full ">
            <div className="flex flex-wrap gap-1 overflow-auto max-h-[120px]">
              {HighligtCells.map((cellName) => (
                <Badge
                  key={cellName}
                  variant="secondary"
                  className="text-xs gap-1"
                >
                  {cellName}
                  <button
                    onClick={() => handleRemove(cellName)}
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

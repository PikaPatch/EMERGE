import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectTrigger,
  SelectSeparator,
  SelectValue,
} from "@/components/ui/select";
import { SMList } from "@/components/utils/usefulobject";
import { cn } from "@/lib/utils";

interface Props {
  SM: string;
  setSM: (value: string) => void;
  // SMType: "CMap8" | "CShaper17" | "EmbSAM4567" | "EmbSAM89" | "MT_lag1" | "MT_pop1" | "MT_wee" ;
  // setSMType: (value: "CMap8" | "CShaper17" | "EmbSAM4567" | "EmbSAM89" | "MT_lag1" | "MT_pop1" | "MT_wee") => void;
  setEmpty?: (value:string) => void;
}

export const SMSelect = ({ SM, setSM,setEmpty }: Props) => {
  const handleValueChange = (newValue: string) => {
    setSM(newValue);
    // if (SMList.Natural.includes(newValue)) {
    //   // setSMType("CMap8");
    // } 
    // else if (SMList.CShaper.includes(newValue)) {
    //   // setSMType("CShaper17"); 
    // }
    // else if (SMList.EmbSAM4567.includes(newValue)) {
    //   setSMType("EmbSAM4567");
    // }
    // else if (SMList.EmbSAM89.includes(newValue)) {
    //   setSMType("EmbSAM89");
    // }
    // else if (SMList.MT_lag1.includes(newValue)) {
    //   setSMType("MT_lag1");
    // }
    // else if (SMList.MT_pop1.includes(newValue)) {
    //   setSMType("MT_pop1");
    // }
    // else if (SMList.MT_wee.includes(newValue)) {
    //   setSMType("MT_wee");
    // }
    setEmpty?.(newValue)
  };

  const triggerTheme = 
  SMList.Natural.includes(SM) ? "border-sky-400/60 hover:border-sky-400/90 text-sky-600 bg-sky-500/5 hover:bg-sky-500/10 focus:ring-sky-400/50" 
  : SMList.NaturalF.includes(SM) ? "border-violet-400/60 hover:border-violet-400/90 text-violet-600 bg-violet-500/5 hover:bg-violet-500/10 focus:ring-violet-400/50" 
  : SMList.Compress.includes(SM) ? "border-green-400/60 hover:border-green-400/90 text-green-600 bg-green-500/5 hover:bg-green-500/10 focus:ring-green-400/50" 
  : SMList.CompressF.includes(SM) ? "border-violet-400/60 hover:border-violet-400/90 text-violet-600 bg-violet-500/5 hover:bg-violet-500/10 focus:ring-violet-400/50" 
  : SMList.MT_lag1.includes(SM)  ? "border-pink-400/60 hover:border-pink-400/90 text-pink-600 bg-pink-500/5 hover:bg-pink-500/10 focus:ring-pink-400/50" 
  : SMList.MT_pop1.includes(SM)  ? "border-pink-400/60 hover:border-pink-400/90 text-pink-600 bg-pink-500/5 hover:bg-pink-500/10 focus:ring-pink-400/50" 
  : SMList.MT_wee.includes(SM)  ? "border-pink-400/60 hover:border-pink-400/90 text-pink-600 bg-pink-500/5 hover:bg-pink-500/10 focus:ring-pink-400/50"
  : "border-primary/40 hover:border-primary/70 bg-card/60 hover:bg-card/80 focus:ring-primary/50";

  return (
    <div className="hidden lg:flex flex-col items-end gap-3">
      <div className="flex items-center gap-2">
        <Select value={SM} onValueChange={handleValueChange}>
          <SelectTrigger
            className={cn(
              "w-52 border transition-all shadow-sm",
              triggerTheme
            )}
          >
            {/* Single source of truth: no manual dot here */}
            <SelectValue placeholder="Select embryo sample" />
          </SelectTrigger>

          <SelectContent className="min-w-[220px] max-h-[320px] p-1">

            <SelectGroup>
              <SelectLabel className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-sky-500 uppercase tracking-wider">
                Natural
                <span className="ml-auto text-[10px] font-normal text-muted-foreground normal-case tracking-normal">
                  {SMList.Natural.length} samples
                </span>
              </SelectLabel>

              
              {SMList.Natural.map((sample) => (
                <SelectItem
                  key={sample}
                  value={sample}
                  className={cn(
                    "rounded-md pl-6 text-sm transition-colors cursor-pointer",
                    "data-[highlighted]:bg-sky-500/10 data-[highlighted]:text-sky-600",
                    "data-[state=checked]:text-sky-600 data-[state=checked]:font-medium"
                  )}
                >
                  {/* Keep dot ONLY in the dropdown list, not in trigger */}
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-block w-1.5 h-1.5 rounded-full shrink-0",
                        SM === sample ? "bg-sky-400" : "bg-sky-400/30"
                      )}
                    />
                    {sample}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>

            <SelectSeparator className="my-1" />

              {/* ── NaturalF Group ── */}
            <SelectGroup>
              <SelectLabel className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-violet-500 uppercase tracking-wider">
                Natural (fast imaging)
                <span className="ml-auto text-[10px] font-normal text-muted-foreground normal-case tracking-normal">
                  {SMList.NaturalF.length} samples
                </span>
              </SelectLabel>

              {SMList.NaturalF.map((sample) => (
                <SelectItem
                  key={sample}
                  value={sample}
                  className={cn(
                    "rounded-md pl-6 text-sm transition-colors cursor-pointer",
                    "data-[highlighted]:bg-violet-500/10 data-[highlighted]:text-violet-600",
                    "data-[state=checked]:text-violet-600 data-[state=checked]:font-medium"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-block w-1.5 h-1.5 rounded-full shrink-0",
                        SM === sample ? "bg-violet-400" : "bg-violet-400/30"
                      )}
                    />
                    {sample}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>

            <SelectSeparator className="my-1" />

            {/* ── Compress Group ── */}
            <SelectGroup>
              <SelectLabel className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-green-500 uppercase tracking-wider">
                Mechanically-compressed
                <span className="ml-auto text-[10px] font-normal text-muted-foreground normal-case tracking-normal">
                  {SMList.Compress.length} samples
                </span>
              </SelectLabel>

              {SMList.Compress.map((sample) => (
                <SelectItem
                  key={sample}
                  value={sample}
                  className={cn(
                    "rounded-md pl-6 text-sm transition-colors cursor-pointer",
                    "data-[highlighted]:bg-green-500/10 data-[highlighted]:text-green-600",
                    "data-[state=checked]:text-green-600 data-[state=checked]:font-medium"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-block w-1.5 h-1.5 rounded-full shrink-0",
                        SM === sample ? "bg-green-400" : "bg-green-400/30"
                      )}
                    />
                    {sample}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>

            <SelectSeparator className="my-1" />

            {/* ── Mechanically compressed Group ── */}
            <SelectGroup>
              <SelectLabel className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-violet-500 uppercase tracking-wider">
                Mechanically-compressed (fast imaging)
                <span className="ml-auto text-[10px] font-normal text-muted-foreground normal-case tracking-normal">
                  {SMList.CompressF.length} samples
                </span>
              </SelectLabel>

              {SMList.CompressF.map((sample) => (
                <SelectItem
                  key={sample}
                  value={sample}
                  className={cn(
                    "rounded-md pl-6 text-sm transition-colors cursor-pointer",
                    "data-[highlighted]:bg-violet-500/10 data-[highlighted]:text-violet-600",
                    "data-[state=checked]:text-violet-600 data-[state=checked]:font-medium"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-block w-1.5 h-1.5 rounded-full shrink-0",
                        SM === sample ? "bg-violet-400" : "bg-violet-400/30"
                      )}
                    />
                    {sample}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>

            <SelectSeparator className="my-1" />

            {/* ── MT_lag Group ── */}
            <SelectGroup>
              <SelectLabel className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-pink-500 uppercase tracking-wider">
                Notch-signaling-blocked
                <span className="ml-auto text-[10px] font-normal text-muted-foreground normal-case tracking-normal">
                  {SMList.MT_lag1.length} samples
                </span>
              </SelectLabel>

              {SMList.MT_lag1.map((sample) => (
                <SelectItem
                  key={sample}
                  value={sample}
                  className={cn(
                    "rounded-md pl-6 text-sm transition-colors cursor-pointer",
                    "data-[highlighted]:bg-pink-500/10 data-[highlighted]:text-pink-600",
                    "data-[state=checked]:text-pink-600 data-[state=checked]:font-medium"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-block w-1.5 h-1.5 rounded-full shrink-0",
                        SM === sample ? "bg-pink-400" : "bg-pink-400/30"
                      )}
                    />
                    {sample}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>

            {/* ── MT_pop Group ── */}
            <SelectGroup>
              <SelectLabel className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-pink-500 uppercase tracking-wider">
                Wnt-signaling-blocked
                <span className="ml-auto text-[10px] font-normal text-muted-foreground normal-case tracking-normal">
                  {SMList.MT_pop1.length} samples
                </span>
              </SelectLabel>

              {SMList.MT_pop1.map((sample) => (
                <SelectItem
                  key={sample}
                  value={sample}
                  className={cn(
                    "rounded-md pl-6 text-sm transition-colors cursor-pointer",
                    "data-[highlighted]:bg-pink-500/10 data-[highlighted]:text-pink-600",
                    "data-[state=checked]:text-pink-600 data-[state=checked]:font-medium"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-block w-1.5 h-1.5 rounded-full shrink-0",
                        SM === sample ? "bg-pink-400" : "bg-pink-400/30"
                      )}
                    />
                    {sample}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>

            {/* ── MT_wee Group ── */}
            <SelectGroup>
              <SelectLabel className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-pink-500 uppercase tracking-wider">
                Cell-division-accelerated
                <span className="ml-auto text-[10px] font-normal text-muted-foreground normal-case tracking-normal">
                  {SMList.MT_wee.length} samples
                </span>
              </SelectLabel>

              {SMList.MT_wee.map((sample) => (
                <SelectItem
                  key={sample}
                  value={sample}
                  className={cn(
                    "rounded-md pl-6 text-sm transition-colors cursor-pointer",
                    "data-[highlighted]:bg-pink-500/10 data-[highlighted]:text-pink-600",
                    "data-[state=checked]:text-pink-600 data-[state=checked]:font-medium"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-block w-1.5 h-1.5 rounded-full shrink-0",
                        SM === sample ? "bg-pink-400" : "bg-pink-400/30"
                      )}
                    />
                    {sample}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>


          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
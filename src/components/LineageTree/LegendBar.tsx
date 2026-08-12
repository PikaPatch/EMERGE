import React from 'react';
import { ColorScaler,ColorScalerShape } from "@/components/utils/ColorScaler";

interface ColorGradientBarProps {
  range?: [number, number,number,number];
  Type : string;
}


export const ColorGradientBar: React.FC<ColorGradientBarProps> = ({
  range = [0,1,0.5,0.5],Type
}) => {
  const [min, max, mean, median] = range;
  let Scaler
  switch (Type) {
    case 'Exp':
      Scaler = ColorScaler([0,1]);
      break;
    case 'Shape':
      Scaler = ColorScalerShape(range);
      break;
    default:
      Scaler = ColorScaler([0,1]);
  }

  const STEPS = 64;
  const gradientStops = Array.from({ length: STEPS }, (_, i) => {
    const value = min + (i / (STEPS - 1)) * (max - min);
    return Scaler(value);
  }).join(", ");

  const gradientStyle = `linear-gradient(to right, ${gradientStops})`;

  return (
    <div className="space-y-3 text-xs">
      {/* Legend title */}
      <p className="text-xs text-muted-foreground mt-2">Level</p>
      
      <div className="flex items-start gap-4">
        {/* Gradient Bar Section */}
        <div className="flex-1 space-y-3">
          {/* <div
            className="w-full h-6 rounded border border-border"
            style={{
              background: `linear-gradient(to right, ${Scaler(min)}, ${Scaler(mean)}, ${Scaler(max)})`,
            }}
          /> */}
          <div style={{
            background: `linear-gradient(to right, ${gradientStops})`,
            height: "12px",
            width: "100%",
            borderRadius: "4px",
          }} />
          {/* <div style={{ background: gradientStyle }} /> */}
          {/* Min and Max labels */}
          <div className="flex justify-between text-xs font-medium text-muted-foreground">
            <span>{min.toFixed(2)}</span>
            <span>{max.toFixed(2)}</span>
          </div>
        </div>

        {/* NA Value Section */}
        <div className="space-y-3">
          <div
            className="w-3 rounded border border-border"
            style={{ backgroundColor: '#999999' , height: "12px"}}
          />
          {/* NA label */}
          <div className="text-xs font-medium text-muted-foreground text-center">
            NA
          </div>
        </div>
      </div>
    </div>
  );
};
import {  useMemo} from "react";
import { FateColor } from '@/config/FateColor';
import { LineageColor } from '@/config/LineageColor';
import { ColorGradientBar } from "@/components/LineageTree/LegendBar";

interface Props {
  MonoFate?: "mono" | "fate" | "lineage" | "expression" | "shape";
  Gene1N2?:[string,string]
  range?: [number, number,number,number]
}

const LegendBox = ({ MonoFate,Gene1N2 = ['Gene1','Gene2'],range }:Props) => {

  const Dual = useMemo<boolean>(() => {
      if (Gene1N2?.[0] && Gene1N2?.[1]) {
        return true;
      } else {
        return false;
      }
    }, [Gene1N2]);
    
  return (
    <>
      {MonoFate === 'fate' ? (
        <div className="absolute top-4 right-4 text-muted-foreground text-sm bg-card/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-border">
          <p className="font-medium mb-1 text-primary">Fate:</p>
          <p><span style={{ color: FateColor['Unspecified'] }}>&#9632;</span> Unspecified</p>
          <p><span style={{ color: FateColor['Skin'] }}>&#9632;</span> Skin</p>
          <p><span style={{ color: FateColor['Muscle'] }}>&#9632;</span> Muscle</p>
          <p><span style={{ color: FateColor['Pharynx'] }}>&#9632;</span> Pharynx</p>
          <p><span style={{ color: FateColor['Neuron'] }}>&#9632;</span> Neuron</p>
          <p><span style={{ color: FateColor['Intestine'] }}>&#9632;</span> Intestine</p>
          <p><span style={{ color: FateColor['Germ_Cell'] }}>&#9632;</span> Germline</p>
          <p><span style={{ color: FateColor['Death'] }}>&#9632;</span> Death</p>
          <p><span style={{ color: FateColor['Other'] }}>&#9632;</span> Other</p>
          
        </div>
      ) : MonoFate === 'lineage' ? (
        <div className="absolute top-4 right-4 text-muted-foreground text-sm bg-card/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-border">
          <p className="font-medium mb-1 text-primary">Lineage:</p>
          <p><span style={{ color: LineageColor['AB'] }}>&#9632;</span> AB</p>
          <p><span style={{ color: LineageColor['MS'] }}>&#9632;</span> MS</p>
          <p><span style={{ color: LineageColor['E'] }}>&#9632;</span> E</p>
          <p><span style={{ color: LineageColor['C'] }}>&#9632;</span> C</p>
          <p><span style={{ color: LineageColor['D'] }}>&#9632;</span> D</p>
          <p><span style={{ color: LineageColor['P4'] }}>&#9632;</span> P4</p>
        </div>
      ) : MonoFate === 'expression' && !Dual ? (
        <div className="absolute w-[16.25rem] top-4 right-4 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-border">
          <ColorGradientBar Type="Exp" />
        </div>
      ) : MonoFate === 'expression' && Dual ? (
        <div className="absolute w-[16.25rem] top-4 right-4 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-border">
          <p className="font-medium mb-1 text-primary">Color Legend:</p>
          <p>(expression {'>'} 0)</p>
          <p><span style={{ color: "blue" }}>&#9632;</span> <i>{Gene1N2[0]}</i></p>
          <p><span style={{ color: "red" }}>&#9632;</span> <i>{Gene1N2[1]}</i></p>
          <p><span style={{ color: "purple" }}>&#9632;</span> <i>{Gene1N2[0]}</i> & <i>{Gene1N2[1]}</i></p>
          <p><span style={{ color: "grey" }}>&#9632;</span> No Expression</p>
        </div>
      ) : MonoFate === 'shape' && range ? (
        <div className="absolute w-[16.25rem] top-4 right-4 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-border">
          <ColorGradientBar range={range} Type="Shape" />
        </div>
      )
       : null}
    </>
  );
};


export default LegendBox;

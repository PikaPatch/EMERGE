import { LineageColor2 } from '@/config/LineageColor';
import { ColorScaler,ColorScalerShape } from "@/components/utils/ColorScaler";

const { COL_ExpNaN,COL_NoExp } = {COL_ExpNaN:'white',COL_NoExp: '#333'};

export const expCol = (id, tp,ColorData) => {
  // no ColorData (when selecting gene)
  if (Object.keys(ColorData).length === 0 ){
    return COL_ExpNaN;
  }
  // if this is the special data
  if (tp<0){
    return COL_ExpNaN;
  }
  // if ColorData have no this cell or tp (before the expression data start)
  if (! (Object.keys(ColorData).includes(id)) ){
    return COL_ExpNaN;
  }

  let exp = 0;
  // SingleCell data
  if (typeof ColorData?.[id] === 'number') {
    exp = ColorData?.[id]
    const ExpScaler = ColorScaler(ColorData.Range);
    return ExpScaler(exp)
  }

  if (! (ColorData[id].hasOwnProperty(tp))){
    return COL_ExpNaN;
  }

  if (ColorData?.[id]?.[tp] >= 0 ) {
    exp = ColorData?.[id]?.[tp];
    const ExpColorScaler = ColorScaler(ColorData.Range);
    return ExpColorScaler(exp);
  } else {
    // at the tail of lineage tree
    return COL_NoExp;
  }
};

export const expCol2 = (id, tp,ColorData) => {
  // no ColorData (when selecting gene)
  if (Object.keys(ColorData).length === 0 ){
    return COL_ExpNaN;
  }
  // if this is the special data
  if (tp<0){
    return COL_ExpNaN;
  }
  // if ColorData have no this cell or tp (before the expression data start)
  if (! (Object.keys(ColorData).includes(id)) ){
    return COL_ExpNaN;
  }

  let exp = 0;
  // SingleCell data
  if (typeof ColorData?.[id] === 'number') {
    exp = ColorData?.[id]
    switch (exp) {
        case 0: return "grey";
        case 1: return "blue";
        case 2: return "red";
        case 3: return "purple";
        default: return "yellow";
      }
  }

  if (! (ColorData[id].hasOwnProperty(tp))){
    return COL_ExpNaN;
  }

  if (ColorData?.[id]?.[tp] >= 0 ) {
    exp = ColorData?.[id]?.[tp];
    const ExpColorScaler = ColorScaler(ColorData.Range);
    return ExpColorScaler(exp);
  } else {
    // at the tail of lineage tree
    return COL_NoExp;
  }
};

export const shapeCol = (id, tp,range,ColorData) => {
  // no ColorData (when selecting gene)
  if (Object.keys(ColorData).length === 0 ){
    return COL_ExpNaN;
  }
  // if this is the special data
  if (tp<0){
    return COL_ExpNaN;
  }
  // if ColorData have no this cell or tp (before the expression data start)
  if (! (ColorData.hasOwnProperty(id)) ){
    return COL_ExpNaN;
  }

  let exp = 0;
  // SingleCell data
  if (typeof ColorData?.[id] === 'number') {
    exp = ColorData?.[id]
    const Scaler = ColorScalerShape(range);
    return Scaler(exp)
  }

  if (! (ColorData[id].hasOwnProperty(tp))){
    return COL_ExpNaN;
  }

  if (ColorData?.[id]?.[tp] >= 0 ) {
    exp = ColorData?.[id]?.[tp];
    const ExpColorScaler = ColorScalerShape(range);
    return ExpColorScaler(exp);
  } else {
    // at the tail of lineage tree
    return COL_NoExp;
  }
}

export const getLineageColor = (cellID) => {
  // Iterate through lineage colors to find matching substring
  for (const [key, color] of Object.entries(LineageColor2)) {
    if (cellID.startsWith(key)) {
      return color;
    }
  }
  // Return default color if no match found
  return COL_NoExp; //  fallback
};
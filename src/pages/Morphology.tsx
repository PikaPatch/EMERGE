import { useState, useEffect, useCallback } from "react";
import { EMB3D } from "@/components/EmbModel/EMBglb";
import { ControlPanel } from "@/components/EmbModel/ControlPanel";
import { Navigation } from "@/components/Navigation";
import { Atom } from "lucide-react";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import * as THREE from "three";
import { SMSelect } from "@/components/utils/SMSelect";
import { SampleRange,SampleInitTP,DefaultCameraPosition } from "@/components/utils/usefulobject";
// import { API_BASE } from "@/components/utils/API_BASE";

const Index = () => {
  const [Resolution, setResolution] = useState<"High" | "Low">('Low');
  const [SM, setSM] = useState<string>("Sample7");
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>(DefaultCameraPosition[SM]);
  const [TP, setTP] = useState(SampleInitTP[SM]);
  
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  
  const [ShowLabel, setShowLabel] = useState<boolean>(false);

  const [MonoFate, setMonoFate] = useState<"mono" | "fate"|"lineage"|"expression"|"shape">("mono")
  const [MonoColor, setMonoColor] = useState<string>("#58D6FC"); 
  const [Fac,setFac] = useState<string>(""); 
  const [ShapeDataRange,setShapeDataRange] = useState<[number,number,number,number]>(null); 
  const [HighligtCells, setHighligtCells] = useState<string[]>(['All']);
  const [GID, setGID] = useState<string>("");
  const [GID2, setGID2] = useState<string>("");
  

  // single Cell
  const [ExpressionType, setExpressionType] = useState<"Reporters" | "SingleCell">("SingleCell");
  //const [ScDataSet, setScDataSet] = useState<string>("");
  const [ScGene, setScGene] = useState<string>("");
  const [ScGene2, setScGene2] = useState<string>("");
  const [BinaryScaling, setBinaryScaling] = useState<boolean>(false);
  const [threeScene, setThreeScene] = useState<THREE.Scene | null>(null);

  const [Gene1N2, setGene1N2] = useState<[string,string]>(['','']);

  const [expressionCutoff, setExpressionCutoff] = useState<number>(0);
  const [expressionEnabled, setExpressionEnabled] = useState<boolean>(false);

  const [ShowNuclei, setShowNuclei] = useState<boolean>(true);


  const handleDownloadModel = useCallback(() => {
    if (!threeScene) return;
    
    const exporter = new GLTFExporter();
    exporter.parse(
      threeScene,
      (gltf) => {
        const blob = new Blob([JSON.stringify(gltf)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${SM}_TP${TP}_model.gltf`;
        link.click();
        URL.revokeObjectURL(url);
      },
      (error) => {
        console.error('Export failed:', error);
      },
      { binary: false }
    );
  }, [threeScene, SM, TP]);

  // const handleResetCamera = () => {
  //   const defaultCameraPosition: [number, number, number] = [0, 0, -250];
  //   setCameraPosition(defaultCameraPosition);
  // };

  const handleResetCamera = () => {
    const defaultCameraPosition: [number, number, number] = DefaultCameraPosition[SM];
    setCameraPosition(defaultCameraPosition);
  };

  const handleViewPreset = (preset: "Dorsal" | "Anterior" | "Right") => {
    switch (preset) {
      case "Dorsal":
        setCameraPosition([0, -250, 0]);
        break;
      case "Anterior":
        setCameraPosition([250, 0, 0]);
        break;
      case "Right":
        setCameraPosition([0, 0, 250]);
        break;
    }
  };

  const EmptyBox = (newSM:string) => {
      setGID('');
      setGID2('');
      setScGene('');
      setThreeScene(null)
      setBinaryScaling(false)
      //setHighligtCells(['All'])
      setFac('');
      setMonoFate('mono');
      setMonoColor('#58D6FC')
      setExpressionType('Reporters')
      setShowLabel(false)
      setShapeDataRange(null)
      setCameraPosition(DefaultCameraPosition[newSM])
      setTP(TP > SampleRange[newSM] ? SampleRange[newSM] : TP )
      setTP(SampleInitTP[newSM])
      console.log(`from ${SM} to ${newSM}: TP:`, TP, `newTP`, SampleInitTP[newSM])
  }



  // Clear state when ExpressionType changes
  useEffect(() => {
    if (ExpressionType === 'SingleCell') {
      // Clear Reporters-related state
      setGID('');
    } else {
      // Clear SingleCell-related state
      // setScDataSet('');
      setScGene('');
    }
  }, [ExpressionType]);

  // Reset camera when sample changes
  useEffect(() => {
    handleResetCamera();
  }, [SM]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      {/* Header */}
      {/* <header className="border-b border-border bg-gradient-to-r from-background via-card/50 to-background backdrop-blur-sm sticky top-0 z-40"> */}
        <div className="w-full px-3 sm:px-6 py-3 sm:py-6 relative z-50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Atom className="w-6 h-6 text-primary-foreground" />
                </div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
                    Morphology
                  </span>
                  <span className="text-foreground ml-2">Map</span>
                </h1>
              </div>
              <p className="text-sm text-muted-foreground ml-13">
                Visualize <span className="font-semibold text-foreground ml-1">cell morphology</span> with cell lineage, cell fate, gene expression, and morphology feature patterns
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto relative z-50">
            <span className="hidden sm:inline text-sm text-white/60 whitespace-nowrap">
              Experimental condition
            </span>
            <SMSelect SM={SM} setSM={setSM} setEmpty={EmptyBox} />
          </div>

          </div>
        </div>
      {/* </header> */}

      {/* Main Content */}
      <main className="flex-1 w-full px-3 sm:px-6 py-3 sm:py-6">
        <div className="flex flex-col gap-6 lg:h-[calc(100vh-180px)]">
          {/* Top Section - 3D Viewer and Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:flex-1 lg:min-h-0">
            <div className="lg:col-span-3 order-1 lg:order-2
              rounded-xl border border-border overflow-hidden bg-card shadow-lg
              h-[300px] sm:h-[400px] lg:h-full">
                <EMB3D
                EmbMode='EMBobj'
                Resolution={Resolution}
                // time point and sample for which obj to load
                TP={TP}
                SM={SM}
                // color mode. cell fate or lineage or expression
                MonoFate={MonoFate}
                MonoColor={MonoColor}
                // which type of expression, reporter or single cell
                ExpressionType={ExpressionType}
                Gene1N2={Gene1N2}
                GID={GID}
                GID2={GID2}
                // ScDataSet={ScDataSet}
                ScGene={ScGene}
                ScGene2={ScGene2}
                
                // shape descritpr
                Fac={Fac}
                ShapeDataRange={ShapeDataRange}
                setShapeDataRange={setShapeDataRange}
                // which cells should be Highligted. Other cells will be transperant
                HighligtCells={HighligtCells}
                // some setting
                cameraPosition={cameraPosition}
                ShowLabel={ShowLabel}
                ShowNuclei={ShowNuclei}
                BinaryScaling={BinaryScaling}
                onSceneReady={setThreeScene}
                expressionCutoff={expressionCutoff}
                expressionEnabled={expressionEnabled}
              />
              {/* {SampleHasOBJ.includes(SM) ? (
                <EMB3D
                EmbMode='EMBobj'
                Resolution={Resolution}
                // time point and sample for which obj to load
                TP={TP}
                SM={SM}
                // color mode. cell fate or lineage or expression
                MonoFate={MonoFate}
                MonoColor={MonoColor}
                // which type of expression, reporter or single cell
                ExpressionType={ExpressionType}
                Gene1N2={Gene1N2}
                GID={GID}
                GID2={GID2}
                // ScDataSet={ScDataSet}
                ScGene={ScGene}
                ScGene2={ScGene2}
                
                // shape descritpr
                Fac={Fac}
                ShapeDataRange={ShapeDataRange}
                setShapeDataRange={setShapeDataRange}
                // which cells should be Highligted. Other cells will be transperant
                HighligtCells={HighligtCells}
                // some setting
                cameraPosition={cameraPosition}
                ShowLabel={ShowLabel}
                ShowNuclei={ShowNuclei}
                BinaryScaling={BinaryScaling}
                onSceneReady={setThreeScene}
                expressionCutoff={expressionCutoff}
                expressionEnabled={expressionEnabled}
              />) : (
                                    <div className="w-full h-full py-12 flex items-center justify-center bg-muted/50 border border-dashed">
                                      <p className="text-muted-foreground">No model available</p>
                                    </div>
                                  )} */}
              
            </div>
            {/* Right Panel - Controls and Info */}
            <div className="lg:col-span-1 order-2 lg:order-1 relative z-50 flex flex-col h-full">
                <ControlPanel
                  SM={SM}
                  Resolution={Resolution}
                  setResolution={setResolution}
                  MonoFate={MonoFate}
                  setMonoFate={setMonoFate}
                  MonoColor={MonoColor}
                  setMonoColor={setMonoColor}
                  HighligtCells={HighligtCells}
                  setHighligtCells={setHighligtCells}

                  TP={TP}
                  setTP={setTP}

                  onResetCamera={handleResetCamera}
                  onViewPreset={handleViewPreset}
                  
                  selectedCells={selectedCells}
                  onSelectedCellsChange={setSelectedCells}
                  setGene1N2={setGene1N2}
                  GID={GID}
                  GID2={GID2}
                  setGID={setGID}
                  setGID2={setGID2}
                  Fac={Fac}
                  setFac={setFac}
                  ShapeDataRange={ShapeDataRange}
                  ShowLabel={ShowLabel}
                  setShowLabel={setShowLabel}

                  //single cell
                  ExpressionType={ExpressionType}
                  setExpressionType={setExpressionType}
                  // single cell
                  //ScDataSet={ScDataSet}
                  //setScDataSet={setScDataSet}
                  ScGene={ScGene}
                  setScGene={setScGene}
                  ScGene2={ScGene2}
                  setScGene2={setScGene2}
                  BinaryScaling={BinaryScaling}
                  setBinaryScaling={setBinaryScaling}
                  onDownloadGLTF={handleDownloadModel}
                  isSceneReady={!!threeScene}
                  expressionCutoff={expressionCutoff}
                  setExpressionCutoff={setExpressionCutoff}
                  expressionEnabled={expressionEnabled}
                  setExpressionEnabled={setExpressionEnabled}
                  ShowNuclei={ShowNuclei}
                  setShowNuclei={setShowNuclei}
                />
            </div>
            {/* 3D Viewer */}
            

          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;

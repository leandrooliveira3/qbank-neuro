export interface ProcedureCase {
  id: string;
  title: string;
  kind: "angiography" | "aneurysm" | "stroke" | "carotid";
  patient: string;
  brief: string;
  target: string;
  targetT: number;
  initialView: { panY: 7; zoom: 1 };
  goal: string;
  references: string[];
}
export const procedureCases: ProcedureCase[] = [
  {
    id: "diagnostic",
    title: "Angiografia cerebral diagnóstica",
    kind: "angiography",
    patient: "Caso fictício · investigação vascular",
    brief:
      "Cateterize um território carotídeo, obtenha uma aquisição com contraste e repita em uma circulação posterior. Explore bifurcações orientando a ponta do guia.",
    target: "ICA-L-C2",
    targetT: 0.5,
    initialView: { panY: 7, zoom: 1 },
    goal: "Registrar aquisições seletivas carotídea e vertebrobasilar.",
    references: ["HARR_ARCH", "HARR_CAROTID", "BORDEN_ANGIO"],
  },
  {
    id: "saccular",
    title: "Embolização de aneurisma de ACI",
    kind: "aneurysm",
    patient: "Caso fictício · aneurisma sacular paraclinoideo E",
    brief:
      "O aneurisma integra a ACI C6 do nosso atlas. Navegue com guia e microcateter até o saco e observe a relação do coil com o colo e o vaso parental. A indicação terapêutica é pressuposta no cenário.",
    target: "sac",
    targetT: 0.55,
    initialView: { panY: 7, zoom: 1 },
    goal: "Posicionar microcateter no saco e destacar coils, preservando o vaso parental no modelo.",
    references: ["HARR_DEVICES", "KRINGS_DURA", "BOUTH"],
  },
  {
    id: "m1",
    title: "Trombectomia de ACM M1 E",
    kind: "stroke",
    patient: "Caso fictício · oclusão proximal de ACM E",
    brief:
      "A oclusão aparece na rede do polígono de Willis do atlas. Explore aspiração, retriever e técnica combinada. A visualização distal depende do estado do trombo e do contraste.",
    target: "CI-M1L",
    targetT: 0.55,
    initialView: { panY: 7, zoom: 1 },
    goal: "Remover o trombo virtual por interação do dispositivo e confirmar enchimento distal em nova aquisição.",
    references: ["HARR_DEVICES", "KRINGS_CIRCLE"],
  },
  {
    id: "cas",
    title: "Angioplastia e stent carotídeo E",
    kind: "carotid",
    patient: "Caso fictício · estenose cervical de ACI E",
    brief:
      "Uma lesão estreita a luz no início de C1. Manipule guia, sistema de proteção, balão e stent. A indicação de intervenção já está definida para este exercício.",
    target: "ICA-L-C1",
    targetT: 0.35,
    initialView: { panY: 7, zoom: 1 },
    goal: "Cobrir a lesão com o dispositivo, observar a expansão e documentar o resultado gráfico.",
    references: ["HARR_DEVICES", "HARR_CAROTID"],
  },
];

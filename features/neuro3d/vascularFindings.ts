/** Observations of the ORIGINAL source surface, not anatomical approvals.
 * Measurements are reproducible in neuro3d-vascular-geometry-audit.json.
 * They never relabel, deform or connect a mesh automatically.
 */
export const vascularFindings = new Map<string,string>();
const galenReview='Junção Galeno–seio reto pendente: Galeno é um trajeto ilustrativo com controles arbitrados; o seio reto é uma malha importada com rótulo ainda não homologado. A relação nominal de drenagem não comprova encontro das superfícies, óstio ou luz contínua. A auditoria mede apenas amostras do eixo contra vértices da geometria de projeção simplificada. Não houve ponte, deslocamento ou renomeação para esconder a discrepância.';
vascularFindings.set('great_cerebral_vein',galenReview);
vascularFindings.set('straight_sinus',galenReview);
for (const side of ["l","r"]) {
  vascularFindings.set(`maxillary_artery_${side}`,
    "Cobertura agrupada da fonte: a malha rotulada como maxilar contém nove componentes de vértices desconectados por lado. O rótulo não identifica cada fragmento nem demonstra por si as três porções e a continuidade dos ramos. Conferir origem, mandíbula, pterigóideos e fossa pterigopalatina. Os fragmentos não foram unidos nem renomeados automaticamente.");
  vascularFindings.set(`middle_meningeal_artery_${side}`,
    "Cobertura limitada da fonte: esta superfície tem cerca de 2,40 cm de extensão craniocaudal no referencial do atlas. A inspeção das projeções originais não demonstra uma árvore dural frontal/parietal completa. Não representa a totalidade da meníngea média; origem, passagem pelo forame espinhoso e ramos exigem conferência osteovascular.");
  vascularFindings.set(`accessory_branch_of_middle_meningeal_artery_${side}`,
    "Identidade a conciliar: o rótulo da fonte é ‘ramo acessório da meníngea média’. Não foi equiparado à artéria meníngea acessória da maxilar, cuja origem, passagem pelo forame oval e relações precisam de identificação própria.");
  vascularFindings.set(`sigmoid_sinus_${side}`,
    "Junção sigmoide–jugular em revisão: a distância mínima entre vértices das superfícies fornecidas é cerca de 0,68 cm. Amostragem, cortes e bulbo jugular precisam de inspeção; esse número não prova interrupção anatômica nem autoriza criar uma ponte.");
  vascularFindings.set(`internal_jugular_vein_${side}`,
    "Conferir bulbo e continuidade com o seio sigmoide. As superfícies fornecidas têm distância mínima entre vértices de cerca de 0,68 cm nessa junção; nenhuma conexão foi criada automaticamente.");
}

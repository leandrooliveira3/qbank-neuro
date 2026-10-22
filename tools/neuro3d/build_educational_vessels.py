"""Original, hand-authored educational vessel paths, in existing atlas cm.

NOT segmentations or measured 3D reconstructions. Literature supplies identities,
territories and relationships, NOT the numerical control points below. Never use
these paths as evidence of patency, calibre, anastomotic flow or device access.
"""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
A='https://neuroangio.org/anatomy-and-variants/'
V='https://neuroangio.org/venous-brain-anatomy/'
rows=[]
def add(id,name,parent,radius,points,group,reference,paired=True,branches=None,variant=False):
    rows.append(dict(id=id,name=name,parent=parent,radius=radius,paths=[points]+(branches or []),group=group,reference=reference,paired=paired,variant=variant))
def art(id,name,parent,r,p,g,ref='diagrams-and-drawings/',**kw):add(id,name,parent,r,p,g,A+ref,**kw)
def vein(id,name,parent,r,p,g='Venoso profundo',ref='internal-cerebral-vein/',**kw):add(id,name,parent,r,p,g,V+ref,**kw)
# ECA and maxillary: left-sided conceptual controls, mirrored for right.
g='Maxilar · mandibular e pterigóidea'
art('deep_auricular_artery','Artéria auricular profunda','maxillary_artery',.025,[[3.7,-4.2,.8],[4.1,-3.6,.2],[4.4,-3.2,-.1]],g)
art('anterior_tympanic_artery','Artéria timpânica anterior','maxillary_artery',.018,[[3.7,-4.2,.8],[3.5,-3.7,.45],[3.35,-3.2,.2]],g)
art('accessory_meningeal_artery','Artéria meníngea acessória','maxillary_artery',.035,[[3.6,-4.2,1.2],[3.05,-3.7,1.05],[2.7,-3.1,.85],[2.3,-2.5,.8]],g,'accessory-meningeal-artery/')
art('masseteric_artery','Artéria massetérica','maxillary_artery',.03,[[3.9,-4.1,2.1],[4.8,-4,2.3],[5.2,-4.5,2.6],[5.1,-5.4,3]],g)
art('pterygoid_branches_of_maxillary_artery','Ramos pterigóideos da maxilar','maxillary_artery',.025,[[3.5,-4.1,2],[3,-4.5,2.4],[2.8,-5.3,2.6]],g,branches=[[[3.5,-4.1,2],[3.9,-3.6,2.3],[4,-3,2.6]]])
g='Maxilar · pterigopalatina'
art('anterior_superior_alveolar_artery','Artéria alveolar superior anterior','infra_orbital_artery',.025,[[2.8,-3.2,5.7],[2.3,-3.9,6.4],[1.6,-4.7,6.8],[.8,-5.5,6.9]],g,'infraorbital-artery/')
art('middle_superior_alveolar_artery','Artéria alveolar superior média · variável','infra_orbital_artery',.02,[[3.1,-3.4,5.4],[3.1,-4.3,5.8],[2.8,-5.2,6.1]],g,'infraorbital-artery/',variant=True)
art('lesser_palatine_artery','Artéria palatina menor','descending_palatine_artery',.025,[[1.8,-4.8,4],[1.5,-5.8,3.8],[1.1,-6.1,3.1]],g)
art('pterygovaginal_artery','Artéria pterigovaginal','maxillary_artery',.023,[[2.8,-3.8,3.6],[2.1,-3.7,2.9],[1.6,-3.6,2.2]],g,'pterygovaginal-artery/')
art('artery_of_foramen_rotundum_from_maxillary','Artéria do forame redondo · contribuição maxilar','maxillary_artery',.022,[[2.8,-3.5,3.5],[2.7,-3.1,2.5],[2.6,-2.7,1.9]],g,'diagrams-and-drawings/')
art('sphenopalatine_artery','Artéria esfenopalatina','maxillary_artery',.045,[[2.8,-3.7,3.8],[2.1,-3.8,4],[1.4,-3.8,4.1],[.9,-3.9,4.3]],g)
# Intracranial branches and perforators; groups contain representative branches.
g='ACA · córtex e perfurantes'
art('recurrent_artery_of_heubner','Artéria recorrente de Heubner','anterior_cerebral_artery',.022,[[.6,1.2,3.1],[1.1,1.15,2.8],[1.6,1.1,2.5],[1.9,1.8,2.4]],g,'anterior-cerebral-artery/')
art('medial_lenticulostriate_arteries','Artérias lenticuloestriadas mediais','anterior_cerebral_artery',.016,[[.9,.8,2.6],[1,1.7,2.4],[1.1,2.3,2.1]],g,'anterior-cerebral-artery/',branches=[[[1.1,.8,2.5],[1.3,1.7,2.1],[1.4,2.2,1.9]]])
for id,name,p in [
 ('frontopolar_artery','Artéria frontopolar',[[.5,2.2,4],[.5,3.3,5.8],[.6,4.2,7.6]]),
 ('anterior_internal_frontal_artery','Artéria frontal interna anterior',[[.4,4.6,3.5],[.5,5.7,4.5],[.5,7.3,5.1],[.6,8.2,4.8]]),
 ('middle_internal_frontal_artery','Artéria frontal interna média',[[.4,5.2,1.8],[.4,6.6,2.4],[.5,8.2,2.7],[.5,9,2.5]]),
 ('posterior_internal_frontal_artery','Artéria frontal interna posterior',[[.4,5.2,.2],[.4,6.7,.5],[.5,8.5,.6],[.6,9.5,.2]]),
 ('paracentral_artery','Artéria paracentral',[[.4,5,-1],[.5,6.5,-1.4],[.5,8.5,-1.7],[.6,9.6,-2.1]]),
 ('superior_internal_parietal_artery','Artéria parietal interna superior',[[.4,4.6,-2.7],[.5,5.9,-3.5],[.6,7.2,-4.3],[.7,8.3,-4.8]]),
 ('inferior_internal_parietal_artery','Artéria parietal interna inferior',[[.4,4,-3.6],[.5,4.5,-5.1],[.6,5.1,-6.7],[.7,5.5,-7.5]])]:
 art(id,name,'pericallosal_artery',.035,p,g,'anterior-cerebral-artery/')
art('subcallosal_artery','Artéria subcalosa','anterior_communicating_artery',.02,[[0,1.2,3.1],[0,1.8,2.7],[0,2.7,2.8],[0,3.2,3.3]],g,'anterior-cerebral-artery/',paired=False)
g='ACM · divisões e córtex'
art('middle_cerebral_artery_m2_superior_division','ACM · divisão superior M2','middle_cerebral_artery_m1_segment',.085,[[3.7,1.6,2],[4.2,2.3,2],[4.7,3.1,2.2],[4.9,3.5,2.5]],g,'middle-cerebral-artery/')
art('middle_cerebral_artery_m2_inferior_division','ACM · divisão inferior M2','middle_cerebral_artery_m1_segment',.08,[[3.7,1.6,2],[4.4,1.9,1.1],[4.8,2.2,-.3],[5,2.5,-1.5]],g,'middle-cerebral-artery/')
art('middle_cerebral_artery_m4_cortical_branches','ACM · exemplos de ramos M4','middle_cerebral_artery_m2_superior_division',.045,[[4.9,3.5,2.5],[5.6,4.1,2.8],[6,5.5,2.5],[5.5,7,2]],g,'middle-cerebral-artery/',branches=[[[5,2.5,-1.5],[6,3.1,-2.1],[6.5,4.3,-3.6],[6,5.6,-4.6]]])
g='ACoP e ACP · perfurantes e coroideas'
art('anterior_thalamoperforating_arteries','Artérias talamoperfurantes anteriores','posterior_communicating_artery',.016,[[1.2,.3,.7],[.9,1.1,.3],[.8,2.1,-.2]],g,branches=[[[1.2,.2,.4],[1.1,1.2,-.1],[1.2,2.2,-.5]]])
art('posterior_thalamoperforating_arteries','Artérias talamoperfurantes posteriores · P1','posterior_cerebral_artery',.018,[[.6,-.2,.3],[.5,.8,-.2],[.5,1.8,-.7],[.7,2.5,-1.1]],g,branches=[[[.8,-.2,.1],[1,.9,-.4],[1.2,1.9,-.8]]])
art('thalamogeniculate_arteries','Artérias talamogeniculadas','posterior_cerebral_artery',.018,[[2.1,-.3,-1.5],[2.3,.5,-1.3],[2.1,1.4,-1.2]],g,branches=[[[2.2,-.3,-1.7],[2.5,.6,-1.8],[2.3,1.4,-2]]])
art('medial_posterior_choroidal_artery','Artéria coroidea posterior medial','posterior_cerebral_artery',.03,[[1.1,-.4,-.8],[.9,.4,-1.7],[.7,1,-2.8],[.4,1.6,-3.3],[.4,2,-2.4]],g)
art('lateral_posterior_choroidal_artery','Artéria coroidea posterior lateral','posterior_cerebral_artery',.03,[[2,-.3,-2],[2.3,.3,-2.8],[2.4,1.1,-3.7],[2.1,2.3,-3.9],[1.7,2.7,-3.2]],g)
g='ACP · córtex'
for id,name,p in [
 ('anterior_temporal_branch_of_pca','Ramo temporal anterior da ACP',[[2,-.4,-1.4],[2.8,-.8,-.9],[3.7,-1,.2],[4.4,-.8,.8]]),
 ('middle_temporal_branches_of_pca','Ramos temporais médios da ACP',[[2.5,-.2,-2.7],[3.4,-.7,-2.4],[4.4,-1,-1.8],[5,-.8,-1.2]]),
 ('posterior_temporal_branch_of_pca','Ramo temporal posterior da ACP',[[2.7,.5,-4],[3.7,.1,-4.5],[4.7,-.3,-5],[5.3,0,-5.5]]),
 ('calcarine_artery','Artéria calcarina',[[1,1,-4.4],[.8,1.7,-5.5],[.6,2.3,-7],[.6,2.3,-8.7]]),
 ('posterior_pericallosal_artery','Artéria pericalosa posterior · esplenial',[[1.2,1,-3.6],[.7,2,-3.9],[.4,3,-3.6],[.4,3.8,-2.9]])]:art(id,name,'posterior_cerebral_artery',.04,p,g)
g='ACI · sela e coroidea anterior'
art('superior_hypophyseal_arteries','Artérias hipofisárias superiores','internal_carotid_artery',.02,[[1.2,.1,2.4],[.8,.1,2],[.4,-.1,1.8]],g,'superior-hypophyseal-artery/',branches=[[[1.2,.1,2.4],[.7,.5,2.2],[.3,.6,2]]])
art('capsular_artery_of_mcconnell','Artéria capsular de McConnell','internal_carotid_artery',.018,[[1.6,-1.6,1],[1,-1.5,1.1],[.5,-1.2,1.2]],g)
art('anterior_choroidal_artery_plexal_branches','Coroidea anterior · ramos plexais','anterior_choroidal_artery',.025,[[2.9,1.2,-3.4],[2.8,1.7,-3],[2.6,1.6,-2.3],[2.5,1.1,-1.6]],g,'anterior-choroidal-artery/')
art('anterior_choroidal_artery_cisternal_perforators','Coroidea anterior · perfurantes cisternais','anterior_choroidal_artery',.015,[[1.9,-.2,.5],[2,.6,.6],[2,1.4,.3]],g,'anterior-choroidal-artery/',branches=[[[2,-.3,-.7],[2.2,.5,-.6],[2.3,1.2,-.8]]])
g='Cerebelo e tronco · ramos'
for id,name,parent,r,p in [
 ('medial_branch_of_pica','PICA · divisão medial/vermiana','posterior_inferior_cerebellar_artery',.045,[[2,-3.3,-4.4],[1.2,-3.1,-5.6],[.5,-2.9,-6.2],[.3,-2.4,-7]]),
 ('lateral_branch_of_pica','PICA · divisão lateral/hemisférica','posterior_inferior_cerebellar_artery',.045,[[2,-3.3,-4.4],[3,-3.4,-5.4],[4,-2.9,-6.3],[4.7,-2.3,-6.5]]),
 ('perforating_branches_of_pica','PICA · perfurantes bulbares','posterior_inferior_cerebellar_artery',.016,[[1.3,-3,-2],[.9,-2.7,-1.8],[.5,-2.5,-1.6]]),
 ('choroidal_branches_of_pica','PICA · ramos coroideos','posterior_inferior_cerebellar_artery',.02,[[1.5,-2.8,-4.8],[1,-2.1,-4.3],[.6,-1.7,-3.7]]),
 ('labyrinthine_artery','Artéria labiríntica · origem AICA ilustrada','anterior_inferior_cerebellar_artery',.018,[[2,-1.8,-1.3],[2.7,-1.9,-1.2],[3.4,-2.1,-.9],[3.9,-2.2,-.7]]),
 ('subarcuate_artery','Artéria subarqueada','anterior_inferior_cerebellar_artery',.018,[[2.4,-1.8,-1.5],[3.2,-1.8,-1.8],[3.8,-2,-2.1]]),
 ('perforating_branches_of_aica','AICA · perfurantes','anterior_inferior_cerebellar_artery',.015,[[.9,-1.8,-.9],[.7,-1.3,-1.2],[.5,-1,-1.5]]),
 ('cortical_branches_of_aica','AICA · exemplos de ramos corticais','anterior_inferior_cerebellar_artery',.035,[[3,-1.9,-1.7],[4,-2,-2.8],[4.8,-2,-4],[5,-1.5,-5]]),
 ('vermian_branch_of_superior_cerebellar_artery','ACS · ramo vermiano','superior_cerebellar_artery',.035,[[2,.3,-4],[1.3,.6,-4.9],[.6,.5,-5.7],[.3,.1,-6.4]]),
 ('hemispheric_branch_of_superior_cerebellar_artery','ACS · ramo hemisférico','superior_cerebellar_artery',.04,[[2,.3,-4],[3.2,.7,-4.6],[4.3,.6,-5.3],[5,.1,-5.9]]),
 ('perforating_branches_of_superior_cerebellar_artery','ACS · perfurantes','superior_cerebellar_artery',.016,[[.8,-.4,-.6],[.6,.1,-1],[.5,.6,-1.4]]),
 ('anterior_meningeal_branch_of_vertebral_artery','Vertebral · ramo meníngeo anterior','vertebral_artery',.02,[[1.2,-5,-2.4],[.8,-4.5,-2.1],[.5,-3.8,-1.7]]),
 ('posterior_meningeal_artery','Artéria meníngea posterior · origem vertebral ilustrada','vertebral_artery',.03,[[1.4,-4.5,-2.7],[1.5,-3.9,-3.8],[1.3,-3.1,-5.3],[1,-2.2,-6.6]])]:art(id,name,parent,r,p,g)
g='Cervical e medular · C1–C7 ilustrados'
art('superior_thyroid_artery','Artéria tireoidiana superior','external_carotid_artery',.07,[[3.3,-10,.3],[2.6,-10.6,1.4],[2,-12,2.2],[1.4,-13.2,2.4]],g)
art('ascending_cervical_artery','Artéria cervical ascendente','inferior_thyroid_artery',.035,[[2.2,-14,.1],[2.5,-12.5,-.6],[2.6,-10.5,-.9],[2.6,-8.5,-1.3],[2.4,-6.5,-1.5]],g)
art('posterior_spinal_artery','Artéria espinal posterior · segmento cervical','vertebral_artery',.025,[[1,-4.5,-2.8],[.4,-5.7,-3.8],[.35,-8,-4],[.35,-11,-4.1],[.35,-14,-4.2]],g)
art('lateral_spinal_artery','Artéria espinal lateral · segmento cervical','vertebral_artery',.025,[[1.2,-4.7,-2.7],[.8,-5.5,-3.1],[.7,-7,-3.2],[.65,-8.5,-3.3]],g)
art('segmental_spinal_arteries','Artérias segmentares espinais · exemplos cervicais','deep_cervical_artery',.035,[[2.5,-9,-4],[1.8,-9.1,-3.7],[1.2,-9.1,-3.5]],g,branches=[[[2.5,-11,-4],[1.8,-11.1,-3.7],[1.2,-11.1,-3.5]]])
art('radiculomedullary_arteries','Artérias radiculomedulares · exemplos cervicais','segmental_spinal_arteries',.02,[[1.2,-9.1,-3.5],[.7,-9.2,-3],[.2,-9.3,-2.8],[0,-9.3,-2.8]],g)
art('radiculopial_arteries','Artérias radiculopiais · exemplos cervicais','segmental_spinal_arteries',.02,[[1.2,-11.1,-3.5],[.8,-11.2,-3.8],[.4,-11.3,-4]],g)
art('radiculomeningeal_arteries','Artérias radiculomeníngeas · exemplos cervicais','segmental_spinal_arteries',.018,[[1.2,-9.1,-3.5],[1,-9.3,-4.2],[.6,-9.5,-4.6]],g)
art('sulcocommissural_arteries','Artérias sulcocomissurais · exemplos cervicais','anterior_spinal_artery',.012,[[.08,-7,-2.9],[.08,-7,-3.2],[.2,-7,-3.5]],g,branches=[[[.08,-8.5,-2.9],[.08,-8.5,-3.2],[.2,-8.5,-3.5]],[[.08,-10,-2.9],[.08,-10,-3.2],[.2,-10,-3.5]]])
g='ACE · ramos durais e cervicofaciais'
for id,name,parent,r,p in [
 ('posterior_auricular_artery','Artéria auricular posterior','external_carotid_artery',.045,[[3.7,-5.4,.1],[4.3,-4.6,-.4],[4.8,-3.3,-.9],[5,-1.5,-1.1]]),
 ('ascending_palatine_artery','Artéria palatina ascendente','facial_artery',.03,[[3.1,-8.3,1.4],[2.2,-7.3,1.9],[1.7,-6.1,2.4],[1.3,-5.5,3]]),
 ('tonsillar_branch_of_facial_artery','Ramo tonsilar da facial','facial_artery',.025,[[3.1,-8.3,1.4],[2.3,-7.7,2],[1.7,-6.8,2.5]]),
 ('parietal_branch_of_superficial_temporal_artery','Ramo parietal da temporal superficial','superficial_temporal_artery',.045,[[5.2,1.5,.3],[6,2.8,-.3],[6.6,4.5,-1.2],[6.1,6.3,-2]]),
 ('petrosal_branch_of_middle_meningeal_artery','Ramo petroso da meníngea média','middle_meningeal_artery',.018,[[2.7,-2.7,.9],[3,-2.6,.4],[3.4,-2.7,-.1]]),
 ('frontal_branch_of_middle_meningeal_artery','Ramo frontal da meníngea média','middle_meningeal_artery',.035,[[3.3,-1.4,.9],[4.5,.3,2],[5.5,2.7,3],[5.3,5.3,3.3],[4.1,7.4,3]]),
 ('parietal_branch_of_middle_meningeal_artery','Ramo parietal da meníngea média','middle_meningeal_artery',.035,[[3.3,-1.4,.9],[4.9,.4,-.2],[6,2.3,-1.7],[6.2,4.8,-3],[5.3,7,-3.9]]),
 ('petrosquamosal_branch_of_middle_meningeal_artery','Ramo petrosquamoso da meníngea média','middle_meningeal_artery',.025,[[3.3,-1.4,.9],[4,-1.5,-.4],[4.8,-1.4,-2],[5.3,-1.1,-3.6]]),
 ('stylomastoid_artery','Artéria estilomastóidea · origem auricular posterior ilustrada','posterior_auricular_artery',.02,[[4.3,-4.6,-.4],[3.8,-3.9,-.5],[3.5,-3.2,-.3],[3.4,-2.7,0]])]:art(id,name,parent,r,p,g)
# Deep venous ring. Curves run from collector toward tributary for study grouping,
# not an inferred flow direction. Numerical locations are original illustrations.
vein('great_cerebral_vein','Veia cerebral magna · Galeno','straight_sinus',.16,[[0,1.3,-4.7],[0,1.4,-4.1],[0,1.5,-3.5]],paired=False)
vein('internal_cerebral_vein','Veia cerebral interna','great_cerebral_vein',.085,[[.25,1.5,-3.5],[.35,1.9,-2.9],[.4,2.1,-1.4],[.4,2.1,.2],[.6,2,1.6]])
vein('basal_vein_of_rosenthal','Veia basal · Rosenthal','great_cerebral_vein',.075,[[.35,1.5,-3.6],[1.5,1.1,-3.1],[2.3,.5,-2],[2.1,.1,-.7],[1.9,.2,.6],[2.4,.5,1.6]],ref='basal-vein-of-rosenthal/')
for id,name,parent,r,p in [
 ('thalamostriate_vein','Veia talamoestriada','internal_cerebral_vein',.045,[[.6,2,1.6],[1.3,2.1,1.2],[1.6,2.4,.1],[1.9,2.5,-1.5],[2.1,2.5,-2.8]]),
 ('anterior_septal_vein','Veia septal anterior','internal_cerebral_vein',.035,[[.6,2,1.6],[.35,2.6,2.1],[.3,3.3,2.7],[.35,3.7,3.3]]),
 ('posterior_septal_vein','Veia septal posterior','internal_cerebral_vein',.025,[[.35,1.9,-2.9],[.3,2.6,-2.4],[.25,3,-1.7]]),
 ('direct_lateral_vein','Veia lateral direta · via alternativa','internal_cerebral_vein',.03,[[.4,2.1,-1.4],[1.2,2.4,-1.4],[1.9,2.5,-1.5]]),
 ('anterior_caudate_vein','Veia caudada anterior','thalamostriate_vein',.025,[[1.3,2.1,1.2],[1.7,2.8,1.7],[1.9,3.1,2.5]]),
 ('longitudinal_caudate_vein','Veia caudada longitudinal','thalamostriate_vein',.03,[[1.3,2.1,1.2],[1.7,3.2,1.2],[2,3.4,-.5],[2.3,3.1,-2.4]]),
 ('superior_choroidal_vein','Veia coroidea superior','internal_cerebral_vein',.03,[[.4,2.1,.2],[.8,2,-.8],[1.1,2.1,-2],[1.7,2.6,-3.5]]),
 ('inferior_ventricular_vein','Veia ventricular inferior','basal_vein_of_rosenthal',.035,[[2.3,.5,-2],[2.7,1,-2.4],[2.9,1.6,-3.1],[2.5,2.1,-4]]),
 ('deep_middle_cerebral_vein','Veia cerebral média profunda','basal_vein_of_rosenthal',.05,[[2.4,.5,1.6],[3.1,.8,1.7],[3.8,1.4,1.5],[4.4,2.1,1.2]]),
 ('inferior_striate_veins','Veias estriadas inferiores','deep_middle_cerebral_vein',.025,[[3.1,.8,1.7],[2.6,1.4,1.6],[2.3,2,1.3]]),
 ('uncal_vein','Veia uncal','basal_vein_of_rosenthal',.03,[[1.9,.2,.6],[2.4,-.1,.8],[2.8,-.3,1.1]])]:vein(id,name,parent,r,p,variant=id=='direct_lateral_vein')
g='Venoso superficial'
vein('superficial_middle_cerebral_vein','Veia cerebral média superficial · silviana','cavernous_sinus',.07,[[1.8,-.2,1.9],[3.4,.2,2.8],[5.2,1.6,3],[6.4,2.8,1.8],[6.9,3.1,.1]],g,'')
vein('superior_anastomotic_vein','Veia anastomótica superior · Trolard','superior_sagittal_sinus',.07,[[.2,9.5,.2],[2.5,9,.4],[4.7,7.2,.7],[6,5,.9],[6.4,2.8,1.8]],g,'')
vein('inferior_anastomotic_vein','Veia anastomótica inferior · Labbé','transverse_sinus',.07,[[5.4,-1,-4.4],[6.2,-.3,-3.7],[6.7,.6,-2.4],[6.8,1.6,-.9],[6.4,2.8,1.8]],g,'')
vein('superior_cerebral_veins','Veias cerebrais superiores · exemplos de pontes','superior_sagittal_sinus',.045,[[.2,8,4],[2,7.7,4.5],[3.9,6.6,5.3],[5.1,4.8,5]],g,'',branches=[[[.2,8,-4],[2.2,7.5,-4.7],[4,6,-5.4],[5.2,4.3,-6]]])
vein('inferior_cerebral_veins','Veias cerebrais inferiores · exemplos','transverse_sinus',.045,[[4.7,-1.3,-5.6],[5.3,-1.1,-4.4],[5.5,-.9,-2.9],[5.6,-.7,-1.4]],g,'')
vein('medullary_veins','Veias medulares cerebrais · exemplos','thalamostriate_vein',.018,[[1.8,2.5,-1.3],[2.5,3.3,-1.2],[3.4,4.2,-1],[4.4,5,-.8]],branches=[[[1.6,2.4,.1],[2.4,3.3,.8],[3.3,4.2,1.4],[4.2,5.2,1.9]]])
vein('transcerebral_veins','Veias transcerebrais · exemplos variáveis','superior_cerebral_veins',.018,[[3.9,6.6,5.3],[3.2,5.5,4.4],[2.2,4.1,3],[1.3,2.1,1.2]],variant=True)
g='Venoso · fossa posterior'
vein('precentral_cerebellar_vein','Veia pré-central cerebelar','great_cerebral_vein',.06,[[0,1.4,-4.1],[0,.8,-4.5],[0,0,-4.4],[0,-.7,-4]],g,'veins-posterior-fossa/',paired=False)
vein('superior_vermian_vein','Veia vermiana superior','great_cerebral_vein',.055,[[0,1.3,-4.5],[0,.9,-5.4],[0,.1,-6.4],[0,-.6,-7.1]],g,'veins-posterior-fossa/',paired=False)
for id,name,parent,r,p in [
 ('inferior_vermian_veins','Veias vermianas inferiores','confluence_of_sinuses',.045,[[.3,-1.5,-7.9],[.5,-2.3,-7.1],[.6,-3,-6],[.5,-3.3,-4.8]]),
 ('petrosal_vein','Veia petrosa · coletor','superior_petrosal_sinus',.07,[[3.5,-1.3,-2.3],[2.8,-1.2,-2.6],[2.1,-1.1,-2.9]]),
 ('lateral_mesencephalic_vein','Veia mesencefálica lateral','petrosal_vein',.04,[[2.1,-1.1,-2.9],[1.9,-.3,-2.7],[1.7,.3,-2.5],[1.6,.9,-2.8]]),
 ('lateral_medullary_vein','Veia bulbar lateral','petrosal_vein',.035,[[2.1,-1.1,-2.9],[1.5,-2,-2.8],[1,-3,-2.6],[.8,-4,-2.9]]),
 ('cerebellopontine_fissure_vein','Veia da fissura cerebelopontina','petrosal_vein',.045,[[2.8,-1.2,-2.6],[2.4,-1.7,-3.5],[2.1,-2.5,-4.1],[1.5,-2.8,-4.3]]),
 ('superior_hemispheric_cerebellar_veins','Veias cerebelares hemisféricas superiores · exemplos','petrosal_vein',.045,[[2.8,-1.2,-2.6],[3.5,-.7,-3.7],[4,.1,-5],[3.4,.4,-6.3]]),
 ('inferior_hemispheric_cerebellar_veins','Veias cerebelares hemisféricas inferiores · exemplos','transverse_sinus',.045,[[4.8,-1.3,-5.8],[4.2,-2,-6.7],[3.2,-2.8,-6.7],[2.4,-3.3,-5.7]])]:vein(id,name,parent,r,p,g,'veins-posterior-fossa/')
vein('anterior_pontomesencephalic_vein','Veia pontomesencefálica anterior','petrosal_vein_l',.04,[[2.1,-1.1,-2.9],[.8,-1.2,-.9],[0,-.9,-.5],[0,.1,-.5]],g,'veins-posterior-fossa/',paired=False)
vein('anterior_pontomedullary_vein','Veia pontobulbar anterior','anterior_pontomesencephalic_vein',.035,[[0,-.9,-.5],[0,-2,-1],[0,-3.2,-1.8],[0,-4.1,-2.6]],g,'veins-posterior-fossa/',paired=False)
g='Venoso · seios e base do crânio'
vein('confluence_of_sinuses','Confluência dos seios · torcular','superior_sagittal_sinus',.18,[[0,-1.5,-8],[.2,-1.5,-7.7],[.6,-1.5,-7.6]],g,'',paired=False,branches=[[[0,-1.5,-8],[-.3,-1.5,-7.8],[-.6,-1.5,-7.6]]])
vein('marginal_sinus','Seio marginal · anel perimagno','occipital_sinus',.07,[[0,-4,-2.9],[1.3,-4,-3.3],[1.7,-4,-4.3],[0,-4,-5.1],[-1.7,-4,-4.3],[-1.3,-4,-3.3],[0,-4,-2.9]],g,'',paired=False)
vein('falcine_sinus','Seio falcino persistente · variante','superior_sagittal_sinus',.07,[[0,8,-4.5],[0,6,-4.3],[0,4,-4],[0,1.5,-3.8]],g,'',paired=False,variant=True)
vein('sphenoparietal_sinus','Seio esfenoparietal · representação convencional','cavernous_sinus',.055,[[1.6,-.2,2],[2.7,0,2.7],[3.9,.2,3.1],[4.6,.5,3.2]],g,'cavernous-sinus/')
vein('sphenobasal_sinus','Seio esfenobasal · variante','pterygoid_venous_plexus',.055,[[2.5,-4,2],[2.8,-3.1,2.1],[3,-1.8,2.4],[3.4,.2,2.8]],g,'',variant=True)
vein('sphenopetrosal_sinus','Seio esfenopetroso · variante','transverse_sinus',.055,[[5.5,-1.2,-4.3],[4.7,-.9,-3],[3.9,-.5,-1.2],[3.4,.2,2.8]],g,'',variant=True)
g='Venoso · emissárias e plexos'
vein('pterygoid_venous_plexus','Plexo venoso pterigóideo · malha ilustrativa','maxillary_veins',.04,[[3.4,-5,1.8],[2.8,-4.4,2.6],[3.2,-3.6,3.4],[4,-3.8,3],[4.3,-4.6,2.3],[3.4,-5,1.8]],g,'cavernous-sinus/',branches=[[[3.4,-5,1.8],[3.5,-4.2,2.7],[3.2,-3.6,3.4]],[[2.8,-4.4,2.6],[3.5,-4.2,2.7],[4.3,-4.6,2.3]]])
vein('diploic_veins','Veias diploicas · exemplos','superior_sagittal_sinus',.03,[[.2,8.2,3.8],[2.7,7.6,4.5],[4.9,5.8,4.5],[5.7,3.7,4]],g,'',branches=[[[2.7,7.6,4.5],[3.4,7.2,2.6],[4.7,5.9,1.4]]])
vein('mastoid_emissary_vein','Veia emissária mastoidea','sigmoid_sinus',.045,[[5,-2,-3.6],[5.5,-2.1,-3.8],[5.9,-2.2,-4.1]],g,'')
vein('condylar_emissary_veins','Veias emissárias condilares · exemplos','internal_jugular_vein',.045,[[3,-4.1,-1.4],[2.2,-4.3,-2.2],[1.6,-4.5,-3.4]],g,'')
vein('parietal_emissary_vein','Veia emissária parietal','superior_sagittal_sinus',.035,[[.2,8.6,-3.5],[.9,8.7,-3.6],[1.6,8.8,-3.7]],g,'')
g='Venoso · segmento cervical medular'
vein('anterior_spinal_vein','Veia espinal anterior · segmento cervical','anterior_pontomedullary_vein',.035,[[0,-4.1,-2.6],[0,-7,-2.8],[0,-10,-2.9],[0,-14,-3]],g,'',paired=False)
vein('posterior_spinal_veins','Veias espinais posteriores · segmentos cervicais','marginal_sinus',.03,[[.4,-4.4,-4],[.4,-7,-4],[.4,-10,-4.1],[.4,-14,-4.2]],g,'')
vein('radiculomedullary_veins','Veias radiculomedulares · exemplos cervicais','anterior_spinal_vein',.025,[[0,-9.3,-2.9],[.5,-9.3,-3],[1,-9.2,-3.4],[1.5,-9.1,-3.6]],g,'')
vein('perimedullary_venous_plexus','Rede venosa perimedular · exemplos cervicais','anterior_spinal_vein',.018,[[0,-8,-2.8],[.6,-8.2,-3.1],[.7,-8.3,-3.6],[.4,-8.4,-4],[0,-8.4,-4.1],[-.6,-8.2,-3.6],[0,-8,-2.8]],g,'',paired=False)
vein('internal_vertebral_venous_plexus','Plexo venoso vertebral interno · exemplos cervicais','marginal_sinus',.055,[[.9,-4.4,-3],[1,-7,-3],[1,-10,-3.1],[1,-14,-3.2]],g,'',paired=False,branches=[[[-.9,-4.4,-3],[-1,-7,-3],[-1,-10,-3.1],[-1,-14,-3.2]],[[1,-9,-3.1],[.5,-9,-2.8],[-.5,-9,-2.8],[-1,-9,-3.1]]])
vein('external_vertebral_venous_plexus','Plexo venoso vertebral externo · exemplos cervicais','condylar_emissary_veins_l',.045,[[1.6,-4.5,-3.4],[2.1,-7,-5],[2.2,-10,-5.1],[2.3,-14,-5.2]],g,'',paired=False,branches=[[[-1.6,-4.5,-3.4],[-2.1,-7,-5],[-2.2,-10,-5.1],[-2.3,-14,-5.2]]])

# Remaining named diagram identities. Arcades are representative sketches, NOT
# demonstrated open anastomoses. Figure-only labels are intentionally excluded.
g='Neuroangio · redes orbitárias e durais'
for id,name,parent,r,p in [
 ('anterior_falcine_artery','Artéria falcina anterior','anterior_ethmoidal_artery',.02,[[.8,1.6,4.5],[.3,2.4,5.1],[.15,3.6,5.3],[.15,4.5,4.8]]),
 ('collateral_branches_to_optic_nerve','Ramos colaterais arteriais para o nervo óptico','ophthalmic_artery',.012,[[1.9,.8,4.1],[1.8,1,4.5],[1.7,1.1,4.9]]),
 ('intercavernous_arterial_connections','Conexões arteriais intercavernosas · esquema','inferior_hypophyseal_artery',.012,[[.4,-1.6,.4],[.2,-1.5,.5],[0,-1.4,.6]],),
 ('lateral_tentorial_arterial_arcade','Arcada tentorial lateral · esquema','posterior_branch_of_ilt',.018,[[2.5,-1.6,.4],[3,-1.5,-.8],[3.5,-1.3,-2.2],[4.2,-1,-3.5]]),
 ('lateral_clival_arterial_arcade','Arcada clival lateral · esquema','jugular_division_of_ascending_pharyngeal_artery',.018,[[2.7,-3.5,-1.1],[2.2,-2.8,-.9],[1.9,-2,-.6]]),
 ('hypoglossal_branch_to_odontoid_arcade','Ramo hipoglosso para a arcada odontoidea','hypoglossal_division_of_ascending_pharyngeal_artery',.018,[[1.6,-4,-1.6],[1.2,-4.8,-1.6],[.7,-5.5,-1.7]]),
 ('odontoid_arterial_arcade','Arcada odontoidea epidural ventral · esquema','hypoglossal_branch_to_odontoid_arcade',.018,[[.7,-5.5,-1.7],[.4,-5.7,-1.6],[0,-5.7,-1.55],[-.4,-5.7,-1.6]]),
 ('jugular_branch_of_occipital_artery','Ramo jugular da occipital','occipital_artery',.02,[[3.5,-4.4,-.4],[3.2,-3.8,-.9],[3,-3.4,-1.3]]),
 ('sigmoid_sinus_arterial_arcade','Arcada arterial do seio sigmoide · esquema','posterior_meningeal_artery',.018,[[2,-3.2,-5.1],[3.2,-2.7,-4.6],[4.3,-2.3,-4],[4.9,-1.8,-3.7]]),
 ('transverse_sinus_arterial_arcade','Arcada arterial do seio transverso · esquema','posterior_meningeal_artery',.018,[[1,-2.2,-6.6],[2.2,-1.8,-7],[3.5,-1.5,-6.5],[4.8,-1.2,-5.5]]),
 ('straight_sinus_artery','Artéria do seio reto · esquema','marginal_tentorial_artery',.016,[[.7,.5,-5],[.3,1,-4.5],[.15,1.4,-3.8]]),
 ('superior_sagittal_sinus_arterial_arcade','Arcada arterial do seio sagital superior · esquema','frontal_branch_of_middle_meningeal_artery',.016,[[4.1,7.4,3],[2.8,8.5,2.8],[1.4,9.3,2.4],[.3,9.5,1.8]]),
 ('transmastoid_branch_of_occipital_artery','Ramo transmastóideo da occipital','occipital_artery',.018,[[4.6,-2.6,-3.7],[4.5,-2.2,-3.2],[4.4,-1.8,-2.8]]),
 ('caroticotympanic_artery','Artéria caroticotimpânica','internal_carotid_artery',.012,[[2.2,-3.3,.7],[2.7,-3.2,.5],[3.1,-3.1,.2]]),
 ('cavernous_branch_of_middle_meningeal_artery','Conexão cavernosa AMM–ILT · lado espinhoso','middle_meningeal_artery',.018,[[2.7,-2.7,.9],[2.3,-2.6,1],[2,-2.3,1.2]]),
 ('superior_orbital_fissure_artery','Artéria da fissura orbital superior','maxillary_artery',.018,[[2.8,-3.3,3.5],[2.5,-2.4,3],[2.2,-1.5,2.8]]),
 ('sphenoid_ridge_branch','Ramo da crista esfenoidal','middle_meningeal_artery',.018,[[3.4,-1.3,.9],[3.5,-.3,2],[3.6,.3,3]]),
 ('deep_recurrent_meningeal_branch','Ramo meníngeo recorrente profundo','ophthalmic_artery',.018,[[2.1,.4,3.6],[2,-.1,3],[2.2,-.6,2.4]]),
 ('clinoid_tentorial_arterial_arcade','Arcada tentorial clinoidea · esquema','inferolateral_trunk',.018,[[2.2,-2,1.4],[1.9,-1.2,1.9],[1.6,-.6,1.5],[1.8,-.5,.4]]),
 ('posterior_branch_of_ilt','Ramo posterior do ILT','inferolateral_trunk',.018,[[2.35,-2.4,1.35],[2.5,-2,.7],[2.5,-1.6,.4]]),
 ('eustachian_branch_of_accessory_meningeal_artery','Ramo tubário da meníngea acessória','accessory_meningeal_artery',.018,[[3.05,-3.7,1.05],[2.7,-3.9,1.5],[2.2,-4,1.7]]),
 ('inferior_turbinate_arterial_branches','Ramos arteriais da concha nasal inferior','sphenopalatine_artery',.018,[[.9,-3.9,4.3],[1,-4.3,5],[1.1,-4.7,5.8]]),
 ('middle_turbinate_arterial_branches','Ramos arteriais da concha nasal média','sphenopalatine_artery',.018,[[.9,-3.9,4.3],[.9,-3.4,4.8],[.9,-3.1,5.5]]),
 ('superior_turbinate_arterial_branches','Ramos arteriais da concha nasal superior','sphenopalatine_artery',.014,[[.9,-3.9,4.3],[.8,-2.8,4.5],[.7,-2.2,4.9]]),
 ('anterior_nasal_septal_arterial_system','Sistema septal nasal anterior · esquema','sphenopalatine_artery',.018,[[.9,-3.9,4.3],[.3,-3.8,4.9],[.2,-4.5,6],[.2,-5,6.7]]),
 ('submandibular_branch_of_facial_artery','Ramo submandibular da facial','facial_artery',.025,[[3.1,-8.3,1.4],[2.8,-8.5,2.6],[2.5,-8.4,3.3]]),
 ('superficial_nasal_artery','Artéria nasal superficial','facial_artery',.02,[[3.4,-5.3,6.4],[2.4,-4.8,7],[1.5,-4.2,7.5]]),
 ('dorsal_nasal_artery','Artéria nasal dorsal','ophthalmic_artery',.02,[[1.5,.6,6.4],[1.1,.1,7],[.8,-.6,7.5]]),
 ('sta_mma_anastomotic_pathway','Via temporal superficial–meníngea média · esquema','parietal_branch_of_superficial_temporal_artery',.014,[[6.1,6.3,-2],[5.8,6.7,-2.4],[5.5,6.9,-2.8]]),
 ('oa_mma_anastomotic_pathway','Via occipital–meníngea média · esquema','occipital_artery',.014,[[5.5,4,-5.5],[5.8,4.5,-4.7],[6,4.8,-4]]),
 ('vasocorona','Vasocorona · exemplos cervicais','anterior_spinal_artery',.012,[[.08,-8,-2.9],[.5,-8,-3.1],[.65,-8,-3.6],[.4,-8,-4],[0,-8,-4.1]]),
 ('arterial_branch_to_hypoglossal_nerve','Ramo arterial para o nervo hipoglosso','hypoglossal_division_of_ascending_pharyngeal_artery',.012,[[1.6,-3.95,-1.65],[1.5,-3.9,-1.8],[1.4,-3.8,-1.9]]),
 ('occipital_c1_root_branch','Ramo occipital para a raiz C1','occipital_artery',.018,[[3.6,-5.5,-2.2],[2.8,-5.5,-2.8],[1.8,-5.4,-3.2]]),
 ('occipital_vertebral_c1_pathway','Via muscular occipital–vertebral em C1 · esquema','occipital_artery',.02,[[3.6,-5.5,-2.2],[2.9,-5.6,-2.6],[2.2,-5.7,-3]]),
 ('c2_muscular_arterial_branch','Ramo muscular em C2','vertebral_artery',.02,[[2.3,-6.9,-2],[2.9,-6.9,-2.8],[3.4,-6.9,-3.8]]),
 ('segmental_muscular_arterial_branches','Ramos musculares segmentares · exemplos cervicais','vertebral_artery',.02,[[2.5,-9.1,-1.4],[3.1,-9.3,-2.5],[3.7,-9.5,-3.4]]),
 ('ascending_cervical_vertebral_pathway','Via cervical ascendente–vertebral · esquema','ascending_cervical_artery',.018,[[2.6,-8.5,-1.3],[2.4,-8.5,-1.7],[2.2,-8.5,-2.2]])]:art(id,name,parent,r,p,g)
art('persistent_trigeminal_artery','Artéria trigeminal persistente · variante','internal_carotid_artery',.08,[[1.8,-1.7,.6],[1.3,-1.4,-.2],[.7,-1.2,-.7],[0,-1,-.8]],'Variante embrionária',variant=True)
art('persistent_ventral_ophthalmic_artery','Artéria oftálmica ventral persistente · variante','anterior_cerebral_artery',.045,[[.8,.9,2.8],[1.2,.7,3.3],[1.7,.8,4],[2,.9,4.6]],'Variante embrionária',variant=True)

def main():
    destination=ROOT/'features/neuro3d/educational-vascular-paths.json'
    assert len({row['id'] for row in rows})==len(rows)
    payload=dict(version=1,units='cm',frame='existing atlas: left +x, superior +y, anterior +z',license='CC-BY-SA-4.0',method='Original hand-authored illustrative controls; literature-informed topology, not measured patient anatomy',anatomicalApproval=False,proceduralEligible=False,templates=rows)
    destination.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
    print(f'{len(rows)} templates; {sum(2 if r["paired"] else 1 for r in rows)} individual educational structures')
if __name__=='__main__':main()

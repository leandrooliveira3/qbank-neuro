import re

def parse_float(val_str):
    if not val_str:
        return None
    try:
        return float(val_str.replace(',', '.'))
    except:
        return None

def extract_date(texto):
    match = re.search(r'Emissão:\s*(\d{2}/\d{2}/\d{4})', texto)
    if match:
        return match.group(1)
    match = re.search(r'Coleta confirmada:\s*(\d{2}/\d{2}/\d{4})', texto)
    if match:
        return match.group(1)
    return "Data desconhecida"

def extrair_leucocitos(texto):
    match = re.search(r'([\d,.]+)\s*x\s*10³/µL\s*Leucócitos:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_neutrofilos(texto):
    match = re.search(r'([\d,.]+)\s*x\s*10³/µL.*?Neutrófilos:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_eosinofilos(texto):
    match = re.search(r'([\d,.]+)\s*x\s*10³/µL.*?Eosinófilos:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_basofilos(texto):
    match = re.search(r'([\d,.]+)\s*x\s*10³/µL.*?Basófilos:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_monocitos(texto):
    match = re.search(r'([\d,.]+)\s*x\s*10³/µL.*?Monócitos:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_linfocitos(texto):
    match = re.search(r'([\d,.]+)\s*x\s*10³/µL.*?Linfócitos:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_hemacias(texto):
    match = re.search(r'([\d,.]+)\s*milhões/µL\s*Hemácias:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_hemoglobina(texto):
    match = re.search(r'([\d,.]+)\s*g/dL\s*Hemoglobina:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_hematocrito(texto):
    match = re.search(r'([\d,.]+)\s*%\s*Hematócrito:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_vcm(texto):
    match = re.search(r'([\d,.]+)\s*fL\s*VCM:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_hcm(texto):
    match = re.search(r'([\d,.]+)\s*pg\s*HCM:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_chcm(texto):
    match = re.search(r'([\d,.]+)\s*g/dL\s*CHCM:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_rdw(texto):
    match = re.search(r'([\d,.]+)\s*%\s*RDW', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_plaquetas(texto):
    match = re.search(r'([\d,.]+)\s*x\s*10³/µL\s*Plaquetas:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_ureia(texto):
    match = re.search(r'URÉIA.*?RESULTADO:\s*([\d,.]+)\s*mg/dL', texto, re.DOTALL | re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_creatinina(texto):
    match = re.search(r'CREATININA.*?RESULTADO:\s*([\d,.]+)\s*mg/dL', texto, re.DOTALL | re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_pcr(texto):
    match = re.search(r'PROTEÍNA C REATIVA.*?RESULTADO:\s*([\d,.]+)\s*mg/L', texto, re.DOTALL | re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_magnesio(texto):
    match = re.search(r'MAGNÉSIO.*?RESULTADO:\s*([\d,.]+)\s*mg/dL', texto, re.DOTALL | re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_fosforo(texto):
    match = re.search(r'FÓSFORO.*?RESULTADO:\s*([\d,.]+)\s*mg/dL', texto, re.DOTALL | re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_ph(texto):
    match = re.search(r'([\d,.]+)\s*pH:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_po2(texto):
    match = re.search(r'([\d,.]+)\s*mmHg\s*pO2:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_pco2(texto):
    match = re.search(r'([\d,.]+)\s*mmHg\s*pCO2:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_hco3(texto):
    match = re.search(r'([\d,.]+)\s*mmol/L\s*HCO3:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_be(texto):
    match = re.search(r'([-\d,.]+)\s*mmol/L\s*BE', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_sat_o2(texto):
    match = re.search(r'([\d,.]+)\s*%\s*Sat\.\s*O2:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_potassio_gaso(texto):
    match = re.search(r'([\d,.]+)\s*mmol/L\s*K:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_sodio_gaso(texto):
    match = re.search(r'([\d,.]+)\s*mmol/L\s*NA:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_calcio_gaso(texto):
    match = re.search(r'([\d,.]+)\s*mmol/L\s*CA\+?:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_cloro_gaso(texto):
    match = re.search(r'([\d,.]+)\s*mmol/L\s*CL:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_glicose_gaso(texto):
    match = re.search(r'([\d,.]+)\s*mg/dL\s*Glicose:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def extrair_lactato(texto):
    match = re.search(r'([\d,.]+)\s*mmol/L\s*Lactato:', texto, re.IGNORECASE)
    return parse_float(match.group(1)) if match else None

def processar_exames(texto):
    data = {
        'Ur': extrair_ureia(texto),
        'Cr': extrair_creatinina(texto),
        'PCR': extrair_pcr(texto),
        'Mg': extrair_magnesio(texto),
        'P': extrair_fosforo(texto),
        'Leucócitos': extrair_leucocitos(texto),
        'Neutr.': extrair_neutrofilos(texto),
        'Eo.': extrair_eosinofilos(texto),
        'Bas.': extrair_basofilos(texto),
        'Mono.': extrair_monocitos(texto),
        'Linf.': extrair_linfocitos(texto),
        'Hemácias': extrair_hemacias(texto),
        'Hb': extrair_hemoglobina(texto),
        'Ht': extrair_hematocrito(texto),
        'VCM': extrair_vcm(texto),
        'HCM': extrair_hcm(texto),
        'CHCM': extrair_chcm(texto),
        'RDW': extrair_rdw(texto),
        'PLQ': extrair_plaquetas(texto),
        'pH': extrair_ph(texto),
        'pO2': extrair_po2(texto),
        'pCO2': extrair_pco2(texto),
        'HCO3': extrair_hco3(texto),
        'BE': extrair_be(texto),
        'Sat. O2': extrair_sat_o2(texto),
        'K (gaso)': extrair_potassio_gaso(texto),
        'Na (gaso)': extrair_sodio_gaso(texto),
        'Ca+ (gaso)': extrair_calcio_gaso(texto),
        'Cl (gaso)': extrair_cloro_gaso(texto),
        'Glicose': extrair_glicose_gaso(texto),
        'Lactato': extrair_lactato(texto)
    }
    return {
        'data_coleta': extract_date(texto),
        'exames': {k: v for k, v in data.items() if v is not None}
    }

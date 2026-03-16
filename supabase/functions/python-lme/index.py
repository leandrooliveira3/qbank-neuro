
from functions_framework import http
import json
import requests
import io
import base64
from pdfrw import PdfReader, PdfWriter, PdfName, PdfString, PdfDict

# Mapeamento de chaves do Frontend -> Nomes dos Campos no PDF (AcroForm)
# Ajuste os valores da direita conforme o nome real dos campos no seu PDF template
FIELD_MAP = {
    "patientName": "nome_paciente",
    "patientMotherName": "nome_mae",
    "patientWeight": "peso",
    "patientHeight": "altura",
    "professionalName": "nome_medico",
    "professionalCNS": "cns_medico",
    "date": "data_solicitacao",
    "medicationName": "medicamento_principal",
    "cid10": "cid10",
    "anamnesis": "anamnese",
    "clinicalHistory": "historia_clinica",
    "previousTreatments": "tratamentos_previos",
    "currentTreatment": "tratamento_atual",
    # Mapeamento de Quantidades
    "qtd_1": "qtd_mes1",
    "qtd_2": "qtd_mes2",
    "qtd_3": "qtd_mes3",
    "qtd_4": "qtd_mes4",
    "qtd_5": "qtd_mes5",
    "qtd_6": "qtd_mes6",
}

@http
def handler(request):
    # CORS Headers
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }

    if request.method == "OPTIONS":
        return ("", 204, headers)

    try:
        data = request.get_json()
        pdf_url = data.get("pdfUrl")
        form_data = data.get("formData", {})

        if not pdf_url:
            return (json.dumps({"error": "URL do PDF não fornecida"}), 400, headers)

        # 1. Baixar o PDF Template
        response = requests.get(pdf_url)
        response.raise_for_status()
        template_pdf = PdfReader(io.BytesIO(response.content))

        # 2. Preencher os campos (AcroForm)
        # Itera sobre todas as páginas para encontrar anotações de widget (campos)
        for page in template_pdf.pages:
            annotations = page['/Annots']
            if annotations:
                for annotation in annotations:
                    if annotation['/Subtype'] == '/Widget' and annotation['/T']:
                        key = annotation['/T'].to_unicode()  # Nome do campo no PDF
                        
                        # Tenta encontrar o valor correspondente no payload
                        # Procura no mapa ou uso direto da chave
                        val_to_fill = None
                        
                        # Reverse lookup no FIELD_MAP ou match direto
                        # (Simplificação: itera sobre o payload e vê se bate com o mapa)
                        for k, v in form_data.items():
                            mapped_key = FIELD_MAP.get(k, k)
                            if mapped_key == key:
                                val_to_fill = v
                                break
                        
                        if val_to_fill:
                            # Preenche o campo
                            annotation.update(PdfDict(V='{}'.format(val_to_fill)))
                            # Opcional: Marcar como ReadOnly após preencher para "achatar" (flatten) visualmente
                            # annotation.update(PdfDict(Ff=1)) 

        # 3. Gerar PDF Preenchido
        output_stream = io.BytesIO()
        writer = PdfWriter()
        writer.write(output_stream, template_pdf)
        
        # 4. Retornar como Base64
        pdf_base64 = base64.b64encode(output_stream.getvalue()).decode('utf-8')

        return (json.dumps({"pdfBase64": pdf_base64}), 200, headers)

    except Exception as e:
        return (json.dumps({"error": str(e)}), 500, headers)

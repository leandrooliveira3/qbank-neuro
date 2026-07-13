from flask import Flask, render_template, request
from parser import processar_exames
from gasometria import avaliar_gasometria
from referencias import REFERENCIAS

app = Flask(__name__)

def verificar_status(chave, valor):
    ref = REFERENCIAS.get(chave)
    if ref:
        if valor < ref['min'] or valor > ref['max']:
            return 'Alterado'
    return 'Normal'

def formatar_valor(chave, valor):
    if chave in ['Leucócitos', 'Neutr.', 'Eo.', 'Bas.', 'Mono.', 'Linf.', 'PLQ']:
        return f"{int(valor * 1000)}"
    elif chave in ['Ht', 'RDW', 'Sat. O2']:
        return f"{valor}%"
    else:
        # Check if float is exact int, avoid 45.0 if possible, wait, the layout shows Ur: 45.0, so let's keep one decimal for others
        return str(valor)

def valor_tabela(chave, valor):
    if chave in ['Leucócitos', 'Neutr.', 'Eo.', 'Bas.', 'Mono.', 'Linf.']:
        return f"{str(valor).replace('.', ',')} x 10³/µL"
    if chave == 'Hemácias':
        return f"{str(valor).replace('.', ',')} milhões/µL"
    elif chave in ['Ht', 'RDW', 'Sat. O2']:
        return f"{str(valor).replace('.', ',')} %"
    else:
        ref = REFERENCIAS.get(chave)
        unidade = ref['unidade'] if ref else ''
        return f"{str(valor).replace('.', ',')} {unidade}".strip()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/processar', methods=['POST'])
def processar():
    texto = request.form.get('texto', '')
    albumina = request.form.get('albumina', 4.0)
    try:
        albumina = float(str(albumina).replace(',', '.'))
    except:
        albumina = 4.0
        
    resultado = processar_exames(texto)
    
    lista_exames = []
    alertas = []
    
    for chave, valor in resultado['exames'].items():
        status = verificar_status(chave, valor)
        val_formatado = formatar_valor(chave, valor)
        
        lista_exames.append({
            'chave': chave,
            'valor': val_formatado,
            'status': status
        })
        
        if status == 'Alterado':
            ref = REFERENCIAS.get(chave)
            if ref:
                # Format reference as "4.0 - 11.0" or "4,0 - 11,0"
                ref_min = str(ref['min']).replace('.', ',')
                ref_max = str(ref['max']).replace('.', ',')
                ref_texto = f"{ref_min} - {ref_max}"
                alertas.append({
                    'chave': chave,
                    'material': ref['material'],
                    'resultado': valor_tabela(chave, valor),
                    'referencia': ref_texto
                })
            
    gasometria = avaliar_gasometria(
        ph=resultado['exames'].get('pH'),
        pco2=resultado['exames'].get('pCO2'),
        hco3=resultado['exames'].get('HCO3'),
        na=resultado['exames'].get('Na (gaso)'),
        cl=resultado['exames'].get('Cl (gaso)'),
        albumina=albumina,
        glicose=resultado['exames'].get('Glicose'),
        ureia=resultado['exames'].get('Ur')
    )
    
    return render_template('resultado.html', 
                           data_coleta=resultado['data_coleta'],
                           exames=lista_exames, 
                           alertas=alertas, 
                           gasometria=gasometria,
                           albumina_usada=albumina,
                           texto_raw=texto)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=3000)

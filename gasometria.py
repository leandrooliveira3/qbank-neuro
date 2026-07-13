def avaliar_gasometria(ph, pco2, hco3, na, cl, albumina=4.0, glicose=None, ureia=None):
    if None in [ph, pco2, hco3, na, cl]:
        return None
    
    # Distúrbio primário
    disturbio_primario = ""
    if ph < 7.35:
        if pco2 > 45 and hco3 < 22:
            disturbio_primario = "Acidose mista"
        elif pco2 > 45:
            disturbio_primario = "Acidose respiratória"
        elif hco3 < 22:
            disturbio_primario = "Acidose metabólica"
        else:
            disturbio_primario = "Acidose"
    elif ph > 7.45:
        if pco2 < 35 and hco3 > 26:
            disturbio_primario = "Alcalose mista"
        elif pco2 < 35:
            disturbio_primario = "Alcalose respiratória"
        elif hco3 > 26:
            disturbio_primario = "Alcalose metabólica"
        else:
            disturbio_primario = "Alcalose"
    else:
        if pco2 > 45 and hco3 > 26:
            disturbio_primario = "Distúrbio compensado ou misto"
        elif pco2 < 35 and hco3 < 22:
            disturbio_primario = "Distúrbio compensado ou misto"
        else:
            disturbio_primario = "Normal"
            
    # Anion Gap
    ag = na - (cl + hco3)
    
    # Anion Gap corrigido
    ag_corrigido = ag + 2.5 * (4.0 - albumina)
    
    # Interpretação Anion Gap
    ag_interpretacao = "Normal"
    if ag_corrigido > 12:
        ag_interpretacao = "Aumentado"
    elif ag_corrigido < 8:
        ag_interpretacao = "Diminuído"
        
    # Osmolaridade
    osmolaridade = None
    osm_interpretacao = "Indeterminada"
    if glicose is not None and ureia is not None:
        osmolaridade = 2 * na + (glicose / 18) + (ureia / 6)
        if osmolaridade > 295:
            osm_interpretacao = "Hiperosmolaridade"
        elif osmolaridade < 275:
            osm_interpretacao = "Hipoosmolaridade"
        else:
            osm_interpretacao = "Normal"
            
    return {
        'disturbio_primario': disturbio_primario,
        'ag': round(ag, 1),
        'ag_corrigido': round(ag_corrigido, 1),
        'ag_interpretacao': ag_interpretacao,
        'osmolaridade': round(osmolaridade, 1) if osmolaridade else None,
        'osm_interpretacao': osm_interpretacao
    }

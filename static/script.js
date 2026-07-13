// static/script.js
function copiarTexto() {
    const textoEl = document.getElementById('texto-processado-html');
    if(textoEl) {
        // innerText gets the plain text without HTML tags and without extra line breaks from the spans
        let textoPlano = textoEl.innerText;
        // Clean up excess whitespace and newlines, format it into a single line
        textoPlano = textoPlano.replace(/\s+/g, ' ').trim();
        // The pipe characters might have spaces around them, which is fine.
        // E.g. "(12/07/2026) - SANGUE: Ur: 45.0 | Cr: 0.63 | ..."
        
        navigator.clipboard.writeText(textoPlano).then(() => {
            const btn = document.getElementById('btn-copiar');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="bi bi-check2"></i> Texto copiado';
            btn.classList.add('btn-success', 'text-white', 'border-success');
            btn.classList.remove('btn-light', 'text-secondary');
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('btn-success', 'text-white', 'border-success');
                btn.classList.add('btn-light', 'text-secondary');
            }, 2000);
        }).catch(err => {
            console.error('Erro ao copiar texto: ', err);
        });
    }
}

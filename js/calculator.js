(() => {
  const display = document.getElementById('display'); // now a div for rich rendering
  const historyEl = document.getElementById('history');
  const keys = document.querySelectorAll('.keys .btn');

  let current = '';
  let lastExpression = '';

  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function renderDisplay(text){
    if(!text) { display.innerHTML = '0'; return; }
    // render fractions like 12/5 -> nice fraction
    let out = escapeHtml(text);
    // show sqrt symbol for √( ... ) tokens
    out = out.replace(/√\(/g,'<span class="root-symbol">√</span>(');
    // render simple numeric fractions a/b
    out = out.replace(/(\d+\.?\d*)\/(\d+\.?\d*)/g, function(_, n,d){
      return '<span class="frac"><span class="num">'+n+'</span><span class="bar"></span><span class="den">'+d+'</span></span>';
    });
    // render ^ with superscript for simple cases like 2^3
    out = out.replace(/(\d+)\^(\d+)/g, '$1<span class="sup">$2</span>');
    display.innerHTML = out || '0';
  }

  function sanitize(expr){
    // map display symbols to JS operators
    return expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/√/g,'√');
  }

  function evaluateExpr(){
    try{
      let expr = sanitize(current);
      // replace percent
      expr = expr.replace(/(\d+\.?\d*)%/g,'($1/100)');
      // power ^ -> **
      expr = expr.replace(/\^/g,'**');
      // sqrt symbol -> Math.sqrt(
      expr = expr.replace(/√\(/g,'Math.sqrt(');
      // root(n,x) -> Math.pow(x,1/n)
      expr = expr.replace(/root\s*\(\s*([^,]+)\s*,\s*([^\)]+)\s*\)/g, function(_, n, x){
        return 'Math.pow((' + x + '),1/(' + n + '))';
      });

      // security: allow only numbers, operators, parentheses, decimal, comma, Math, letters for pow/sqrt
      let check = expr.replace(/Math\.sqrt/g,'').replace(/Math\.pow/g,'');
      if(/[^0-9+\-*/().,eE\s]/.test(check)) throw new Error('Invalid characters');

      const result = Function('return ('+expr+')')();
      lastExpression = current + ' = ' + result;
      historyEl.textContent = lastExpression;
      current = String(result);
      renderDisplay(current);
    }catch(e){
      renderDisplay('Error');
      current = '';
    }
  }

  keys.forEach(btn => btn.addEventListener('click', ()=>{
    const val = btn.dataset.value;
    const action = btn.dataset.action;
    if(action === 'clear'){
      current = '';
      historyEl.textContent = '';
      renderDisplay('0');
      return;
    }
    if(action === 'back'){
      current = current.slice(0,-1);
      renderDisplay(current || '0');
      return;
    }
    if(action === 'equals'){
      evaluateExpr();
      return;
    }
    // regular value
    if(val === '%'){
      current += '%';
    } else if(val === '√'){
      current += '√(';
    } else if(val === 'root'){
      current += 'root(';
    } else {
      current += val;
    }
    renderDisplay(current);
  }));

  // keyboard support
  window.addEventListener('keydown', e => {
    const key = e.key;
    if((/^[0-9]$/).test(key) || key === '.'){
      current += key; renderDisplay(current); return;
    }
    if(key === 'Backspace'){ current = current.slice(0,-1); renderDisplay(current||'0'); return; }
    if(key === 'Escape'){ current=''; historyEl.textContent=''; renderDisplay('0'); return; }
    if(key === 'Enter' || key === '='){ e.preventDefault(); evaluateExpr(); return; }
    if(key === '^'){ current += '^'; renderDisplay(current); return; }
    if(['+','-','/','*','%'].includes(key)){
      current += (key === '/' ? '÷' : key === '*' ? '×' : key);
      renderDisplay(current);
      return;
    }
    // support parentheses
    if(key === '(' || key === ')'){ current += key; renderDisplay(current); return; }
  });

})();

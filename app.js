'use strict';
const $=id=>document.getElementById(id);
const termos={sim:'Sim',nao:'Não',incerto:'Não observado',na:'Não se aplica'};
const key='acesso-ja-visitas-v1';
let locais=[], demo=true, selecionado='', editando=null, memoriaOk=true;
const uid=()=>crypto.randomUUID();
function elem(tag,text){const e=document.createElement(tag);e.textContent=text;return e;}
function botao(text,fn){const b=elem('button',text);b.type='button';b.onclick=fn;return b;}
function hoje(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function ultima(p){return p.visitas.reduce((a,b)=>a.data>b.data?a:b);}
function normal(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function texto(s,max){return typeof s==='string' && s.length<=max;}
function validar(arr){
  const id=s=>texto(s,80)&&/^[A-Za-z0-9_-]+$/.test(s);
  const coord=(x,max)=>Number.isFinite(x)&&Math.abs(x)<=max;
  const data=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&s<=hoje()&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
  if(!Array.isArray(arr)||arr.length>3000)throw Error();
  for(const p of arr){
    if(!p||!id(p.id)||!texto(p.nome,100)||!p.nome.trim()||!texto(p.endereco,200)||!p.endereco.trim()||
    !(p.lat===null&&p.lon===null||coord(p.lat,85)&&coord(p.lon,180))||!Array.isArray(p.visitas)||!p.visitas.length||p.visitas.length>1000)throw Error();
    for(const v of p.visitas)if(!v||!id(v.id)||!data(v.data)||!texto(v.nota,500)||!v.itens||!criterios.every(([k])=>Object.hasOwn(termos,v.itens[k])))throw Error();
  }
}
function combinar(base,novos){
  const map=new Map();
  for(const p of [...base,...novos]){
    const atual=map.get(p.id);
    if(!atual){map.set(p.id,{...p,visitas:[...p.visitas]});continue;}
    const ids=new Set(atual.visitas.map(v=>v.id));
    for(const v of p.visitas)if(!ids.has(v.id)){atual.visitas.push(v);ids.add(v.id);}
  }
  return [...map.values()];
}
function guardar(next){
  validar(next);
  if(!memoriaOk)throw Error('Armazenamento local indisponível. Verifique as permissões do navegador.');
  localStorage.setItem(key,JSON.stringify(next));locais=next;
}
for(const [k,t] of criterios){
  const label=elem('label','');const check=document.createElement('input');
  check.type='checkbox';check.value=k;check.onchange=render;label.append(check,t);$('filters').append(label);
  const field=elem('label',t);const sel=document.createElement('select');sel.id='v-'+k;
  for(const v of ['incerto','sim','nao','na'])sel.add(new Option(termos[v],v));field.append(sel);$('conditions').append(field);
}
function render(){
  $('real').setAttribute('aria-pressed',!demo);$('demo').setAttribute('aria-pressed',demo);
  $('source').textContent=demo?'Demonstração com locais, datas e mapa fictícios.':'Catálogo real · Avaliações descrevem as condições na data da visita.';
  $('export').disabled=!locais.length;
  const busca=normal($('buscar').value.trim());
  const filtros=Array.from($('filters').querySelectorAll(':checked'),x=>x.value);
  const lista=(demo?exemplos:locais).filter(p=>normal(p.nome+' '+p.endereco).includes(busca)&&filtros.every(k=>ultima(p).itens[k]==='sim'));
  const p=lista.find(p=>p.id===selecionado)||lista[0];
  selecionado=p?.id||'';
  $('count').textContent=lista.length+' '+(lista.length===1?'local encontrado':'locais encontrados');
  $('list').replaceChildren();$('details').replaceChildren();$('map').replaceChildren();$('map').className='';
  for(const item of lista){
    const b=botao('',()=>{selecionado=item.id;render();$('details').scrollIntoView({block:'nearest'});});
    const title=elem('span',item.nome);title.className='item-name';b.append(title,elem('small',item.endereco));
    b.setAttribute('aria-pressed',item===p);$('list').append(b);
  }
  if(!p){$('details').append(elem('h2',!demo&&!locais.length?'Cadastre o primeiro local':'Nenhum local corresponde à busca'),elem('p',!demo&&!locais.length?'Registre o que você observou durante uma visita.':'Remova um filtro ou tente outro endereço.'));return;}
  if(demo){
    $('map').className='sketch';const pontos=[[23,30],[66,60],[82,25]];
    for(const item of lista){const i=exemplos.indexOf(item);const b=botao(String(i+1),()=>{selecionado=item.id;render();});b.className='pin';b.setAttribute('aria-label',item.nome);b.setAttribute('aria-pressed',item===p);b.style.left=pontos[i][0]+'%';b.style.top=pontos[i][1]+'%';$('map').append(b);}
    const cap=elem('span','Mapa ilustrativo · ponto '+(exemplos.indexOf(p)+1));cap.className='caption';$('map').append(cap);
  }else if(p.lat!==null){
    $('map').append(botao('Ver no mapa · OpenStreetMap',()=>{const frame=document.createElement('iframe');frame.title='Mapa de '+p.nome;
      const bbox=[Math.max(-180,p.lon-.01),Math.max(-85,p.lat-.007),Math.min(180,p.lon+.01),Math.min(85,p.lat+.007)].join(',');
      frame.src='https://www.openstreetmap.org/export/embed.html?'+new URLSearchParams({bbox,layer:'mapnik',marker:p.lat+','+p.lon});$('map').replaceChildren(frame);}));
  }else $('map').append(elem('small','Local sem coordenadas informadas.'));
  const d=$('details'),v=ultima(p);
  d.append(elem('h2',p.nome),elem('p',p.endereco),elem('small','Última visita · '+v.data.split('-').reverse().join('/')));
  function linhas(dest,visita){for(const [k,t] of criterios){const row=elem('div','');row.className='row';row.append(elem('span',t),elem('b',termos[visita.itens[k]]));dest.append(row);}}
  linhas(d,v);if(v.nota)d.append(elem('p',v.nota));
  const hist=elem('details','');hist.append(elem('summary','Histórico de visitas ('+p.visitas.length+')'));
  for(const vis of [...p.visitas].reverse().sort((a,b)=>b.data.localeCompare(a.data))){hist.append(elem('h3',vis.data.split('-').reverse().join('/')));linhas(hist,vis);if(vis.nota)hist.append(elem('p',vis.nota));}
  d.append(hist);if(!demo)d.append(botao('Registrar visita ou barreira',()=>abrir(p)));
}
function modo(v){demo=v;selecionado='';$('buscar').value='';for(const c of $('filters').querySelectorAll('input'))c.checked=false;render();}
function abrir(p){
  editando=p;$('form').reset();$('formtitle').textContent=p?'Nova visita · '+p.nome:'Cadastrar local real';
  $('identity').hidden=!!p;$('name').required=$('address').required=!p;
  $('date').value=$('date').max=hoje();$('error').textContent='';$('dlg').showModal();
}
$('form').onsubmit=e=>{
  e.preventDefault();
  try{
    const itens=Object.fromEntries(criterios.map(([k])=>[k,$('v-'+k).value]));
    if(Object.values(itens).every(v=>v==='incerto')&&!$('note').value.trim())throw Error('Informe uma condição ou descreva o que você observou.');
    const visita={id:uid(),data:$('date').value,itens,nota:$('note').value.trim()};
    if(!$('identity').hidden&&!!$('lat').value!==!!$('lon').value)throw Error('Preencha latitude e longitude juntas.');
    const alvo=editando||{id:uid(),nome:$('name').value.trim(),endereco:$('address').value.trim(),lat:$('lat').value?Number($('lat').value):null,lon:$('lon').value?Number($('lon').value):null};
    if(!alvo.nome||!alvo.endereco)throw Error('Preencha nome e endereço.');
    guardar(combinar(locais,[{...alvo,visitas:[visita]}]));modo(false);selecionado=alvo.id;render();$('dlg').close();$('status').textContent='Avaliação salva neste navegador.';
  }catch(err){$('error').textContent=err.message||'Não foi possível salvar a visita.';}
};
$('add').onclick=()=>abrir(null);$('cancel').onclick=()=>$('dlg').close();$('buscar').oninput=render;
$('real').onclick=()=>modo(false);$('demo').onclick=()=>modo(true);
$('contrast').onclick=()=>{$('contrast').setAttribute('aria-pressed',document.body.classList.toggle('contrast'));};
$('export').onclick=()=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify(locais,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='acesso-ja-locais.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
};
$('import').onclick=()=>$('file').click();
$('file').onchange=async()=>{try{const f=$('file').files[0];if(!f)return;if(f.size>5000000)throw Error();const dados=JSON.parse(await f.text());validar(dados);guardar(combinar(locais,dados));modo(false);$('status').textContent='Importação concluída. Visitas repetidas foram ignoradas.';}catch{$('status').textContent='Falha na importação. Confira o formato, o limite de 5 MB e o espaço do navegador.';}finally{$('file').value='';}};
async function iniciar(){
  let avisos=[];
  try{const dados=JSON.parse(localStorage.getItem(key)||'[]');validar(dados);locais=dados;}catch{memoriaOk=false;avisos.push('Não foi possível ler o armazenamento local.');}
  try{const resp=await fetch('catalogo.json',{cache:'no-cache'});if(!resp.ok)throw Error();const dados=await resp.json();validar(dados);locais=combinar(dados,locais);}catch{avisos.push('Catálogo público indisponível. Abra pelo servidor local ou GitHub Pages.');}
  demo=!locais.length;$('status').textContent=avisos.join(' ');render();
}
iniciar();

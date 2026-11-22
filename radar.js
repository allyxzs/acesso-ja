'use strict';
const $=id=>document.getElementById(id);
const criar=(tag,texto)=>Object.assign(document.createElement(tag),{textContent:texto});
let resultados=[],selecao=[],geracao=0;
const cache=new Map(), chave='acesso-ja-saida-v2';
try{const lista=JSON.parse(localStorage.getItem(chave)||'[]');if(Array.isArray(lista))selecao=lista.filter(p=>p&&typeof p.nome==='string'&&typeof p.id==='string').slice(0,3);}catch{}
function salvar(){try{localStorage.setItem(chave,JSON.stringify(selecao));}catch{$('mensagem').textContent='Seleção disponível apenas nesta sessão.';}}
function requisitos(){return [...$('necessidades').querySelectorAll(':checked')].map(c=>c.value);}
function acao(texto,fn){const b=criar('button',texto);b.onclick=fn;return b;}
function atualizar(){
  const req=requisitos();$('resultados').replaceChildren();
  for(const p of resultados){
    const card=criar('div','');card.className='card';
    card.append(criar('small',p.fonte+' · '+p.metros+' m da origem consultada'),criar('h3',p.nome));
    for(const [label,val] of [['Cadeira de rodas',p.access],['Banheiro',p.wc]]){
      const tag=criar('span',label+': '+val);tag.className='badge';card.append(tag);
    }
    if(p.endereco)card.append(criar('p',p.endereco));
    const falta=perguntas(p,req);
    card.append(criar('p',req.length?(falta.join(' · ')||'Todos os critérios escolhidos constam como “Sim” na fonte.'):'Nenhum critério selecionado.'));
    const existe=selecao.some(x=>x.id===p.id);
    const b=acao(existe?'Retirar da comparação':'Comparar',()=>{
      selecao=existe?selecao.filter(x=>x.id!==p.id):[...selecao,p];salvar();atualizar();
    });b.disabled=!existe&&selecao.length>=3;card.append(b);
    if(p.fonte==='OpenStreetMap'){const a=criar('a','Ver ficha no mapa');a.href='https://www.openstreetmap.org/'+p.id;card.append(a);const visita=criar('a','Registrar visita');visita.href='guia.html?'+new URLSearchParams({osm:p.id,nome:p.nome,endereco:p.endereco||'',lat:p.lat,lon:p.lon});card.append(visita);}
    $('resultados').append(card);
  }
  $('quadro').replaceChildren();
  if(!selecao.length)$('quadro').append(criar('p','Escolha até três lugares nos resultados.'));
  else{
    const tabela=criar('table','');const topo=tabela.insertRow();topo.append(criar('th','Condição'));
    for(const p of selecao)topo.append(criar('th',p.nome));
    for(const [label,key] of [['Acesso em cadeira de rodas','access'],['Banheiro acessível','wc'],['Horário informado','horario'],['Fonte','fonte'],['Consulta','consulta']]){
      const row=tabela.insertRow();row.append(criar('th',label));for(const p of selecao)row.append(criar('td',p[key]||'Não informado'));
    }
    const row=tabela.insertRow();row.append(criar('th','Seleção'));for(const p of selecao){const cell=row.insertCell();cell.append(acao('Remover '+p.nome,()=>{selecao=selecao.filter(x=>x.id!==p.id);salvar();atualizar();}));}
    $('quadro').append(tabela);
  }
  $('baixar').disabled=$('limpar').disabled=!selecao.length;
}
async function json(url,ttl=300000){
  const antigo=cache.get(url);if(antigo&&Date.now()-antigo.quando<ttl)return antigo.dados;
  const controle=new AbortController(),timer=setTimeout(()=>controle.abort(),25000);
  try{const r=await fetch(url,{signal:controle.signal});if(!r.ok)throw Error(r.status===429?'Limite do serviço atingido. Aguarde antes de tentar novamente.':'Serviço indisponível ('+r.status+').');const dados=await r.json();cache.set(url,{quando:Date.now(),dados});return dados;}
  finally{clearTimeout(timer);}
}
function origemMudou(){geracao++;resultados=[];$('tempo').replaceChildren();$('resumo').textContent='Origem alterada. Faça uma nova busca.';atualizar();}
$('coord').oninput=origemMudou;
async function executar(fn){
  const token=++geracao;
  $('noticia').textContent='Consultando…';
  try{await fn(()=>token===geracao);}catch(e){if(token===geracao)$('noticia').textContent=e.name==='AbortError'?'O serviço demorou a responder. Tente novamente.':e.message;}
}
$('postal').onsubmit=e=>{e.preventDefault();executar(async atual=>{
  const cep=$('cep').value.trim().replace('-','');if(!/^\d{8}$/.test(cep))throw Error('Digite um CEP com oito números.');
  $('coord').value='';$('tempo').replaceChildren();resultados=[];atualizar();$('resumo').textContent='Aguardando origem.';
  const endereco=await json('https://viacep.com.br/ws/'+cep+'/json/');if(!atual())return;
  if(endereco.erro)throw Error('CEP não encontrado.');
  const nome=[endereco.logradouro,endereco.bairro,endereco.localidade,endereco.uf].filter(Boolean).join(', ');
  $('noticia').textContent=nome+' · ViaCEP. Buscando coordenadas…';
  try{const r=await json('https://brasilapi.com.br/api/cep/v2/'+cep);if(!atual())return;
    const c=r.location?.coordinates;posicao(c.latitude+','+c.longitude);
    $('coord').value=c.latitude+', '+c.longitude;$('noticia').textContent=nome+' · ViaCEP. Posição aproximada do CEP via BrasilAPI.';
  }catch{if(atual())$('noticia').textContent=nome+' · ViaCEP. Coordenadas indisponíveis. Use a localização ou digite a posição.';}
});};
$('gps').onclick=()=>executar(async atual=>{
  if(!navigator.geolocation)throw Error('Geolocalização indisponível. Digite as coordenadas.');
  const p=await new Promise((ok,fail)=>navigator.geolocation.getCurrentPosition(ok,()=>fail(Error('Não foi possível obter a posição. Confira a permissão ou informe coordenadas.')),{timeout:15000}));
  if(!atual())return;$('coord').value=p.coords.latitude.toFixed(5)+', '+p.coords.longitude.toFixed(5);origemMudou();
  $('noticia').textContent='Origem obtida. Precisão indicada pelo aparelho: '+Math.round(p.coords.accuracy)+' m.';
});
$('buscarMapa').onclick=()=>executar(async atual=>{
  const p=posicao($('coord').value),cat=$('categoria'),raio=Number($('raio').value);
  resultados=[];atualizar();$('resumo').textContent='Buscando locais…';
  const q='[out:json][timeout:15];nwr["amenity"="'+cat.value+'"](around:'+raio+','+p.lat+','+p.lon+');out center;';
  try{const dados=await json('https://overpass-api.de/api/interpreter?data='+encodeURIComponent(q));
    if(!atual())return;resultados=lerMapa(dados,p,cat.selectedOptions[0].textContent).slice(0,40);atualizar();
    $('resumo').textContent=resultados.length?resultados.length+' locais exibidos por proximidade (até 40).':'Nenhum local mapeado nessa categoria e raio.';
    $('noticia').textContent='Consulta concluída. As distâncias são em linha reta.';
  }catch(e){if(atual())$('resumo').textContent='Busca interrompida. O guia de visitas continua disponível.';throw e;}
});
$('categoria').onchange=$('raio').onchange=origemMudou;
$('clima').onclick=()=>executar(async atual=>{
  const p=posicao($('coord').value);const r=await json('https://api.open-meteo.com/v1/forecast?latitude='+p.lat+'&longitude='+p.lon+'&current=temperature_2m,precipitation,wind_speed_10m&timezone=auto');
  if(!atual())return;const c=r.current;if(!c||![c.temperature_2m,c.precipitation,c.wind_speed_10m].every(Number.isFinite))throw Error('Clima sem leitura disponível.');
  $('tempo').textContent='Temperatura '+c.temperature_2m+' °C · Precipitação '+c.precipitation+' mm · Vento '+c.wind_speed_10m+' km/h. Modelo Open-Meteo · '+c.time.replace('T',' ')+' (hora local).';
  $('noticia').textContent='Condições aproximadas na origem.';
});
$('exemplo').onclick=()=>{geracao++;resultados=[
 ['Centro cultural','Sim','Não informado',320],['Biblioteca do Jardim','Parcial','Sim',510],['Praça das Letras','Não informado','Não',680]
].map(([nome,access,wc,metros],i)=>({id:'demo-'+i,nome,access,wc,metros,fonte:'Fictício',consulta:'Demonstração'}));
$('noticia').textContent='';$('resumo').textContent='Cenário fictício para experimentar a comparação.';atualizar();};
$('necessidades').onchange=atualizar;$('limpar').onclick=()=>{selecao=[];salvar();atualizar();};
$('contraste').onclick=()=>{$('contraste').setAttribute('aria-pressed',document.body.classList.toggle('contrast'));};
$('baixar').onclick=()=>{
  const ficha=selecao.map(p=>[p.nome,p.fonte+' · '+p.consulta,p.endereco||'', 'Cadeira de rodas: '+p.access,'Banheiro: '+p.wc,'Horário: '+(p.horario||'Não informado'),...perguntas(p,requisitos()),p.fonte==='OpenStreetMap'?'https://www.openstreetmap.org/'+p.id:'Local fictício'].filter(Boolean).join('\n')).join('\n\n');
  const url=URL.createObjectURL(new Blob(['ACESSO JÁ · FICHA DE VISITA\n\n'+ficha],{type:'text/plain;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='minha-saida.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
};
atualizar();

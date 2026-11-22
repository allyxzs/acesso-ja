'use strict';
const estados={yes:'Sim',limited:'Parcial',no:'Não',designated:'Sim'};
function posicao(texto){
  if(!/^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(texto))throw Error('Use latitude, longitude em graus decimais.');
  const [lat,lon]=texto.split(',').map(Number);
  if(Math.abs(lat)>85||Math.abs(lon)>180)throw Error('Coordenadas fora do intervalo do mapa.');
  return {lat,lon};
}
function distancia(a,b){
  const rad=Math.PI/180;
  const h=Math.sin((b.lat-a.lat)*rad/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin((b.lon-a.lon)*rad/2)**2;
  return Math.round(12742000*Math.asin(Math.sqrt(Math.min(1,h))));
}
function lerMapa(json,origem,categoria){
  if(!Array.isArray(json.elements)||json.remark)throw Error('A consulta ao mapa ficou incompleta. Tente um raio menor.');
  return json.elements.flatMap(e=>{
    const p=e.center||e,t=e.tags||{};
    if(!Number.isFinite(p.lat)||!Number.isFinite(p.lon))return [];
    return [{id:e.type+'/'+e.id,nome:t.name||categoria+' sem nome no mapa',lat:p.lat,lon:p.lon,metros:distancia(origem,p),
      access:estados[t.wheelchair]||'Não informado',wc:estados[t['toilets:wheelchair']]||'Não informado',
      endereco:[t['addr:street'],t['addr:housenumber']].filter(Boolean).join(', '), horario:t.opening_hours||'',fonte:'OpenStreetMap',consulta:new Date().toLocaleDateString('pt-BR')}];
  }).sort((a,b)=>a.metros-b.metros);
}
function perguntas(p,necessidades){
  const rotulos={access:'acesso para cadeira de rodas',wc:'banheiro acessível'};
  return necessidades.filter(k=>p[k]!=='Sim').map(k=>'Confirmar '+rotulos[k]+' ('+p[k]+')');
}

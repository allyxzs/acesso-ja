const criterios = [
  ['entrada','Entrada sem degrau ou com rampa'],['calcada','Calçada livre de obstáculos'],
  ['banheiro','Banheiro acessível'],['portas','Passagem para cadeira de rodas'],
  ['vaga','Vaga reservada'],['elevador','Elevador funcionando']
];
const exemplos = [
  ['d1','Biblioteca do Jardim','Praça das Letras, 12',['sim','sim','sim','sim','incerto','na'],'Entrada pelo jardim, no mesmo nível da calçada.'],
  ['d2','Mercado da Praça','Rua das Flores, 80',['sim','nao','incerto','sim','sim','na'],'Uma banca estreita a passagem na calçada.'],
  ['d3','Casa de Cultura','Alameda do Teatro, 5',['nao','sim','nao','incerto','incerto','nao'],'Escadas na entrada e elevador parado no dia da visita.']
].map(([id,nome,endereco,valores,nota])=>({id,nome,endereco,lat:null,lon:null,visitas:[{id:'v'+id,data:'2026-11-01',nota,itens:Object.fromEntries(criterios.map(([k],i)=>[k,valores[i]]))}]}));

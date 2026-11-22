# Acesso Já

Guia comunitário em português. Explore locais pelo nome, endereço e condições de acesso. A demonstração tem três locais fictícios num mapa ilustrativo. O catálogo real começa vazio. Marcadores de lugares reais usam as coordenadas informadas e o mapa do OpenStreetMap, que precisa de internet e só carrega ao clicar. Um critério marcado como “Não observado” não é evidência de acessibilidade.

## Rodar no Kali

Extraia o ZIP em uma pasta própria e rode dentro de acesso-ja:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Abra http://127.0.0.1:8000. Ctrl+C encerra. Não há dependências para instalar. Na busca, vários critérios exigem que todos constem como “Sim” na visita mais recente. Visitas com a mesma data usam a ordem de inclusão como desempate.

## Colaborar

Em Locais reais, cadastre um local e registre uma visita com data, condições e uma observação. Outra pessoa pode acrescentar uma visita ao mesmo local após importar seu JSON. Exportar inclui todos os locais reais carregados. O histórico registra relatos, sem certificação técnica. Evite dados pessoais nas observações. Salve uma cópia do JSON antes de limpar os dados do navegador. Relatos não são enviados automaticamente. Se houver contribuições paralelas, a importação combina visitas com IDs diferentes no mesmo local.

## Publicar no GitHub

Crie um repositório próprio chamado acesso-ja. Envie **o conteúdo da pasta acesso-ja**, com index.html na raiz. Ative Settings → Pages → Deploy from a branch → main → /(root). Não inicialize Git na pasta Downloads. Para atualizar os locais públicos, revise o JSON recebido e importe-o no guia com o catálogo atual carregado. Exporte o resultado e use esse arquivo como catalogo.json no repositório. Essa publicação torna os relatos visíveis aos visitantes. Não publique backups não revisados.

A primeira versão cobre busca, mapa por local, filtros, barreiras em texto, histórico, contraste e colaboração via JSON. Não calcula rotas acessíveis nem verifica automaticamente informações de terceiros.


## Versão 2 — Planejador de saídas
A página inicial é o planejador. O botão Guia de visitas abre todos os recursos da versão 1 em guia.html. Mantenha seu catalogo.json real ao atualizar um site existente. O histórico local continua usando a chave anterior quando você publica no mesmo domínio e usa o mesmo navegador.

ViaCEP consulta um endereço brasileiro. BrasilAPI CEP v2 tenta localizar o CEP e pode retornar sem coordenadas. A localização do aparelho é opcional e requer HTTPS ou localhost. Também é possível digitar a posição. Overpass consulta até 5 km de raio por categoria e ordena os resultados por distância geográfica. OSM fornece dados comunitários, não inspeções atuais. Open-Meteo fornece clima modelado na origem, sob demanda. Horários são mostrados como cadastrados no mapa. “Não informado” não indica que o recurso existe nem que está ausente.

Compare até três lugares e baixe uma ficha de perguntas. Abra Registrar visita num resultado para anotar presencialmente o que encontrou. Os dados do mapa não são copiados como confirmação de uma condição. A seleção fica no navegador e as consultas têm cache em memória de cinco minutos. As APIs recebem somente os parâmetros necessários a cada botão. Serviços públicos podem limitar requisições ou ficar indisponíveis. O cenário fictício funciona sem APIs.

Fontes: https://viacep.com.br/ · https://brasilapi.com.br/docs · https://wiki.openstreetmap.org/wiki/Overpass_API · https://open-meteo.com/ · © OpenStreetMap contributors (https://www.openstreetmap.org/copyright). Antes de uso comercial ou de alto volume, confira as condições e quotas dos provedores.

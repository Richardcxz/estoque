let estoque = [];
let historicoMovimentacoes = [];

function adicionarItem(nome, quantidade, dataValidade) {
    const index = estoque.findIndex(item => item.nome === nome && item.dataValidade === dataValidade);
    if (index !== -1) {
        estoque[index].quantidade += quantidade;
    } else {
        estoque.push({
            nome: nome,
            quantidade: quantidade,
            dataValidade: dataValidade
        });
    }
}

function adicionarEntradaHistorico(nome, quantidade) {
    historicoMovimentacoes.push({
        data: new Date().toLocaleString(),
        nome: nome,
        tipo: 'Entrada',
        quantidade: quantidade
    });
}

function adicionarSaidaHistorico(nome, quantidade) {
    if (quantidade < 0) {
        alert('Erro: Quantidade negativa na saída.');
        return;
    }
    
    historicoMovimentacoes.push({
        data: new Date().toLocaleString(),
        nome: nome,
        tipo: 'Saída',
        quantidade: quantidade
    });
}

function ordenarEstoque() {
    estoque.sort((a, b) => new Date(a.dataValidade) - new Date(b.dataValidade));
}

function atualizarEstoque() {
    const corpoTabela = document.getElementById('estoque-corpo');
    corpoTabela.innerHTML = '';
    estoque.forEach(item => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${item.nome}</td>
            <td>${item.quantidade}</td>
            <td>${item.dataValidade}</td>
        `;
        corpoTabela.appendChild(newRow);
    });
}

function atualizarHistorico() {
    const corpoTabela = document.getElementById('historico-corpo');
    corpoTabela.innerHTML = '';
    historicoMovimentacoes.forEach(movimentacao => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${movimentacao.data}</td>
            <td>${movimentacao.nome}</td>
            <td>${movimentacao.tipo}</td>
            <td>${movimentacao.quantidade}</td>
        `;
        corpoTabela.appendChild(newRow);
    });
}

function exportarParaExcel() {
    const estoqueData = estoque.map(item => [item.nome, item.quantidade, item.dataValidade]);
    const estoqueSheet = XLSX.utils.aoa_to_sheet([['Item', 'Quantidade', 'Data de Validade'], ...estoqueData]);

    const colWidthsEstoque = [{ wpx: 250 }, { wpx: 120 }, { wpx: 180 }];
    estoqueSheet['!cols'] = colWidthsEstoque;

    const historicoData = historicoMovimentacoes.map(movimentacao => [movimentacao.data, movimentacao.nome, movimentacao.tipo, movimentacao.quantidade]);
    const historicoSheet = XLSX.utils.aoa_to_sheet([['Data', 'Item', 'Tipo', 'Quantidade'], ...historicoData]);

    const colWidthsHistorico = [{ wpx: 190 }, { wpx: 250 }, { wpx: 120 }, { wpx: 120 }];
    historicoSheet['!cols'] = colWidthsHistorico;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, estoqueSheet, 'Estoque');
    XLSX.utils.book_append_sheet(wb, historicoSheet, 'Movimentações');

    XLSX.writeFile(wb, 'controle_estoque.xlsx');
}

document.getElementById('form-movimentacao').addEventListener('submit', function(event) {
    event.preventDefault();
    const nomeItem = document.getElementById('nome-item').value;
    const quantidade = parseInt(document.getElementById('quantidade').value);
    const dataValidade = document.getElementById('data-validade').value;
    const tipoMovimentacao = document.getElementById('tipo-movimentacao').value;

    if (tipoMovimentacao === 'entrada') {
        adicionarItem(nomeItem, quantidade, dataValidade);
        adicionarEntradaHistorico(nomeItem, quantidade);
    } else if (tipoMovimentacao === 'saida') {
        const index = estoque.findIndex(item => item.nome === nomeItem && item.quantidade >= quantidade && item.dataValidade === dataValidade);
        if (index !== -1) {
            estoque[index].quantidade -= quantidade;
            if (estoque[index].quantidade === 0) {
                estoque.splice(index, 1);
            }
            adicionarSaidaHistorico(nomeItem, quantidade);
        } else {
            alert('Quantidade insuficiente em estoque.');
            return;
        }
    }

    ordenarEstoque();
    atualizarEstoque();
    atualizarHistorico();
});

document.getElementById('exportar-excel').addEventListener('click', function() {
    exportarParaExcel();
});

function salvarDadosCookies() {
    document.cookie = `estoque=${JSON.stringify(estoque)}; expires=${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()}`;
    document.cookie = `historicoMovimentacoes=${JSON.stringify(historicoMovimentacoes)}; expires=${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()}`;
}

function carregarDadosCookies() {
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
        const [name, value] = cookie.split('=');
        if (name === 'estoque') {
            estoque = JSON.parse(value);
        } else if (name === 'historicoMovimentacoes') {
            historicoMovimentacoes = JSON.parse(value);
        }
    }
}

function exportarParaJSON() {
    const data = {
        estoque: estoque,
        historicoMovimentacoes: historicoMovimentacoes
    };
    const jsonData = JSON.stringify(data);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dados_estoque.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importarDeJSON(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const jsonData = event.target.result;
        const data = JSON.parse(jsonData);
        estoque = data.estoque;
        historicoMovimentacoes = data.historicoMovimentacoes;
        atualizarEstoque();
        atualizarHistorico();
    };
    reader.readAsText(file);
}

document.getElementById('exportar-excel').addEventListener('click', function() {
    exportarParaExcel();
    salvarDadosCookies(); 
});

document.getElementById('exportar-json').addEventListener('click', function() {
    exportarParaJSON();
    salvarDadosCookies();
});

document.getElementById('importar-json').addEventListener('change', function(event) {
    const file = event.target.files[0];
    importarDeJSON(file);
});

window.addEventListener('load', function() {
    carregarDadosCookies();
    atualizarEstoque();
    atualizarHistorico();
});

document.getElementById('alternar-tabela').addEventListener('click', function() {
    const estoqueDiv = document.getElementById('estoque');
    const historicoDiv = document.getElementById('historico');
    const tituloTabela = document.getElementById('titulo-tabela');

    if (estoqueDiv.style.display === 'block') {
        estoqueDiv.style.display = 'none';
        historicoDiv.style.display = 'block';
        tituloTabela.textContent = 'Histórico de Movimentações';
    } else {
        estoqueDiv.style.display = 'block';
        historicoDiv.style.display = 'none';
        tituloTabela.textContent = 'Estoque Atual';
    }
});

function confirmarSaida(event) {
    event.preventDefault();
    event.returnValue = '';
    return 'Tem certeza que deseja sair? Se você sair, perderá todos os dados não salvos.';
}

window.addEventListener('beforeunload', confirmarSaida);


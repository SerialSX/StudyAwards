document.addEventListener('DOMContentLoaded', () => {
    const rankingList = document.getElementById('ranking-list');

    fetch('http://localhost:3000/ranking')
        .then(response => {
            if (!response.ok) {
                throw new Error('Não foi possível carregar o ranking.');
            }
            return response.json();
        })
        .then(data => {
            if (data.length === 0) {
                rankingList.innerHTML = '<p>Nenhum usuário no ranking ainda.</p>';
                return;
            }

            data.forEach((user, index) => {
                const listItem = document.createElement('li');
                
                const rankSpan = document.createElement('span');
                rankSpan.className = 'rank';
                rankSpan.textContent = `${index + 1}`;

                const nameSpan = document.createElement('span');
                nameSpan.className = 'name';
                nameSpan.textContent = user.nome;

                const scoreSpan = document.createElement('span');
                scoreSpan.className = 'score';
                scoreSpan.textContent = `${user.pontuacao_total} pts`;

                listItem.appendChild(rankSpan);
                listItem.appendChild(nameSpan);
                listItem.appendChild(scoreSpan);
                
                rankingList.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Erro ao buscar o ranking:', error);
            rankingList.innerHTML = '<p>Erro ao carregar o ranking.</p>';
        });
});
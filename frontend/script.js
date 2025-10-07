document.addEventListener('DOMContentLoaded', () => {
    
    const userId = 1; 

    const scoreElement = document.getElementById('user-score');
    const addScoreBtn = document.getElementById('add-score-btn');
    
    const popupOverlay = document.getElementById('reward-popup-overlay');
    const rewardName = document.getElementById('reward-name');
    const rewardDesc = document.getElementById('reward-desc');
    const closePopupBtn = document.getElementById('close-popup-btn');

    function fetchScore() {
        fetch(`http://localhost:3000/usuarios/${userId}/pontuacao`)
            .then(response => response.json())
            .then(data => {
                scoreElement.textContent = data.pontuacao;
            })
            .catch(error => {
                scoreElement.textContent = 'Erro!';
            });
    }

    function showRewardPopup(recompensa) {
        rewardName.textContent = recompensa.nome;
        rewardDesc.textContent = recompensa.descricao;
        popupOverlay.classList.remove('hidden');
    }

    addScoreBtn.addEventListener('click', () => {
        fetch(`http://localhost:3000/usuarios/${userId}/adicionar-pontos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pontos: 50 }),
        })
        .then(response => response.json())
        .then(data => {
            // Atualiza a pontuação na tela
            scoreElement.textContent = data.novaPontuacao;

            // Se o backend retornou uma nova recompensa, mostra o pop-up
            if (data.novaRecompensa) {
                showRewardPopup(data.novaRecompensa);
            }
        })
        .catch(error => {
            console.error('Erro ao adicionar pontos:', error);
        });
    });

    closePopupBtn.addEventListener('click', () => {
        popupOverlay.classList.add('hidden');
    });

    // Carrega a pontuação inicial ao abrir a página
    fetchScore();
});
